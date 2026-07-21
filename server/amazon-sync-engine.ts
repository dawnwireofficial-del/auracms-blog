import crypto from 'crypto';
import { dbInstance } from './db';
import { AmazonCredentials, AmazonProductData, getItemsByAsin, extractAsinFromUrl, getMarketplaceDomain } from './amazon-api-client';
import type { AmazonApiConfig } from './amazon-api-client';

interface SyncJob {
  productId: string;
  asin: string;
  marketplaceCode: string;
  priority: number;
  partnerTag: string;
  isManual: boolean;
}

interface SyncResult {
  productId: string;
  asin: string;
  success: boolean;
  data?: AmazonProductData;
  error?: string;
  durationMs: number;
}

let isRunning = false;
let isPaused = false;
let currentBatchId: string | null = null;
let syncTimer: ReturnType<typeof setInterval> | null = null;
let hourlyRequestCount = 0;
let hourlyResetTime = Date.now();

const MAX_RETRIES = 3;
const BATCH_SIZE = 10;
const MAX_HOURLY_REQUESTS = 360;

function generateBatchId(): string {
  return crypto.randomUUID();
}

function resetHourlyCounter() {
  const now = Date.now();
  if (now - hourlyResetTime > 3600000) {
    hourlyRequestCount = 0;
    hourlyResetTime = now;
  }
}

async function canMakeRequest(): Promise<boolean> {
  resetHourlyCounter();
  return hourlyRequestCount < MAX_HOURLY_REQUESTS;
}

async function updateApiUsage(requestsUsed: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sb = await (dbInstance as any).ready?.();
    if (sb) {
      const { data: existing } = await sb.from('amazon_api_usage')
        .select('*')
        .eq('date', today)
        .maybeSingle();
      if (existing) {
        await sb.from('amazon_api_usage')
          .update({ requests_used: (existing.requests_used || 0) + requestsUsed })
          .eq('date', today);
      } else {
        await sb.from('amazon_api_usage')
          .insert({ date: today, requests_used: requestsUsed, requests_limit: 8640 });
      }
    }
  } catch {}
}

async function getSettings(): Promise<any> {
  try {
    const sb = await (dbInstance as any).ready?.();
    if (!sb) return null;
    const { data } = await sb.from('amazon_sync_settings').select('*').limit(1).maybeSingle();
    return data;
  } catch { return null; }
}

async function getCredentials(marketplaceCode: string): Promise<AmazonCredentials | null> {
  try {
    const sb = await (dbInstance as any).ready?.();
    if (!sb) return null;
    const { data } = await sb.from('amazon_api_credentials')
      .select('*')
      .eq('marketplace_code', marketplaceCode)
      .eq('is_active', true)
      .maybeSingle();
    if (!data) return null;
    return {
      accessKey: data.access_key,
      secretKey: data.secret_key,
      partnerTag: data.partner_tag,
      marketplace: marketplaceCode,
    };
  } catch { return null; }
}

async function getMarketplaceEndpoint(code: string): Promise<string | null> {
  try {
    const sb = await (dbInstance as any).ready?.();
    if (!sb) return null;
    const { data } = await sb.from('amazon_marketplaces')
      .select('paapi_endpoint, region')
      .eq('code', code)
      .maybeSingle();
    if (!data) return null;
    return data.paapi_endpoint;
  } catch { return null; }
}

async function getMarketplaceRegion(code: string): Promise<string | null> {
  try {
    const sb = await (dbInstance as any).ready?.();
    if (!sb) return null;
    const { data } = await sb.from('amazon_marketplaces')
      .select('region')
      .eq('code', code)
      .maybeSingle();
    if (!data) return null;
    return data.region;
  } catch { return null; }
}

async function buildApiConfig(marketplaceCode: string): Promise<AmazonApiConfig | null> {
  const credentials = await getCredentials(marketplaceCode);
  if (!credentials) return null;
  const endpoint = await getMarketplaceEndpoint(marketplaceCode);
  if (!endpoint) return null;
  const region = await getMarketplaceRegion(marketplaceCode);
  if (!region) return null;
  return { credentials, region, endpoint };
}

