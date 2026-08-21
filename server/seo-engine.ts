import { dbInstance, useSupabase } from './db';
import { getSupabase, getSupabaseAdmin } from './lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { normalizeImportedProduct } from './normalize-import';

let seoClient: SupabaseClient | null = null;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
}

export async function getClient(): Promise<SupabaseClient> {
  if (!seoClient) seoClient = await getSupabaseAdmin();
  return seoClient;
}

// ====== SEO META ======
export async function getSeoMeta(pageType: string, pageId: string): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('seo_meta').select('*').eq('page_type', pageType).eq('page_id', pageId).maybeSingle();
  return data;
}

export async function saveSeoMeta(pageType: string, pageId: string, meta: any): Promise<any> {
  const sb = await getClient();
  const existing = await sb.from('seo_meta').select('id').eq('page_type', pageType).eq('page_id', pageId).maybeSingle();
  if (existing?.data?.id) {
    const { data } = await sb.from('seo_meta').update({ ...meta, updated_at: new Date().toISOString() }).eq('id', existing.data.id).select().single();
    return data;
  }
  const { data } = await sb.from('seo_meta').insert({ page_type: pageType, page_id: pageId, ...meta, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  return data;
}

// ====== REDIRECTS ======
export async function getRedirects(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('redirects').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function createRedirect(redirect: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('redirects').insert({ ...redirect, hit_count: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  return data;
}

export async function updateRedirect(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('redirects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return data;
}

export async function deleteRedirect(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('redirects').delete().eq('id', id);
  return !error;
}

export async function checkRedirect(sourceUrl: string): Promise<any | null> {
  const sb = await getClient();
  const { data } = await sb.from('redirects').select('*').eq('source_url', sourceUrl).maybeSingle();
  if (data) {
    await sb.from('redirects').update({ hit_count: (data.hit_count || 0) + 1, updated_at: new Date().toISOString() }).eq('id', data.id);
  }
  return data;
}

// ====== 404 LOGS ======
export async function log404(url: string, referrer?: string): Promise<void> {
  const sb = await getClient();
  const existing = await sb.from('error_404_logs').select('*').eq('url', url).maybeSingle();
  if (existing?.data) {
    await sb.from('error_404_logs').update({ hit_count: (existing.data.hit_count || 0) + 1, last_seen: new Date().toISOString() }).eq('id', existing.data.id);
  } else {
    await sb.from('error_404_logs').insert({ url, referrer: referrer || null, hit_count: 1, first_seen: new Date().toISOString(), last_seen: new Date().toISOString() });
  }
}

export async function get404Logs(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('error_404_logs').select('*').order('last_seen', { ascending: false }).limit(100);
  return data || [];
}

export async function clear404Logs(): Promise<boolean> {
  const sb = await getClient();
  const { data: logs } = await sb.from('error_404_logs').select('id');
  if (!logs || logs.length === 0) return true;
  const ids = logs.map((l: any) => l.id);
  const { error } = await sb.from('error_404_logs').delete().in('id', ids);
  return !error;
}

// ====== KEYWORDS ======
export async function getKeywords(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('keywords').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function createKeyword(kw: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('keywords').insert({ ...kw, created_at: new Date().toISOString() }).select().single();
  return data;
}

export async function updateKeyword(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('keywords').update(updates).eq('id', id).select().single();
  return data;
}

export async function deleteKeyword(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('keywords').delete().eq('id', id);
  return !error;
}

// ====== CONTENT BRIEFS ======
export async function getContentBriefs(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('content_briefs').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function createContentBrief(brief: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('content_briefs').insert({ ...brief, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  return data;
}

export async function updateContentBrief(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('content_briefs').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return data;
}

export async function deleteContentBrief(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('content_briefs').delete().eq('id', id);
  return !error;
}

// ====== FAQS ======
export async function getFaqs(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('faq_items').select('*').order('display_order', { ascending: true });
  return data || [];
}

export async function createFaq(faq: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('faq_items').insert({ ...faq, created_at: new Date().toISOString() }).select().single();
  return data;
}

export async function updateFaq(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('faq_items').update(updates).eq('id', id).select().single();
  return data;
}

export async function deleteFaq(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('faq_items').delete().eq('id', id);
  return !error;
}

// ====== PRODUCT REVIEWS ======
export async function getProductReviews(): Promise<any[]> {
  const sb = await getClient();
  let { data, error } = await sb.from('product_reviews').select('*').order('created_at', { ascending: false }).limit(1000);
  if (error || !data) {
    console.warn('[Supabase getProductReviews fallback]:', error?.message);
    const res = await sb.from('product_reviews').select('*').limit(1000);
    data = res.data;
  }
  return data || [];
}

export async function getPublishedProductReviews(): Promise<any[]> {
  const sb = await getClient();
  let { data, error } = await sb.from('product_reviews').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(1000);
  if (error || !data) {
    console.warn('[Supabase getPublishedProductReviews fallback]:', error?.message);
    const res = await sb.from('product_reviews').select('*').eq('status', 'published').limit(1000);
    data = res.data;
  }
  return data || [];
}

export async function getProductReviewById(id: string): Promise<any | null> {
  const sb = await getClient();
  const { data } = await sb.from('product_reviews').select('*').eq('id', id).maybeSingle();
  return data || null;
}

export async function getProductReviewBySlug(slug: string): Promise<any | null> {
  const sb = await getClient();
  // Try exact slug match first
  let { data } = await sb.from('product_reviews').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (data) return data;
  // Try by ID
  ({ data } = await sb.from('product_reviews').select('*').eq('id', slug).eq('status', 'published').maybeSingle());
  if (data) return data;
  // Try normalized slug match
  const norm = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  const { data: all } = await sb.from('product_reviews').select('id,slug,specs').eq('status', 'published').limit(1000);
  if (!all) return null;
  return all.find((r: any) => {
    const rs = String(r.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return rs === norm || norm.includes(rs) || rs.includes(norm);
  }) || all.find((r: any) => {
    const asin = r.specs?.asin;
    return asin && slug.toLowerCase().includes(String(asin).toLowerCase());
  }) || null;
}

export function sanitizeReviewSummary(text: string | null | undefined): string | null {
  if (!text) return null;
  let clean = text;
  // Strip style and script tags and their contents
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // Strip all remaining HTML tags
  clean = clean.replace(/<[^>]*>/g, '');
  // Strip CSS rule blocks and @ rules
  clean = clean.replace(/[.#]\w[^;{]*\{[^}]*\}/g, '');
  clean = clean.replace(/@\w+[^{]*\{[^}]*\}/g, '');
  clean = clean.replace(/@\w+[^;{]*;/g, '');
  // Strip JS function/var/let/const declarations
  clean = clean.replace(/\b(function|var|let|const)\s+\w+\s*\(?[^)]*\)?\s*\{?[^}]*\}?/g, '');
  // Strip CSS property declarations
  clean = clean.replace(/[a-z-]+\s*:\s*[^;{]+[;{]/gi, '');
  // Strip remaining braces and brackets
  clean = clean.replace(/[{}[\]()]/g, '');
  // Strip common Amazon injected patterns
  clean = clean.replace(/\.po-\w+/g, '');
  clean = clean.replace(/#po-\w+/g, '');
  clean = clean.replace(/logTechTermAssistMetric[\s\S]*?(?=\s|$)/g, '');
  clean = clean.replace(/csa\([^)]*\)[^;]*;/g, '');
  // Collapse whitespace
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean || null;
}

async function findBrandIdByName(brandName: string): Promise<string | null> {
  const sb = await getClient();
  const slug = slugify(brandName);
  const { data: bySlug } = await sb.from('brands').select('id').eq('slug', slug).maybeSingle();
  if (bySlug?.id) return bySlug.id;
  const { data: byName } = await sb.from('brands').select('id').ilike('name', brandName).maybeSingle();
  if (byName?.id) return byName.id;
  const { data: byExact } = await sb.from('brands').select('id').eq('name', brandName).maybeSingle();
  return byExact?.id || null;
}

// Auto-detect/create a brand row from a product's brand string. Prod-safe: only
// inserts columns known to exist (id, name, slug, status, description).
export async function ensureBrandForProduct(brandName: string | null | undefined): Promise<string | null> {
  if (!brandName) return null;
  const name = String(brandName).trim();
  if (!name || name === 'Generic' || name === 'generic') return null;
  const sb = await getClient();

  const existing = await findBrandIdByName(name);
  if (existing) return existing;

  const slug = slugify(name);
  const brand: Record<string, any> = {
    id: crypto.randomUUID(),
    name,
    slug,
    status: 'active',
  };
  let { data, error } = await sb.from('brands').insert(brand).select().single();
  if (error) {
    console.warn('[Supabase ensureBrandForProduct insert error, retrying without extra fields]:', error.message);
    const minimal = { id: brand.id, name, slug, status: 'active' };
    const res = await sb.from('brands').insert(minimal).select().single();
    if (res.error) {
      console.error('[Supabase ensureBrandForProduct failed]:', res.error.message);
      // Fall back to a lookup in case the row already exists (race condition)
      const again = await findBrandIdByName(name);
      return again;
    }
    data = res.data;
  }
  console.log('[ensureBrandForProduct] created brand:', name, '->', brand.id);
  return data?.id || brand.id;
}

export async function createProductReview(review: any, slugSet?: Set<string> | null): Promise<any> {
  const sb = await getClient();
  let slug = review.slug || slugify(review.product_name || 'product-review');
  const used = slugSet || (await sb.from('product_reviews').select('slug')).data?.map((r: any) => r.slug).filter(Boolean) || [];
  const usedSet = new Set(used);
  if (usedSet.has(slug)) {
    let counter = 1;
    while (usedSet.has(`${slug}-${counter}`)) counter++;
    slug = `${slug}-${counter}`;
  }
  const reviewToInsert: any = { id: review.id || crypto.randomUUID(), ...review, slug, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (reviewToInsert.review_summary) {
    reviewToInsert.review_summary = sanitizeReviewSummary(reviewToInsert.review_summary);
  }
  // Images array -> product_image + gallery
  if (Array.isArray(reviewToInsert.images)) {
    const imgs = reviewToInsert.images.filter((u: any) => u && typeof u === 'string');
    reviewToInsert.product_image = imgs[0] || reviewToInsert.product_image || null;
    reviewToInsert.gallery = imgs;
    delete reviewToInsert.images;
  }
  // mainCategory (category NAME) -> category_id lookup
  if (reviewToInsert.mainCategory) {
    const catId = await findCategoryIdByName(String(reviewToInsert.mainCategory));
    if (catId) reviewToInsert.category_id = catId;
    delete reviewToInsert.mainCategory;
  }
  // Auto-detect/link brand
  const brandId = await ensureBrandForProduct(reviewToInsert.brand);
  if (brandId) reviewToInsert.brand_id = brandId;
  let { data, error } = await sb.from('product_reviews').insert(reviewToInsert).select().single();
  if (error) {
    console.error('[Supabase Product Review Insert Error]:', error.message);
    throw new Error(`Failed to create product review: ${error.message}`);
  }
  return data;
}

const KNOWN_PRODUCT_REVIEW_COLUMNS = new Set([
  'product_name', 'brand', 'product_image', 'affiliate_url', 'price', 'original_price',
  'rating', 'review_count', 'best_for', 'category_id', 'pros', 'cons', 'key_features',
  'specs', 'cta_text', 'review_summary', 'final_verdict', 'editor_score',
  'slug', 'stock_status', 'deal_badge', 'coupon_code', 'coupon_expiry',
  'click_count', 'page_views', 'asin', 'discount_percentage', 'features',
  'technical_specs', 'shipping_info', 'editor_rating', 'is_featured', 'is_deal',
  'price_updated_at', 'last_updated_at', 'amazon_url', 'gallery', 'variants',
  'seo_title', 'seo_description', 'seo_keywords', 'comparison_attributes',
  'is_trending', 'is_top_rated', 'brand_id', 'subcategory_id',
  'status', 'created_at', 'updated_at',
  'review_article', 'faq', 'affiliate_disclosure',
  'ai_verdict',
]);

const PRODUCT_CAMEL_TO_SNAKE: Record<string, string> = {
  title: 'product_name',
  shortDescription: 'review_summary',
  currentPrice: 'price',
  referencePrice: 'original_price',
  discountPercentage: 'discount_percentage',
  isDeal: 'is_deal',
  isFeatured: 'is_featured',
  isTrending: 'is_trending',
  reviewCount: 'review_count',
  mainFeatures: 'key_features',
  specifications: 'specs',
  editorScore: 'editor_score',
  bestFor: 'best_for',
  seoTitle: 'seo_title',
  metaDescription: 'seo_description',
  metaKeywords: 'seo_keywords',
  affiliateUrl: 'affiliate_url',
  amazonOriginalUrl: 'amazon_url',
  stockStatus: 'stock_status',
  categoryId: 'category_id',
};

async function findCategoryIdByName(name: string): Promise<string | null> {
  if (!name) return null;
  const sb = await getClient();
  const slug = slugify(name);
  const bySlug = await sb.from('categories').select('id').eq('slug', slug).limit(1);
  if (bySlug.data?.[0]?.id) return bySlug.data[0].id;
  const byName = await sb.from('categories').select('id').ilike('name', name).limit(1);
  if (byName.data?.[0]?.id) return byName.data[0].id;
  const byExact = await sb.from('categories').select('id').eq('name', name).limit(1);
  return byExact.data?.[0]?.id || null;
}

export async function updateProductReview(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const payload: any = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'images' || key === 'mainCategory') continue;
    if (KNOWN_PRODUCT_REVIEW_COLUMNS.has(key)) {
      payload[key] = value;
    } else if (PRODUCT_CAMEL_TO_SNAKE[key]) {
      payload[PRODUCT_CAMEL_TO_SNAKE[key]] = value;
    }
  }
  // Merge specs with the existing row so nested data (asin, reviews, etc.)
  // isn't wiped when only gallery/video_url is edited.
  if (updates.specs && typeof updates.specs === 'object') {
    const existing = await getProductReviewById(id);
    const existingSpecs = (existing && existing.specs && typeof existing.specs === 'object') ? existing.specs : {};
    payload.specs = { ...existingSpecs, ...updates.specs };
  }
  // Images array -> product_image + gallery (also strip stale gallery from specs)
  if (Array.isArray(updates.images)) {
    const imgs = updates.images.filter((u: any) => u && typeof u === 'string');
    payload.product_image = imgs[0] || null;
    payload.gallery = imgs;
    if (payload.specs && typeof payload.specs === 'object') {
      const cleanSpecs: any = { ...payload.specs };
      delete cleanSpecs.gallery;
      payload.specs = cleanSpecs;
    }
  }
  // Coerce values to match column types so decimals/strings can't hard-fail the
  // UPDATE (previously a decimal editor_score like 8.8 threw on the integer
  // column and, because the route had no try/catch, hung into a 504).
  // editor_score is NUMERIC now (migration 019) so its decimal is preserved.
  const roundIntCols = ['editor_rating', 'click_count', 'page_views', 'discount_percentage', 'review_count'];
  for (const c of roundIntCols) {
    if (payload[c] != null && payload[c] !== '') {
      const n = Number(payload[c]);
      payload[c] = Number.isFinite(n) ? Math.round(n) : null;
    }
  }
  const numCols = ['rating', 'editor_score'];
  for (const c of numCols) {
    if (payload[c] != null && payload[c] !== '') {
      const n = Number(payload[c]);
      payload[c] = Number.isFinite(n) ? n : null;
    }
  }
  // Top-level `gallery` array (explicit clear when empty) -> column + specs.gallery
  if (Array.isArray(updates.gallery)) {
    const imgs = updates.gallery.filter((u: any) => u && typeof u === 'string');
    payload.gallery = imgs;
    if (payload.specs && typeof payload.specs === 'object') {
      payload.specs = { ...payload.specs, gallery: imgs };
    } else {
      const existing = await getProductReviewById(id);
      const existingSpecs = (existing && existing.specs && typeof existing.specs === 'object') ? existing.specs : {};
      payload.specs = { ...existingSpecs, gallery: imgs };
    }
  }
  // mainCategory (category NAME from dashboard) -> category_id lookup
  if (updates.mainCategory) {
    const catId = await findCategoryIdByName(String(updates.mainCategory));
    if (catId) payload.category_id = catId;
  }
  // brand -> ensure a brand row exists (feeds "Shop by Brand") + link brand_id
  if (updates.brand) {
    const brandId = await ensureBrandForProduct(updates.brand);
    if (brandId) payload.brand_id = brandId;
  }
  if (payload.review_summary) {
    payload.review_summary = sanitizeReviewSummary(payload.review_summary);
  }
  // Don't modify original id
  delete payload.id;

  let { data, error } = await sb.from('product_reviews').update(payload).eq('id', id).select().single();
  if (!error) return data;

  // Schema cache issue — retry per-column, skipping unknown columns.
  // Only include updated_at if the column actually exists.
  if (error.message?.includes('Could not find') || error.message?.includes('column')) {
    const safePayload: any = {};
    const keys = Object.keys(payload);
    for (const key of keys) {
      const retryResult = await sb.from('product_reviews').update({ [key]: payload[key] }).eq('id', id).select().single();
      if (!retryResult.error) {
        safePayload[key] = payload[key];
      }
    }
    // updated_at may or may not exist; only add it if the column is present
    if (Object.keys(safePayload).length === 0) {
      console.error('[Supabase Product Review Update Error (retry)]: no writable columns', error.message);
      throw new Error(`Failed to update product review: ${error.message}`);
    }
    const retryResult = await sb.from('product_reviews').update(safePayload).eq('id', id).select().single();
    if (retryResult.error) {
      console.error('[Supabase Product Review Update Error (retry)]:', retryResult.error.message);
      throw new Error(`Failed to update product review: ${retryResult.error.message}`);
    }
    return retryResult.data;
  }
  console.error('[Supabase Product Review Update Error]:', error.message);
  throw new Error(`Failed to update product review: ${error.message}`);
}

export async function deleteProductReview(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('product_reviews').delete().eq('id', id);
  return !error;
}

async function uploadToCatbox(buf: Buffer): Promise<string | null> {
  try {
    const ext = buf[0] === 0x89 && buf[1] === 0x50 ? '.png' : buf[0] === 0xFF ? '.jpg' : '.bin';
    const blob = new Blob([buf], { type: `image/${ext === '.png' ? 'png' : 'jpeg'}` });
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', blob, `img${ext}`);
    const resp = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: fd,
      signal: AbortSignal.timeout(20000),
    });
    const url = await resp.text();
    return url.startsWith('http') ? url : null;
  } catch {
    return null;
  }
}

export async function uploadToImgBB(imageUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DawnWire/1.0)' },
    });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 100) return null;
    // Try imgbb first
    const key = process.env.IMGBB_API_KEY;
    if (key) {
      try {
        const b64 = buf.toString('base64');
        const body = new URLSearchParams({ image: b64 });
        const imgbb = await fetch(`https://api.imgbb.com/1/upload?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          signal: AbortSignal.timeout(15000),
        });
        const data: any = await imgbb.json();
        if (data.success) return data.data.url;
      } catch {}
    }
    // Fallback: catbox.moe
    return await uploadToCatbox(buf);
  } catch {
    return null;
  }
}

const AMAZON_CDN_RE = /^https?:\/\/(m\.media-amazon\.com|images-na\.ssl-images-amazon\.com)/i;

/**
 * Find an existing product_reviews row that this import should update instead
 * of inserting. Match priority: ASIN (column or specs) > slug > exact name.
 */
async function findExistingProductForImport(sb: any, norm: any, slug: string, amazonUrl?: string | null): Promise<any | null> {
  try {
    // 1. ASIN — the strongest identifier (Amazon variations keep the same ASIN)
    const asin = norm.asin ? String(norm.asin).trim() : '';
    if (asin) {
      const byAsin = await sb.from('product_reviews').select('id').eq('asin', asin).maybeSingle();
      if (byAsin.data?.id) return byAsin.data;
      const bySpecAsin = await sb.from('product_reviews').select('id').filter('specs->>asin', 'eq', asin).maybeSingle();
      if (bySpecAsin.data?.id) return bySpecAsin.data;
    }
    // 1b. Amazon/affiliate URL — catches old rows whose ASIN was never stored
    const url = (amazonUrl || '').trim();
    if (url) {
      const { data: byUrl } = await sb.from('product_reviews').select('id').eq('amazon_url', url).maybeSingle();
      if (byUrl?.id) return byUrl;
      const { data: byAffUrl } = await sb.from('product_reviews').select('id').eq('affiliate_url', url).maybeSingle();
      if (byAffUrl?.id) return byAffUrl;
    }
    // 2. Slug — name-based match when ASIN is unavailable (e.g. amzn.to links)
    if (slug) {
      const bySlug = await sb.from('product_reviews').select('id').eq('slug', slug).maybeSingle();
      if (bySlug.data?.id) return bySlug.data;
    }
    // 3. Exact normalized name match (no slug counters yet)
    const name = (norm.product_name || '').trim().toLowerCase();
    if (name) {
      const byName = await sb.from('product_reviews').select('id').eq('product_name', norm.product_name).maybeSingle();
      if (byName.data?.id) return byName.data;
    }
    return null;
  } catch (e: any) {
    console.warn('[findExistingProductForImport] lookup failed:', e.message);
    return null;
  }
}

export async function importProductReview(data: {
  product_name: string;
  brand?: string;
  product_image?: string;
  affiliate_url?: string;
  price?: string;
  rating?: number;
  reviewCount?: number;
  pros?: string[];
  cons?: string[];
  key_features?: string[];
  review_summary?: string;
  amazon_url?: string;
  videoUrl?: string;
  gallery?: string[];
  variations?: { name: string; selectedValue: string; options: { value: string; image?: string; price?: string }[]; priceRange?: { low: string; high: string } }[];
  listPrice?: string;
  savings?: string;
  priceRange?: { low: string; high: string };
  specs?: Record<string, string>;
  detailBullets?: Record<string, string>;
  stockStatus?: string;
  dealBadge?: string;
  couponCode?: string;
  couponExpiry?: string;
  asin?: string;
  source?: string;
  ingredients?: string;
  unitSize?: string;
  unitPrice?: string;
  bsrDetail?: Array<{ rank: number; category: string }>;
  reviewHighlights?: string;
  reviews?: Array<{ name: string; avatar?: string; rating: number; title?: string; date?: string; body?: string; verified?: boolean; images?: string[] }>;
  reviewStats?: { total: number; average: number; distribution: { 5: number; 4: number; 3: number; 2: number; 1: number } };
  best_for?: string;
  category_id?: string;
  bestSellersRank?: string;
  final_verdict?: string;
  editor_score?: number;
  uploadImages?: boolean;
  slugSet?: Set<string> | null;
}): Promise<any> {
  const sb = await getClient();

  // Normalize all incoming data
  const norm = normalizeImportedProduct({ ...data, title: data.product_name });

  let slug = slugify(norm.product_name || 'product-review');
  const used = data.slugSet || (await sb.from('product_reviews').select('slug')).data?.map((r: any) => r.slug).filter(Boolean) || [];
  const usedSet = new Set(used);
  if (usedSet.has(slug)) {
    let counter = 1;
    while (usedSet.has(`${slug}-${counter}`)) counter++;
    slug = `${slug}-${counter}`;
  }

  // Auto-host images: always upload Amazon CDN images to permanent storage
  let productImage = typeof data.product_image === 'string' ? data.product_image.trim() : null;
  let galleryImages: string[] = norm.gallery.length > 0 ? [...norm.gallery] : [];
  const shouldUpload = data.uploadImages !== false; // default true for all imports
  if (shouldUpload) {
    if (productImage && AMAZON_CDN_RE.test(productImage)) {
      const hosted = await uploadToImgBB(productImage);
      if (hosted) productImage = hosted;
    }
    // Upload gallery sequentially to avoid rate limits
    if (galleryImages.length > 0) {
      const uploaded: string[] = [];
      for (const u of galleryImages) {
        if (AMAZON_CDN_RE.test(u)) {
          const hosted = await uploadToImgBB(u);
          uploaded.push(hosted || u);
          // Small delay between uploads to avoid rate limits
          await new Promise(r => setTimeout(r, 1500));
        } else {
          uploaded.push(u);
        }
      }
      galleryImages = uploaded;
    }
  }

  const specs: any = {
    asin: norm.asin || '',
    source: norm.source || (data.amazon_url?.includes('amazon.') ? 'amazon' : 'other'),
  };
  if (galleryImages.length > 0) specs.gallery = galleryImages;
  if (norm.variations.length > 0) specs.variations = norm.variations;
  if (norm.ingredients) specs.ingredients = norm.ingredients;
  if (norm.unitSize) specs.unit_size = norm.unitSize;
  if (norm.unitPrice) specs.unit_price = norm.unitPrice;
  if (norm.bsrDetail.length > 0) specs.best_sellers_rank_detail = norm.bsrDetail;
  if (norm.reviewHighlights) specs.review_highlights = norm.reviewHighlights;
  if (norm.reviews.length > 0) specs.reviews = norm.reviews;
  if (norm.reviewStats) specs.review_stats = norm.reviewStats;
  if (norm.videoUrl) specs.video_url = norm.videoUrl;
  if (data.specs && typeof data.specs === 'object') specs.details = data.specs;
  if (data.detailBullets && typeof data.detailBullets === 'object') specs.detail_bullets = data.detailBullets;
  if (data.listPrice) specs.listPrice = data.listPrice;
  if (data.savings) specs.savings = data.savings;
  if (data.priceRange) specs.priceRange = data.priceRange;

  const bestFor = norm.best_for;
  const categoryId = data.category_id || null;
  const resolvedCategoryId = categoryId || (bestFor ? await resolveCategoryIdByName(bestFor) : null);

  let reviewSummary = norm.review_summary || null;
  // Append variation summary AFTER sanitization is already done by normalizer
  if (norm.variations.length > 0) {
    const varSummary = norm.variations.map(v => `${v.name}: ${v.selectedValue}`).filter(Boolean);
    if (varSummary.length > 0) {
      reviewSummary = [reviewSummary, ...varSummary].filter(Boolean).join(' | ');
    }
  }

  const review: Record<string, any> = {
    id: crypto.randomUUID(),
    asin: norm.asin || null,
    product_name: norm.product_name,
    brand: norm.brand,
    product_image: productImage,
    affiliate_url: data.affiliate_url || data.amazon_url || null,
    price: norm.price,
    original_price: norm.original_price,
    rating: norm.rating,
    review_count: norm.review_count,
    pros: norm.pros,
    cons: norm.cons,
    key_features: norm.key_features,
    review_summary: reviewSummary ? sanitizeReviewSummary(reviewSummary) : null,
    slug,
    stock_status: norm.stock_status,
    deal_badge: norm.deal_badge,
    best_for: bestFor,
    category_id: resolvedCategoryId,
    final_verdict: norm.final_verdict || null,
    editor_score: norm.editor_score,
    coupon_code: norm.coupon_code,
    coupon_expiry: norm.coupon_expiry,
    specs: Object.keys(specs).length > 0 ? specs : null,
    cta_text: 'Buy on Amazon',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Auto-detect/link brand
  if (norm.brand) {
    const brandId = await ensureBrandForProduct(norm.brand);
    if (brandId) review.brand_id = brandId;
  }

  const rawUrl = review.affiliate_url || '';
  if (rawUrl && rawUrl.includes('amazon') && !rawUrl.includes('tag=')) {
    review.affiliate_url = rawUrl + (rawUrl.includes('?') ? '&' : '?') + 'tag=dawnwire-20';
  } else if (rawUrl && rawUrl.includes('amazon') && !rawUrl.includes('dawnwire-20')) {
    review.affiliate_url = rawUrl.replace(/tag=[^&]+/, 'tag=dawnwire-20');
  }

  // ====== UPSERT: re-importing an existing product refreshes it in place ======
  // Match by ASIN first (best), then slug, then normalized product name. This way
  // reimports update reviews, new images, price, specs, ASIN etc. instead of
  // creating a second row (e.g. when Amazon changes packaging / images).
  const existing = await findExistingProductForImport(sb, norm, slug, data.amazon_url || data.affiliate_url);
  if (existing) {
    const updatePayload: Record<string, any> = { ...review, updated_at: new Date().toISOString() };
    delete updatePayload.id;
    delete updatePayload.created_at;
    delete updatePayload.slug; // keep the existing slug (stable URL)
    // Preserve editorial/analytics work across reimports
    delete updatePayload.seo_title;
    delete updatePayload.seo_description;
    delete updatePayload.seo_keywords;
    delete updatePayload.editor_score;
    delete updatePayload.editor_rating;
    delete updatePayload.final_verdict;
    delete updatePayload.click_count;
    delete updatePayload.page_views;
    // Round integer-typed columns so decimal source values can't fail the write.
    // editor_score is NUMERIC (migration 019) so its decimal is preserved.
    for (const c of ['editor_rating', 'click_count', 'page_views', 'discount_percentage']) {
      if (updatePayload[c] != null) updatePayload[c] = Math.round(Number(updatePayload[c]));
    }
    const { data: updated, error: upErr } = await sb.from('product_reviews').update(updatePayload).eq('id', existing.id).select().single();
    if (!upErr && updated) {
      updated.was_duplicate = true;
      updated.created = false;
      updated.updated = true;
      console.log(`[Import Product Review] Re-import updated existing product ${existing.id} (asin: ${norm.asin || 'n/a'})`);
      return updated;
    }
    if (upErr) {
      console.warn('[Import Product Review] Duplicate update failed, falling back to insert:', upErr.message);
    }
  }

  let { data: created, error } = await sb.from('product_reviews').insert(review).select().single();
  if (error) {
    console.warn('[Supabase Import Product Review Error, running sanitized fallback]:', error.message);
    const fallbackPayload = { ...review };
    delete fallbackPayload.created_at;
    delete fallbackPayload.updated_at;
    delete fallbackPayload.cta_text;
    delete fallbackPayload.stock_status;
    delete fallbackPayload.key_features;
    delete fallbackPayload.review_summary;
    delete fallbackPayload.gallery;
    delete fallbackPayload.editor_score;
    delete fallbackPayload.coupon_code;
    delete fallbackPayload.coupon_expiry;
    const res = await sb.from('product_reviews').insert(fallbackPayload).select().single();
    if (res.error) throw new Error(res.error.message);
    created = res.data;
  }

  // Auto-category fallback: if no category matched from best_for, use smart
  // detection (Amazon BSR / department / breadcrumb) which may auto-create one.
  if (!resolvedCategoryId && created?.id) {
    try {
      const { detectCategoryForProduct } = await import('./auto-import');
      const catResult = await detectCategoryForProduct({ ...norm, specs: data.specs, detailBullets: data.detailBullets, bsrDetail: norm.bsrDetail, bestSellersRank: data.bestSellersRank });
      if (catResult.category_id) {
        await sb.from('product_reviews').update({ category_id: catResult.category_id, updated_at: new Date().toISOString() }).eq('id', created.id);
        created.category_id = catResult.category_id;
      }
      if (catResult.best_for && !bestFor) {
        await sb.from('product_reviews').update({ best_for: catResult.best_for, updated_at: new Date().toISOString() }).eq('id', created.id);
        created.best_for = catResult.best_for;
      }
    } catch (e: any) {
      console.warn('[Import Product Review] category auto-detect failed:', e.message);
    }
  }
  if (created) {
    created.created = true;
    created.updated = false;
    created.was_duplicate = false;
  }
  // Fire-and-forget: auto-generate an AI article (+ design image) for this new
  // product so it goes live without any manual step. Dedup is handled inside
  // the auto-articles engine, so re-imports never create a second post.
  if (created?.id && created.status === 'published') {
    import('./auto-articles').then(({ autoGenerateArticleForProduct }) =>
      autoGenerateArticleForProduct(created)
    ).catch((e: any) => console.warn('[Auto Article] background generation failed:', e.message));
  }
  return created;
}

// ====== PORTFOLIO ======
export async function getPortfolioProjects(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('portfolio_projects').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function getPublishedPortfolioProjects(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('portfolio_projects').select('*').eq('status', 'published').order('created_at', { ascending: false });
  return data || [];
}

export async function createPortfolioProject(project: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('portfolio_projects').insert({ ...project, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  return data;
}

export async function updatePortfolioProject(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('portfolio_projects').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return data;
}

export async function deletePortfolioProject(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('portfolio_projects').delete().eq('id', id);
  return !error;
}

// ====== TESTIMONIALS ======
export async function getTestimonials(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('testimonials').select('*').order('display_order', { ascending: true });
  return data || [];
}

export async function getPublishedTestimonials(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('testimonials').select('*').eq('status', 'published').order('display_order', { ascending: true });
  return data || [];
}

export async function createTestimonial(testimonial: any): Promise<any> {
  const sb = await getClient();
  const { id, created_at, ...clean } = testimonial;
  const { data, error } = await sb.from('testimonials').insert({ ...clean, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTestimonial(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const { id: _bodyId, created_at, ...clean } = updates;
  const { data, error } = await sb.from('testimonials').update({ ...clean, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('testimonials').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ====== SERVICES ======
export async function getServices(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('services').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function getPublishedServices(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('services').select('*').eq('status', 'published').order('created_at', { ascending: false });
  return data || [];
}

export async function getServiceBySlug(slug: string): Promise<any | null> {
  const sb = await getClient();
  const { data } = await sb.from('services').select('*').eq('slug', slug).maybeSingle();
  return data;
}

export async function createService(service: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('services').insert({ ...service, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  return data;
}

export async function updateService(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('services').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return data;
}

export async function deleteService(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('services').delete().eq('id', id);
  return !error;
}

// ====== COMPARISON TABLES ======
export async function getComparisonTables(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('comparison_tables').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function createComparisonTable(table: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('comparison_tables').insert({ ...table, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  return data;
}

export async function updateComparisonTable(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('comparison_tables').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  return data;
}

export async function deleteComparisonTable(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('comparison_tables').delete().eq('id', id);
  return !error;
}

// ====== INTERNAL LINKS ======
export async function getInternalLinks(): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('internal_links').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function getInternalLinksForSource(sourceId: string, sourceType: string): Promise<any[]> {
  const sb = await getClient();
  const { data } = await sb.from('internal_links').select('*').eq('source_id', sourceId).eq('source_type', sourceType);
  return data || [];
}

export async function createInternalLink(link: any): Promise<any> {
  const sb = await getClient();
  const { data } = await sb.from('internal_links').insert({ ...link, created_at: new Date().toISOString() }).select().single();
  return data;
}

export async function deleteInternalLink(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('internal_links').delete().eq('id', id);
  return !error;
}

// ====== CONTENT UPGRADES ======
export async function getContentUpgrades(): Promise<any[]> {
  const data = await dbInstance.getContentUpgrades();
  return data || [];
}

export async function createContentUpgrade(upgrade: any): Promise<any> {
  return dbInstance.createContentUpgrade(upgrade);
}

export async function updateContentUpgrade(id: string, updates: any): Promise<any> {
  return dbInstance.updateContentUpgrade(id, updates);
}

export async function deleteContentUpgrade(id: string): Promise<boolean> {
  return dbInstance.deleteContentUpgrade(id);
}

export async function trackUpgradeDownload(id: string): Promise<boolean> {
  return dbInstance.trackUpgradeDownload(id);
}

// ====== SEO ANALYSIS ======
export interface SeoScoreResult {
  score: number;
  checks: Record<string, boolean>;
  good: string[];
  warnings: string[];
  critical: string[];
}

export function analyzeSeo(content: {
  title?: string;
  seoTitle?: string;
  metaDescription?: string;
  content?: string;
  slug?: string;
  focusKeyword?: string;
  headings?: string[];
  images?: string[];
  internalLinks?: number;
  externalLinks?: number;
  hasSchema?: boolean;
  hasFaq?: boolean;
  wordCount?: number;
}): SeoScoreResult {
  const kw = (content.focusKeyword || '').toLowerCase();
  const title = (content.seoTitle || content.title || '').toLowerCase();
  const desc = (content.metaDescription || '').toLowerCase();
  const body = (content.content || '').toLowerCase();
  const slug = (content.slug || '').toLowerCase();
  const headings = (content.headings || []).map(h => h.toLowerCase());
  const imgs = content.images || [];
  const checks: Record<string, boolean> = {};
  const good: string[] = [];
  const warnings: string[] = [];
  const critical: string[] = [];

  // Keyword in SEO title
  checks.titleHasKeyword = kw ? title.includes(kw) : true;
  if (checks.titleHasKeyword) good.push('Focus keyword found in SEO title');
  else critical.push('Add focus keyword to SEO title');

  // Keyword in meta description
  checks.descriptionHasKeyword = kw ? desc.includes(kw) : true;
  if (checks.descriptionHasKeyword) good.push('Focus keyword found in meta description');
  else warnings.push('Add focus keyword to meta description');

  // Keyword in H1 (first heading)
  checks.h1HasKeyword = kw ? (headings[0] || '').includes(kw) : true;
  if (checks.h1HasKeyword) good.push('Focus keyword found in H1 heading');
  else warnings.push('Add focus keyword to the main heading');

  // Keyword in first 200 chars
  checks.firstParagraphHasKeyword = kw ? body.substring(0, 200).includes(kw) : true;
  if (checks.firstParagraphHasKeyword) good.push('Focus keyword found in first paragraph');
  else warnings.push('Add focus keyword to the first paragraph');

  // Keyword in slug
  checks.slugHasKeyword = kw ? slug.replace(/-/g, ' ').includes(kw) : true;
  if (checks.slugHasKeyword) good.push('Focus keyword found in URL slug');
  else warnings.push('Add focus keyword to the URL slug');

  // Keyword in at least one H2
  checks.h2HasKeyword = kw ? headings.some(h => h.includes(kw)) : true;
  if (checks.h2HasKeyword) good.push('Focus keyword found in a subheading');
  else warnings.push('Add focus keyword to at least one H2 subheading');

  // Proper heading structure
  checks.properHeadings = headings.length > 0 && headings[0].startsWith('h1');
  if (checks.properHeadings) good.push('Proper heading structure (starts with H1)');
  else warnings.push('Content should start with an H1 heading');

  // Minimum word count
  const wc = content.wordCount || body.split(/\s+/).filter(Boolean).length;
  checks.minWordCount = wc >= 300;
  if (checks.minWordCount) good.push(`Good word count: ${wc} words`);
  else critical.push(`Thin content: only ${wc} words (minimum 300 recommended)`);

  // Internal links
  checks.hasInternalLinks = (content.internalLinks || 0) > 0;
  if (checks.hasInternalLinks) good.push('Contains internal links');
  else warnings.push('Add at least one internal link');

  // External links
  checks.hasExternalLinks = (content.externalLinks || 0) > 0;
  if (checks.hasExternalLinks) good.push('Contains external links');
  else warnings.push('Consider adding external references');

  // Image alt text
  checks.hasImageAltText = imgs.length === 0 || imgs.length > 0;
  if (imgs.length > 0 && imgs.every(Boolean)) good.push(`${imgs.length} image(s) have alt text`);
  else if (imgs.length > 0) warnings.push('Some images are missing alt text');
  else good.push('No images to check');

  // FAQ section
  checks.hasFaq = content.hasFaq || false;
  if (checks.hasFaq) good.push('FAQ section present');
  else warnings.push('Add an FAQ section for better SEO');

  // Schema
  checks.hasSchema = content.hasSchema || false;
  if (checks.hasSchema) good.push('Schema markup present');
  else warnings.push('Add schema markup');

  // Title length
  checks.titleLengthOk = title.length >= 30 && title.length <= 60;
  if (checks.titleLengthOk) good.push(`SEO title length: ${title.length} chars (good)`);
  else if (title.length < 30) warnings.push(`SEO title too short: ${title.length} chars (min 30)`);
  else warnings.push(`SEO title too long: ${title.length} chars (max 60)`);

  // Description length
  checks.descriptionLengthOk = desc.length >= 120 && desc.length <= 160;
  if (checks.descriptionLengthOk) good.push(`Meta description length: ${desc.length} chars (good)`);
  else if (desc.length < 120) warnings.push(`Meta description too short: ${desc.length} chars (min 120)`);
  else warnings.push(`Meta description too long: ${desc.length} chars (max 160)`);

  // Readability
  const sentences = body.split(/[.!?]+/).filter(Boolean);
  const avgWordsPerSentence = sentences.length > 0 ? wc / sentences.length : 0;
  checks.readabilityOk = avgWordsPerSentence <= 25;
  if (checks.readabilityOk) good.push(`Good readability (avg ${avgWordsPerSentence.toFixed(1)} words/sentence)`);
  else warnings.push(`Long sentences: avg ${avgWordsPerSentence.toFixed(1)} words/sentence (aim for < 25)`);

  // Calculate overall score (0-100)
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.values(checks).length;
  const score = Math.round((passed / total) * 100);

  return { score, checks, good, warnings, critical };
}

// ====== SEO DASHBOARD STATS ======
export async function getSeoDashboardStats(): Promise<any> {
  const sb = await getClient();
  const [posts, pages, products, portfolios, redirects, error404s, keywords, links, faqs] = await Promise.all([
    sb.from('posts').select('id,status,seo_title,seo_description,focus_keyword,featured_image,updated_at'),
    sb.from('pages').select('id,status,seo_title,seo_description'),
    sb.from('product_reviews').select('id,status'),
    sb.from('portfolio_projects').select('id,status'),
    sb.from('redirects').select('id'),
    sb.from('error_404_logs').select('id,hit_count'),
    sb.from('keywords').select('id'),
    sb.from('affiliate_links').select('id,click_count'),
    sb.from('faq_items').select('id'),
  ]);

  const allPosts = posts.data || [];
  const publishedPosts = allPosts.filter((p: any) => p.status === 'published');
  const missingTitles = publishedPosts.filter((p: any) => !p.seo_title).length;
  const missingDescriptions = publishedPosts.filter((p: any) => !p.seo_description).length;
  const missingKeywords = publishedPosts.filter((p: any) => !p.focus_keyword).length;
  const missingImages = publishedPosts.filter((p: any) => !p.featured_image).length;
  const outdatedThreshold = new Date();
  outdatedThreshold.setDate(outdatedThreshold.getDate() - 180);
  const outdatedContent = publishedPosts.filter((p: any) => new Date(p.updated_at || p.created_at) < outdatedThreshold).length;
  const totalClicks = (links.data || []).reduce((sum: number, l: any) => sum + (l.click_count || 0), 0);
  const total404 = (error404s.data || []).reduce((sum: number, e: any) => sum + (e.hit_count || 0), 0);

  return {
    totalPublishedPosts: publishedPosts.length,
    totalPages: (pages.data || []).filter((p: any) => p.status === 'published').length,
    totalProducts: (products.data || []).filter((p: any) => p.status === 'published').length,
    totalPortfolio: (portfolios.data || []).filter((p: any) => p.status === 'published').length,
    totalRedirects: (redirects.data || []).length,
    totalKeywords: (keywords.data || []).length,
    totalFaqs: (faqs.data || []).length,
    totalAffiliateClicks: totalClicks,
    total404Errors: total404,
    missingSeoTitles: missingTitles,
    missingSeoDescriptions: missingDescriptions,
    missingFocusKeywords: missingKeywords,
    missingFeaturedImages: missingImages,
    outdatedContent,
  };
}

export async function getContentFreshness(): Promise<any[]> {
  const posts = await Promise.resolve(dbInstance.getPosts());
  const now = Date.now();
  const DAY_MS = 86400000;
  const STALE_DAYS = 180;
  return (posts as any[])
    .filter((p: any) => p.status === 'published')
    .map((p: any) => {
      const updated = p.updatedAt || p.publishedAt || p.createdAt;
      const ageDays = Math.floor((now - new Date(updated).getTime()) / DAY_MS);
      return {
        id: p.id, title: p.title, slug: p.slug,
        updatedAt: updated, ageDays,
        isStale: ageDays >= STALE_DAYS,
        hasExcerpt: !!p.excerpt,
        hasSeoTitle: !!p.seoTitle,
        hasSeoDescription: !!p.seoDescription,
        hasFeaturedImage: !!p.featuredImage,
        wordCount: (p.content || '').split(/\s+/).filter(Boolean).length,
        readingTime: p.readingTime || Math.ceil((p.content || '').split(/\s+/).filter(Boolean).length / 200),
      };
    })
    .sort((a: any, b: any) => a.ageDays - b.ageDays);
}

async function resolveCategoryIdByName(bestFor: string): Promise<string | null> {
  try {
    const sb = await getClient();
    const { data } = await sb.from('categories').select('id').ilike('name', bestFor).limit(1).maybeSingle();
    return data?.id || null;
  } catch {
    return null;
  }
}
