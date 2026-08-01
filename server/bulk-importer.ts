import fetch from 'node-fetch';
import { scrapeAmazonSearch, searchAmazon, MARKETPLACE_DOMAIN } from './amazon-search-scraper';
import { extractAmazonProductData } from './amazon-extractor';
import { importProductReview, updateProductReview } from './seo-engine';
import { getSupabaseAdmin } from './lib/supabase';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 2000;
const DEFAULT_MAX = 1000;
const PARTNER_TAG = 'dawnwire-20';
const DEFAULT_MARKETPLACE = 'US';

export interface BulkImportParams {
  source: 'csv' | 'search' | 'category';
  asins?: string[];
  queries?: string[];
  marketplace?: string;
  maxProducts?: number;
  updateExisting?: boolean;
  adminToken?: string;
}

export interface BulkImportJob {
  id: string;
  source: string;
  status: string;
  totalItems: number;
  processedItems: number;
  succeeded: number;
  failed: number;
  skipped: number;
  params: any;
  result: any;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function extractAsin(input: string): string {
  const match = input.match(/(?:\/dp\/|\/gp\/product\/|\/product\/|ASIN=|\/d\/)([A-Z0-9]{10})/i);
  if (match) return match[1].toUpperCase();
  const trimmed = input.trim().toUpperCase();
  if (/^[A-Z0-9]{10}$/.test(trimmed)) return trimmed;
  return '';
}

function buildDirectAmazonUrl(asin: string, marketplace: string = DEFAULT_MARKETPLACE): string {
  const domainMap: Record<string, string> = {
    US: 'www.amazon.com',
    UK: 'www.amazon.co.uk',
    AE: 'www.amazon.ae',
    SA: 'www.amazon.sa',
    CA: 'www.amazon.ca',
    IN: 'www.amazon.in',
    DE: 'www.amazon.de',
    FR: 'www.amazon.fr',
    IT: 'www.amazon.it',
    ES: 'www.amazon.es',
    JP: 'www.amazon.co.jp',
    AU: 'www.amazon.com.au',
    BR: 'www.amazon.com.br',
    MX: 'www.amazon.com.mx',
  };
  const domain = domainMap[marketplace] || 'www.amazon.com';
  return `https://${domain}/dp/${asin}?tag=${PARTNER_TAG}`;
}

async function getAdminToken(params: BulkImportParams): Promise<string> {
  if (params.adminToken) return params.adminToken;
  const apiUrl = process.env.APP_URL || 'https://www.dawnwire.com';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const res = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    signal: controller.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: process.env.BULK_IMPORT_ADMIN_USER, password: process.env.BULK_IMPORT_ADMIN_PASS }),
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error('Failed to get admin token for bulk import');
  const data = await res.json() as any;
  return data.token;
}