async function loadPendingJobs(settings: any, limit: number): Promise<SyncJob[]> {
  const sb = await (dbInstance as any).ready?.();
  if (!sb) return [];

  // Priority order: manual > high priority > recently viewed > deal > featured > standard
  let q = sb.from('amazon_sync_status')
    .select('*, product_reviews!inner(id, asin, marketplace_code, partner_tag, affiliate_url)')
    .in('sync_status', ['pending', 'queued', 'failed'])
    .lt('retry_count', settings?.max_retries || MAX_RETRIES)
    .order('priority', { ascending: false })
    .order('last_sync_at', { ascending: true, nullsFirst: true })
    .limit(limit);

  const { data, error } = await q;
  if (error || !data) return [];

  return data.map((r: any) => {
    const pr = r.product_reviews || {};
    return {
      productId: r.product_id,
      asin: r.asin,
      marketplaceCode: r.marketplace_code || 'US',
      priority: r.priority || 0,
      partnerTag: r.partner_tag || pr.partner_tag || '',
      isManual: false,
    };
  });
}

async function syncProduct(
  job: SyncJob,
  settings: any
): Promise<SyncResult> {
  const startTime = Date.now();
  const sb = await (dbInstance as any).ready?.();

  try {
    await sb?.from('amazon_sync_status')
      .update({ sync_status: 'syncing', updated_at: new Date().toISOString() })
      .eq('product_id', job.productId);

    const config = await buildApiConfig(job.marketplaceCode);
    if (!config) {
      return { productId: job.productId, asin: job.asin, success: false, error: 'No API credentials for marketplace', durationMs: Date.now() - startTime };
    }
    if (job.partnerTag) {
      config.credentials.partnerTag = job.partnerTag;
    }

    hourlyRequestCount++;
    const results = await getItemsByAsin(config, [job.asin]);
    await updateApiUsage(1);

    const productData = results[0];
    if (!productData) {
      return { productId: job.productId, asin: job.asin, success: false, error: 'Product not found via PA-API', durationMs: Date.now() - startTime };
    }

    const now = new Date().toISOString();
    const updates: Record<string, any> = {
      sync_status: 'success',
      last_sync_at: now,
      last_successful_sync_at: now,
      sync_count: sb.raw ? sb.raw('sync_count + 1') : undefined,
      error_count: 0,
      retry_count: 0,
      last_error_message: null,
      last_error_at: null,
      is_asin_valid: true,
      asin_flagged: false,
      updated_at: now,
    };

    if (productData.title) {
      updates.product_title = productData.title;
    }
    if (productData.brand) updates.brand = productData.brand;
    if (productData.mainImage) updates.main_image = productData.mainImage;
    if (productData.additionalImages?.length) updates.additional_images = productData.additionalImages;
    if (productData.features?.length) updates.product_features = productData.features;
    if (productData.category) updates.product_category = productData.category;
    if (productData.productUrl) updates.product_url = productData.productUrl;
    if (productData.affiliateUrl) updates.affiliate_url = productData.affiliateUrl;
    if (productData.currency) updates.currency = productData.currency;
    if (productData.variations?.length) updates.variations = productData.variations;
    if (productData.availability) updates.availability = productData.availability;
    if (productData.isAvailable !== undefined) updates.is_available = productData.isAvailable;
    if (productData.isDeal !== undefined) updates.is_deal = productData.isDeal;
    if (productData.dealPrice != null) updates.deal_price = productData.dealPrice;
    if (productData.isPrimeDeal !== undefined) updates.is_prime_deal = productData.isPrimeDeal;
    if (productData.dealEndTime) updates.deal_end_time = productData.dealEndTime;
    if (productData.referencePrice != null) updates.reference_price = productData.referencePrice;

    // Handle price update with history tracking
    if (productData.price != null) {
      const { data: existing } = await sb?.from('amazon_sync_status')
        .select('current_price, previous_price, currency')
        .eq('product_id', job.productId)
        .maybeSingle() || {};

      if (existing) {
        const oldPrice = existing.current_price != null ? Number(existing.current_price) : undefined;
        const newPrice = productData.price;

        if (oldPrice !== undefined && oldPrice !== newPrice) {
          updates.previous_price = oldPrice;
          updates.previous_price_updated_at = existing.current_price_updated_at || now;
        }

        // Record price change
        if (oldPrice !== undefined && oldPrice !== newPrice) {
          const changeType = newPrice < oldPrice ? 'price_drop' : 'price_increase';
          await sb?.from('amazon_price_history').insert({
            product_id: job.productId,
            asin: job.asin,
            old_price: oldPrice,
            new_price: newPrice,
            old_reference_price: existing.reference_price ? Number(existing.reference_price) : null,
            new_reference_price: productData.referencePrice || null,
            currency: productData.currency || existing.currency,
            is_deal: productData.isDeal,
            change_type: changeType,
          });
        }
      }

      updates.current_price = productData.price;
      updates.current_price_updated_at = now;
    }

    if (Object.keys(updates).length > 2) {
      await sb?.from('amazon_sync_status')
        .update(updates)
        .eq('product_id', job.productId);
    }

    // Update product_reviews table with synced fields (only fields in auto_overwrite)
    const overwriteFields = settings?.fields_auto_overwrite || [
      'price', 'availability', 'deal_status', 'product_title', 'product_image',
      'additional_images', 'brand', 'currency', 'is_prime_deal'
    ];
    const productUpdates: Record<string, any> = {};

    if (overwriteFields.includes('price') && productData.price != null) {
      productUpdates.price = productData.price.toString();
      if (productData.referencePrice != null) {
        productUpdates.original_price = productData.referencePrice.toString();
      }
      if (productData.discountPercent != null) {
        productUpdates.discount_percentage = Math.round(productData.discountPercent);
      }
    }
    if (overwriteFields.includes('availability') && productData.availability) {
      const stockMap: Record<string, string> = {
        'InStock': 'in_stock',
        'Available': 'in_stock',
        'In Stock': 'in_stock',
        'OutOfStock': 'out_of_stock',
        'Currently unavailable': 'out_of_stock',
        'Limited': 'limited_stock',
        'Usually dispatched within': 'low_stock',
      };
      productUpdates.stock_status = stockMap[productData.availability] || 'in_stock';
    }
    if (overwriteFields.includes('deal_status') && productData.isDeal) {
      productUpdates.is_deal = true;
      if (productData.dealPrice != null) {
        productUpdates.original_price = productUpdates.original_price || productUpdates.price;
        productUpdates.price = productData.dealPrice.toString();
      }
      productUpdates.deal_badge = productData.isPrimeDeal ? '🔥 Prime Deal' : (productData.discountPercent ? `-${Math.round(productData.discountPercent)}%` : '🔥 Deal');
    } else if (overwriteFields.includes('deal_status') && !productData.isDeal) {
      productUpdates.is_deal = false;
      productUpdates.deal_badge = null;
    }
    if (overwriteFields.includes('product_title') && productData.title) {
      productUpdates.product_name = productData.title;
    }
    if (overwriteFields.includes('product_image') && productData.mainImage) {
      productUpdates.product_image = productData.mainImage;
    }
    if (overwriteFields.includes('additional_images') && productData.additionalImages?.length) {
      productUpdates.gallery = productData.additionalImages;
    }
    if (overwriteFields.includes('brand') && productData.brand) {
      productUpdates.brand = productData.brand;
    }
    if (overwriteFields.includes('currency')) {
      // currency is not a column on product_reviews directly, store in specs
    }
    if (overwriteFields.includes('is_prime_deal')) {
      // stored on amazon_sync_status.is_prime_deal
    }

    if (Object.keys(productUpdates).length > 0) {
      productUpdates.price_updated_at = now;
      productUpdates.last_updated_at = now;
      await sb?.from('product_reviews')
        .update(productUpdates)
        .eq('id', job.productId);
    }

    // Schedule next sync
    const interval = job.isManual ? null : getNextSyncInterval(job.priority, settings);
    if (interval) {
      const nextSync = new Date(Date.now() + interval * 60000).toISOString();
      await sb?.from('amazon_sync_status')
        .update({ next_sync_at: nextSync })
        .eq('product_id', job.productId);
    }

    return { productId: job.productId, asin: job.asin, success: true, data: productData, durationMs: Date.now() - startTime };
  } catch (err: any) {
    const now = new Date().toISOString();
    const errorMessage = err.message || 'Unknown error';
    const errorCode = err.code || 'UNKNOWN';

    await sb?.from('amazon_sync_status').update({
      sync_status: 'failed',
      error_count: sb.raw ? sb.raw('error_count + 1') : undefined,
      last_error_message: errorMessage.substring(0, 500),
      last_error_at: now,
      retry_count: sb.raw ? sb.raw('retry_count + 1') : undefined,
      updated_at: now,
    }).eq('product_id', job.productId);

    return { productId: job.productId, asin: job.asin, success: false, error: errorMessage, durationMs: Date.now() - startTime };
  }
}