async function createCloakedLink(
  productSlug: string,
  productName: string,
  directUrl: string,
  adminToken: string
): Promise<boolean> {
  try {
    const apiUrl = process.env.APP_URL || 'https://www.dawnwire.com';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${apiUrl}/api/admin/affiliate`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: productName,
        destinationUrl: directUrl,
        affiliateUrl: directUrl,
        shortSlug: productSlug,
        buttonText: 'Buy on Amazon',
        noFollow: true,
        sponsored: true,
        openInNewTab: true,
        status: 'active',
      }),
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function updateJobProgress(jobId: string, updates: Partial<BulkImportJob>): Promise<void> {
  try {
    const sb = await getSupabaseAdmin();
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    const keyMap: Record<string, string> = {
      totalItems: 'total_items',
      processedItems: 'processed_items',
      errorMessage: 'error_message',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = keyMap[key] || key;
      dbUpdates[dbKey] = value;
    }
    const query = sb.from('bulk_import_jobs').update(dbUpdates).eq('id', jobId);
    await withTimeout(query, 5000, { error: null } as any);
  } catch (e) {
    console.error('[BulkImport] DB error updating progress:', e);
  }
}

async function findDuplicateAsin(asin: string): Promise<{ id: string; slug: string } | null> {
  try {
    const sb = await getSupabaseAdmin();
    const query = sb
      .from('product_reviews')
      .select('id, slug')
      .contains('specs', { asin })
      .limit(1)
      .maybeSingle();
    const { data } = await withTimeout(Promise.resolve(query), 5000, { data: null } as any);
    if (data?.id) return { id: data.id, slug: data.slug };
    return null;
  } catch {
    return null;
  }
}

async function findCategoryIdByName(name: string): Promise<string | null> {
  try {
    const sb = await getSupabaseAdmin();
    const { data } = await sb
      .from('categories')
      .select('id')
      .ilike('name', name)
      .limit(1)
      .maybeSingle();
    return data?.id || null;
  } catch {
    return null;
  }
}

export async function startBulkImport(params: BulkImportParams): Promise<BulkImportJob> {
  const marketplace = params.marketplace || DEFAULT_MARKETPLACE;
  const maxProducts = params.maxProducts || DEFAULT_MAX;
  const adminToken = params.adminToken || process.env.BULK_IMPORT_ADMIN_TOKEN || '';

  let totalItems = 0;
  if (params.source === 'csv') {
    totalItems = (params.asins || []).filter(a => extractAsin(a)).length;
  } else if (params.source === 'search') {
    totalItems = Math.min((params.queries || []).length * 50, maxProducts);
  } else if (params.source === 'category') {
    totalItems = Math.min((params.queries || []).length * 50, maxProducts);
  }

  const sb = await getSupabaseAdmin();
  const insertQuery = sb
    .from('bulk_import_jobs')
    .insert({
      source: params.source,
      status: 'pending',
      total_items: totalItems,
      processed_items: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      params: { ...params, adminToken: adminToken ? '[REDACTED]' : '' },
      result: null,
      error_message: null,
    })
    .select()
    .single();
  const { data: job, error } = await withTimeout(insertQuery, 10000, { data: null, error: { message: 'DB insert timeout' } } as any);
  if (error || !job) {
    throw new Error(error?.message || 'Failed to create bulk import job');
  }

  processBulkImport(job.id).catch(err => {
    console.error(`[BulkImport] Job ${job.id} crashed:`, err);
    updateJobProgress(job.id, { status: 'failed', errorMessage: err.message });
  });

  return job as BulkImportJob;
}

export async function processBulkImport(jobId: string): Promise<BulkImportJob> {
  const sb = await getSupabaseAdmin();

  const jobQuery = sb.from('bulk_import_jobs').select('*').eq('id', jobId).single();
  const { data: jobRow } = await withTimeout(jobQuery, 5000, { data: null } as any);
  if (!jobRow) throw new Error(`Job ${jobId} not found`);

  const params = jobRow.params as BulkImportParams;
  const marketplace = params.marketplace || DEFAULT_MARKETPLACE;
  const maxProducts = params.maxProducts || DEFAULT_MAX;
  const updateExisting = params.updateExisting !== false;

  await updateJobProgress(jobId, { status: 'running' });

  const resolvedAsins: string[] = [];

  if (params.source === 'csv') {
    const raw = params.asins || [];
    const seen = new Set<string>();
    for (const item of raw) {
      const asin = extractAsin(item);
      if (asin && !seen.has(asin)) {
        seen.add(asin);
        resolvedAsins.push(asin);
      }
    }
  } else if (params.source === 'search' || params.source === 'category') {
    if (params.asins && params.asins.length > 0) {
      const seen = new Set<string>();
      for (const item of params.asins) {
        const asin = extractAsin(item);
        if (asin && !seen.has(asin)) {
          seen.add(asin);
          resolvedAsins.push(asin);
        }
      }
    } else {
      const queries = params.queries || [];
      const seen = new Set<string>();
      for (const query of queries) {
        try {
          const results = await scrapeAmazonSearch(query, marketplace, 50);
          for (const r of results) {
            if (!seen.has(r.asin)) {
              seen.add(r.asin);
              resolvedAsins.push(r.asin);
            }
          }
        } catch {
          continue;
        }
        if (resolvedAsins.length >= maxProducts) break;
        if (queries.indexOf(query) < queries.length - 1) await sleep(1500);
      }
    }
  }

  resolvedAsins.length = Math.min(resolvedAsins.length, maxProducts);

  await updateJobProgress(jobId, { totalItems: resolvedAsins.length });

  // Pre-fetch all existing slugs once for O(1) dedup across all imports
  let slugSet: Set<string> | null = null;
  try {
    const slugRes = await sb.from('product_reviews').select('slug');
    if (slugRes.data) slugSet = new Set(slugRes.data.map((r: any) => r.slug).filter(Boolean));
  } catch { /* fallback: per-import slug fetch */ }

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];
  const adminToken = params.adminToken || process.env.BULK_IMPORT_ADMIN_TOKEN || '';

  for (let i = 0; i < resolvedAsins.length; i++) {
    const asin = resolvedAsins[i];

    try {
      const dup = await findDuplicateAsin(asin);

      if (dup) {
        if (updateExisting) {
          try {
            const freshData = await extractAmazonProductData(asin, PARTNER_TAG);
            const updates: any = {
              price: String(freshData.currentPrice || ''),
              original_price: String(freshData.referencePrice || ''),
              stock_status: freshData.isDeal ? 'deal' : 'in_stock',
              deal_badge: freshData.isDeal ? 'Amazon Deal' : null,
              product_name: freshData.title,
              brand: freshData.brand,
              product_image: freshData.mainImage,
              best_for: freshData.bestFor || null,
              final_verdict: freshData.editorVerdict || null,
              editor_score: freshData.editorScore || null,
              updated_at: new Date().toISOString(),
            };
            if (freshData.mainCategory) {
              const catId = await findCategoryIdByName(freshData.mainCategory);
              if (catId) updates.category_id = catId;
            }
            if (freshData.images && freshData.images.length) {
              updates.specs = {
                ...((await sb.from('product_reviews').select('specs').eq('id', dup.id).single()).data?.specs || {}),
                gallery: freshData.images.slice(0, 8),
                asin,
                source: 'amazon-bulk-update',
              };
            }
            await updateProductReview(dup.id, updates);
            succeeded++;
          } catch (updateErr) {
            failed++;
            errors.push(`${asin}: update failed - ${updateErr instanceof Error ? updateErr.message : 'unknown'}`);
          }
        } else {
          skipped++;
        }
      } else {
        try {
          const productData = await extractAmazonProductData(asin, PARTNER_TAG);
          const directUrl = buildDirectAmazonUrl(asin, marketplace);

          const mapped: any = {
            product_name: productData.title || `Amazon Product (${asin})`,
            brand: productData.brand || '',
            price: String(productData.currentPrice || ''),
            listPrice: String(productData.referencePrice || ''),
            product_image: productData.mainImage || '',
            gallery: productData.images || [],
            affiliate_url: directUrl,
            amazon_url: `https://${MARKETPLACE_DOMAIN[marketplace] || 'www.amazon.com'}/dp/${asin}`,
            review_summary: productData.shortDescription || productData.fullDescription || '',
            pros: productData.pros || [],
            cons: productData.cons || [],
            key_features: productData.mainFeatures || [],
            specs: {
              asin,
              source: 'amazon-bulk-import',
              marketplace,
              availability: 'available',
              ...(productData.specifications || {}),
            },
            stock_status: productData.isDeal ? 'deal' : 'in_stock',
            deal_badge: productData.isDeal ? 'Amazon Deal' : null,
            best_for: productData.bestFor || null,
            final_verdict: productData.editorVerdict || null,
            editor_score: productData.editorScore || null,
            is_featured: false,
            is_deal: !!productData.isDeal,
            status: 'published',
            rating: productData.rating || 0,
            review_count: productData.reviewCount || 0,
          };

          if (productData.mainCategory) {
            const catId = await findCategoryIdByName(productData.mainCategory);
            if (catId) mapped.category_id = catId;
          }

          if (productData.videoUrl) {
            mapped.specs.video_url = productData.videoUrl;
          }

          const created = await importProductReview({ ...mapped, slugSet });

          if (adminToken) {
            await createCloakedLink(created.slug, created.product_name, directUrl, adminToken).catch(() => {});
          }

          // Auto-process: fill brand/category/SEO for the newly created product
          try {
            const { autoProcessProduct } = await import('./auto-import');
            await autoProcessProduct(created.id);
          } catch (e: any) {
            console.warn('[BulkImporter] auto-process failed for', created.id, e.message);
          }

          succeeded++;
        } catch (createErr) {
          failed++;
          errors.push(`${asin}: import failed - ${createErr instanceof Error ? createErr.message : 'unknown'}`);
        }
      }
    } catch (err) {
      failed++;
      errors.push(`${asin}: ${err instanceof Error ? err.message : 'unknown error'}`);
    }

    const processed = i + 1;
    await updateJobProgress(jobId, {
      processedItems: processed,
      succeeded,
      failed,
      skipped,
      result: { errors: errors.slice(-50) },
    });

    if (i < resolvedAsins.length - 1) {
      if ((i + 1) % BATCH_SIZE === 0) {
        await sleep(BATCH_DELAY_MS);
      } else {
        await sleep(300);
      }
    }
  }

  const finalStatus = failed > 0 && succeeded === 0 ? 'failed' : 'completed';
  await updateJobProgress(jobId, {
    status: finalStatus,
    processedItems: resolvedAsins.length,
    succeeded,
    failed,
    skipped,
    result: { errors },
  });

  const finalQuery = sb.from('bulk_import_jobs').select('*').eq('id', jobId).single();
  const { data: finalJob } = await withTimeout(finalQuery, 5000, { data: null } as any);
  return finalJob as BulkImportJob;
}

function withTimeout<T>(promise: Promise<T> | { then: (onFulfilled: (value: T) => void, onRejected?: (reason: any) => void) => any }, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallback);
      }
    }, ms);
    Promise.resolve(promise as any).then(
      (value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(value);
        }
      },
      () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      }
    );
  });
}

export async function getBulkImportJob(jobId: string): Promise<BulkImportJob | null> {
  try {
    const sb = await getSupabaseAdmin();
    const query = sb.from('bulk_import_jobs').select('*').eq('id', jobId).single();
    const { data } = await withTimeout(Promise.resolve(query), 3000, { data: null } as any);
    return data ? (data as BulkImportJob) : null;
  } catch {
    return null;
  }
}

export async function cancelBulkImport(jobId: string): Promise<boolean> {
  try {
    const sb = await getSupabaseAdmin();
    const query = sb.from('bulk_import_jobs').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', jobId);
    await withTimeout(Promise.resolve(query), 3000, { error: null } as any);
    return true;
  } catch {
    return false;
  }
}