function getNextSyncInterval(priority: number, settings: any): number | null {
  if (!settings?.auto_sync_enabled) return null;
  const base = settings.sync_interval_minutes || 60;
  if (priority >= 100) return settings.fast_sync_interval_minutes || 15;
  if (priority >= 50) return settings.deal_sync_interval_minutes || 30;
  if (priority >= 25) return settings.featured_sync_interval_minutes || 30;
  return base;
}

async function logSyncResult(result: SyncResult, batchId: string): Promise<void> {
  try {
    const sb = await (dbInstance as any).ready?.();
    if (!sb) return;
    await sb.from('amazon_sync_logs').insert({
      batch_id: batchId,
      product_id: result.productId,
      asin: result.asin,
      action: result.success ? 'sync' : 'sync_failed',
      status: result.success ? 'success' : 'failed',
      error_message: result.error,
      duration_ms: result.durationMs,
    });
  } catch {}
}

async function processBatch(settings: any): Promise<SyncResult[]> {
  if (isPaused) return [];

  const batchId = generateBatchId();
  currentBatchId = batchId;

  const jobs = await loadPendingJobs(settings, BATCH_SIZE);
  if (jobs.length === 0) return [];

  const results: SyncResult[] = [];
  for (const job of jobs) {
    if (isPaused) break;
    if (!(await canMakeRequest())) {
      break;
    }

    const result = await syncProduct(job, settings);
    results.push(result);
    await logSyncResult(result, batchId);

    if (result.success) {
      await checkPriceAlerts(job.productId, result.data);
    }
  }

  currentBatchId = null;
  return results;
}

async function checkPriceAlerts(productId: string, data?: AmazonProductData): Promise<void> {
  if (!data?.price) return;
  try {
    const { getActiveAlerts, markAlertTriggered } = await import('./db/price-alerts-db');
    const { sendPriceDropAlertEmail } = await import('./email');
    const alerts = await getActiveAlerts();
    const productAlerts = alerts.filter(a => a.productId === productId && data.price! <= (a.targetPrice || 0));
    
    for (const alert of productAlerts) {
      await sendPriceDropAlertEmail(
        alert.email, 
        data.title || 'Product', 
        (data as any).affiliate_url || '#', 
        alert.currentPrice, 
        data.price
      );
      await markAlertTriggered(alert.id);
    }
  } catch (e) {
    console.error('Error processing price alerts:', e);
  }
}

export async function processSyncCycle(): Promise<{ processed: number; succeeded: number; failed: number }> {
  if (isPaused || isRunning) return { processed: 0, succeeded: 0, failed: 0 };
  isRunning = true;

  try {
    const settings = await getSettings();
    if (!settings?.auto_sync_enabled) {
      isRunning = false;
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    const results = await processBatch(settings);
    let succeeded = 0;
    let failed = 0;

    for (const r of results) {
      if (r.success) succeeded++;
      else failed++;
    }

    return { processed: results.length, succeeded, failed };
  } finally {
    isRunning = false;
  }
}

// ====== Manual Sync Controls ======

export async function syncProductById(productId: string): Promise<SyncResult> {
  const sb = await (dbInstance as any).ready?.();
  if (!sb) return { productId, asin: '', success: false, error: 'DB not ready', durationMs: 0 };

  const { data: status } = await sb.from('amazon_sync_status')
    .select('*, product_reviews!inner(id, asin)')
    .eq('product_id', productId)
    .maybeSingle();

  if (!status) {
    return { productId, asin: '', success: false, error: 'Product not found in sync status', durationMs: 0 };
  }

  const pr = status.product_reviews || {};
  const job: SyncJob = {
    productId: status.product_id,
    asin: status.asin,
    marketplaceCode: status.marketplace_code || 'US',
    priority: 999,
    partnerTag: status.partner_tag || '',
    isManual: true,
  };

  const settings = await getSettings();
  return syncProduct(job, settings);
}

export async function syncSelectedProducts(productIds: string[]): Promise<{ results: SyncResult[] }> {
  const results: SyncResult[] = [];
  for (const id of productIds) {
    const result = await syncProductById(id);
    results.push(result);
  }
  return { results };
}

export async function syncCategory(categoryId: string): Promise<{ results: SyncResult[] }> {
  const sb = await (dbInstance as any).ready?.();
  if (!sb) return { results: [] };

  const { data } = await sb.from('amazon_sync_status')
    .select('product_id')
    .eq('product_reviews.category_id', categoryId);
  
  const productIds = (data || []).map((r: any) => r.product_id);
  return syncSelectedProducts(productIds);
}

export async function syncFeaturedProducts(): Promise<{ results: SyncResult[] }> {
  const sb = await (dbInstance as any).ready?.();
  if (!sb) return { results: [] };

  const { data } = await sb.from('amazon_sync_status')
    .select('product_id')
    .eq('product_reviews.is_featured', true);
  
  const productIds = (data || []).map((r: any) => r.product_id);
  return syncSelectedProducts(productIds);
}

export async function syncAllProducts(): Promise<{ total: number; results: SyncResult[] }> {
  const sb = await (dbInstance as any).ready?.();
  if (!sb) return { total: 0, results: [] };

  // Queue all products with pending/queued/failed status
  await sb.from('amazon_sync_status')
    .update({ sync_status: 'queued', updated_at: new Date().toISOString() })
    .in('sync_status', ['pending', 'failed']);

  const { data } = await sb.from('amazon_sync_status')
    .select('product_id')
    .eq('sync_status', 'queued');

  const productIds = (data || []).map((r: any) => r.product_id);
  return syncSelectedProducts(productIds).then(r => ({ total: productIds.length, results: r.results }));
}

// ====== Pause/Resume ======

export function pauseSync(): void {
  isPaused = true;
}

export function resumeSync(): void {
  isPaused = false;
}

export function isSyncPaused(): boolean {
  return isPaused;
}

export function isSyncRunning(): boolean {
  return isRunning;
}

export function getCurrentBatchId(): string | null {
  return currentBatchId;
}

// ====== Initial Setup: Link existing products ======

export async function initializeExistingProducts(): Promise<{ matched: number; failed: number; duplicates: number }> {
  const sb = await (dbInstance as any).ready?.();
  if (!sb) return { matched: 0, failed: 0, duplicates: 0 };

  const { data: products } = await sb.from('product_reviews')
    .select('id, affiliate_url, amazon_url, asin, specs')
    .limit(1000);

  if (!products) return { matched: 0, failed: 0, duplicates: 0 };

  let matched = 0;
  let failed = 0;
  let duplicates = 0;
  const seenAsins = new Set<string>();

  for (const product of products) {
    let asin = product.asin;

    if (!asin) {
      const url = product.affiliate_url || product.amazon_url || '';
      asin = extractAsinFromUrl(url) || '';

      if (!asin) {
        const specs = product.specs || {};
        asin = extractAsinFromUrl((specs as any).asin || '') || '';
      }

      if (!asin) {
        failed++;
        continue;
      }

      // Save ASIN to product_reviews
      await sb.from('product_reviews')
        .update({ asin })
        .eq('id', product.id);
    }

    if (!asin) {
      failed++;
      continue;
    }

    // Check for duplicate ASINs
    if (seenAsins.has(asin)) {
      duplicates++;
    }
    seenAsins.add(asin);

    // Extract marketplace from URL
    const url = product.affiliate_url || product.amazon_url || '';
    let marketplaceCode = 'US';
    let partnerTag = process.env.AMAZON_PARTNER_TAG || 'dawnwire-20';

    try {
      if (url) {
        const { getMarketplaceFromDomain, extractPartnerTagFromUrl } = await import('./amazon-api-client');
        const hostname = new URL(url).hostname;
        marketplaceCode = getMarketplaceFromDomain(hostname);
        const tag = extractPartnerTagFromUrl(url);
        if (tag) partnerTag = tag;
      }
    } catch {}

    // Create or update sync status
    const { data: existing } = await sb.from('amazon_sync_status')
      .select('id')
      .eq('product_id', product.id)
      .maybeSingle();

    if (!existing) {
      await sb.from('amazon_sync_status').insert({
        product_id: product.id,
        asin,
        marketplace_code: marketplaceCode,
        partner_tag: partnerTag,
        sync_status: 'pending',
        priority: 0,
      });
    }

    matched++;
  }

  return { matched, failed, duplicates };
}

// ====== Scheduler ======

export async function runScheduledSync(): Promise<{ processed: number; succeeded: number; failed: number }> {
  if (isPaused) return { processed: 0, succeeded: 0, failed: 0 };

  // First, queue products that are due for sync
  try {
    const sb = await (dbInstance as any).ready?.();
    if (sb) {
      await sb.from('amazon_sync_status')
        .update({ sync_status: 'queued', updated_at: new Date().toISOString() })
        .lte('next_sync_at', new Date().toISOString())
        .eq('sync_status', 'success');
    }
  } catch {}

  return processSyncCycle();
}

// ====== Dashboard Stats ======

export async function getSyncDashboardStats(): Promise<any> {
  const sb = await (dbInstance as any).ready?.();
  if (!sb) return null;

  const { data: all } = await sb.from('amazon_sync_status').select('*');
  if (!all) return null;

  const totalConnected = all.length;
  const synced = all.filter((s: any) => s.sync_status === 'success').length;
  const pending = all.filter((s: any) => s.sync_status === 'pending' || s.sync_status === 'queued').length;
  const missingAsin = all.filter((s: any) => !s.asin || s.asin_flagged).length;
  const invalidAsin = all.filter((s: any) => !s.is_asin_valid).length;
  const duplicateAsins = findDuplicateAsins(all);
  const unavailable = all.filter((s: any) => !s.is_available).length;
  const withPriceChanges = all.filter((s: any) => s.previous_price && s.current_price && Number(s.previous_price) !== Number(s.current_price)).length;
  const withExpiredDeals = all.filter((s: any) => s.is_deal && s.deal_end_time && new Date(s.deal_end_time) < new Date()).length;
  const withErrors = all.filter((s: any) => s.sync_status === 'failed').length;

  const lastSync = all.reduce((latest: string | null, s: any) => {
    if (s.last_successful_sync_at && (!latest || s.last_successful_sync_at > latest)) return s.last_successful_sync_at;
    return latest;
  }, null);

  const nextSync = all.reduce((earliest: string | null, s: any) => {
    if (s.next_sync_at && (!earliest || s.next_sync_at < earliest)) return s.next_sync_at;
    return earliest;
  }, null);

  const { data: usage } = await sb.from('amazon_api_usage')
    .select('*')
    .eq('date', new Date().toISOString().split('T')[0])
    .maybeSingle();

  return {
    totalConnected,
    successfullySynced: synced,
    pending,
    missingAsin,
    invalidAsin,
    duplicateAsins: duplicateAsins.length,
    duplicateAsinList: duplicateAsins,
    unavailableProducts: unavailable,
    changedPrices: withPriceChanges,
    expiredDeals: withExpiredDeals,
    apiErrors: withErrors,
    lastSuccessfulSync: lastSync,
    nextScheduledSync: nextSync,
    apiRequestsToday: usage?.requests_used || 0,
    apiRequestLimit: usage?.requests_limit || 8640,
    isPaused,
    isRunning,
  };
}

function findDuplicateAsins(records: any[]): { asin: string; productIds: string[] }[] {
  const asinMap = new Map<string, string[]>();
  for (const r of records) {
    if (!r.asin) continue;
    if (!asinMap.has(r.asin)) asinMap.set(r.asin, []);
    asinMap.get(r.asin)!.push(r.product_id);
  }
  return Array.from(asinMap.entries())
    .filter(([, ids]) => ids.length > 1)
    .map(([asin, productIds]) => ({ asin, productIds }));
}

export async function getProductSyncDetails(productId: string): Promise<any> {
  const sb = await (dbInstance as any).ready?.();
  if (!sb) return null;

  const { data: status } = await sb.from('amazon_sync_status')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();

  if (!status) return null;

  const { data: priceHistory } = await sb.from('amazon_price_history')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: lastLogs } = await sb.from('amazon_sync_logs')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(5);

  return { ...status, priceHistory: priceHistory || [], lastLogs: lastLogs || [] };
}

// ====== Env-based credentials ======
