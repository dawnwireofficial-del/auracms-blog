import { dbInstance, useSupabase } from './db';
import { getSupabase, getSupabaseAdmin } from './lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

let seoClient: SupabaseClient | null = null;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') || 'product';
}

async function getClient(): Promise<SupabaseClient> {
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

export async function createProductReview(review: any): Promise<any> {
  const sb = await getClient();
  let slug = review.slug || slugify(review.product_name || 'product-review');
  const existingSlugs = await sb.from('product_reviews').select('slug');
  if (existingSlugs.data) {
    const used = new Set(existingSlugs.data.map((r: any) => r.slug).filter(Boolean));
    if (used.has(slug)) {
      let counter = 1;
      while (used.has(`${slug}-${counter}`)) counter++;
      slug = `${slug}-${counter}`;
    }
  }
  const reviewToInsert = { id: review.id || crypto.randomUUID(), ...review, slug, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  if (reviewToInsert.review_summary) {
    reviewToInsert.review_summary = sanitizeReviewSummary(reviewToInsert.review_summary);
  }
  let { data, error } = await sb.from('product_reviews').insert(reviewToInsert).select().single();
  if (error) {
    console.error('[Supabase Product Review Insert Error]:', error.message);
    throw new Error(`Failed to create product review: ${error.message}`);
  }
  return data;
}

export async function updateProductReview(id: string, updates: any): Promise<any> {
  const sb = await getClient();
  const payload = { ...updates, updated_at: new Date().toISOString() };
  if (payload.review_summary) {
    payload.review_summary = sanitizeReviewSummary(payload.review_summary);
  }
  // Don't modify original id
  delete payload.id;
  
  let { data, error } = await sb.from('product_reviews').update(payload).eq('id', id).select().single();
  if (error) {
    console.error('[Supabase Product Review Update Error]:', error.message);
    throw new Error(`Failed to update product review: ${error.message}`);
  }
  return data;
}

export async function deleteProductReview(id: string): Promise<boolean> {
  const sb = await getClient();
  const { error } = await sb.from('product_reviews').delete().eq('id', id);
  return !error;
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
  asin?: string;
  source?: string;
  ingredients?: string;
  unitSize?: string;
  unitPrice?: string;
  bsrDetail?: Array<{ rank: number; category: string }>;
  reviewHighlights?: string;
  reviews?: Array<{ name: string; avatar?: string; rating: number; title?: string; date?: string; body?: string; verified?: boolean; images?: string[] }>;
  reviewStats?: { total: number; average: number; distribution: { 5: number; 4: number; 3: number; 2: number; 1: number } };
}): Promise<any> {
  const sb = await getClient();
  let slug = slugify(data.product_name || 'product-review');
  // Slug dedup: check if slug exists, append counter if taken
  const existingSlugs = await sb.from('product_reviews').select('slug');
  if (existingSlugs.data) {
    const used = new Set(existingSlugs.data.map((r: any) => r.slug).filter(Boolean));
    if (used.has(slug)) {
      let counter = 1;
      while (used.has(`${slug}-${counter}`)) counter++;
      slug = `${slug}-${counter}`;
    }
  }
  const gallery = data.gallery && data.gallery.length > 0 ? data.gallery.slice(0, 8) : [];
  const specs: any = {
    asin: data.asin || '',
    source: data.source || (data.amazon_url?.includes('amazon.') ? 'amazon' : 'other'),
  };
  if (gallery.length > 0) specs.gallery = gallery;
  if (data.variations && data.variations.length > 0) specs.variations = data.variations;
  if (data.listPrice) specs.listPrice = data.listPrice;
  if (data.savings) specs.savings = data.savings;
  if (data.priceRange) specs.priceRange = data.priceRange;
  if (data.specs && Object.keys(data.specs).length > 0) specs.details = data.specs;
  if (data.videoUrl) specs.video_url = data.videoUrl;
  if (data.ingredients) specs.ingredients = data.ingredients;
  if (data.unitSize) specs.unit_size = data.unitSize;
  if (data.unitPrice) specs.unit_price = data.unitPrice;
  if (data.bsrDetail && data.bsrDetail.length > 0) specs.best_sellers_rank_detail = data.bsrDetail;
  if (data.reviewHighlights) specs.review_highlights = data.reviewHighlights;
  if (data.reviews && data.reviews.length > 0) specs.reviews = data.reviews.slice(0, 50);
  if (data.reviewStats) specs.review_stats = data.reviewStats;
  const review: any = {
    id: crypto.randomUUID(),
    product_name: data.product_name,
    brand: data.brand || null,
    product_image: data.product_image || null,
    affiliate_url: data.affiliate_url || data.amazon_url || null,
    price: data.price || null,
    original_price: data.listPrice || null,
    rating: data.rating || data.reviewStats?.average || 0,
    review_count: data.reviewStats?.total || data.reviewCount || 0,
    pros: data.pros || [],
    cons: data.cons || [],
    key_features: data.key_features || [],
    review_summary: sanitizeReviewSummary(data.review_summary),
    slug,
    stock_status: data.stockStatus || 'in_stock',
    deal_badge: data.dealBadge || null,
    specs: Object.keys(specs).length > 0 ? specs : null,
    cta_text: 'Buy on Amazon',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  // store individual variation prices in key_features summary
  if (data.variations && data.variations.length > 0) {
    const varSummary = [];
    data.variations.forEach(dim => {
      const selected = dim.options.find(o => o.value === dim.selectedValue);
      if (selected && selected.price) varSummary.push(`${dim.name}: ${selected.value} - ${selected.price}`);
      else varSummary.push(`${dim.name}: ${dim.selectedValue}`);
    });
    if (data.priceRange) varSummary.push(`Price range: ${data.priceRange.low} - ${data.priceRange.high}`);
    if (data.savings) varSummary.push(`Discount: ${data.savings}`);
    if (varSummary.length > 0) {
      review.review_summary = [review.review_summary, ...varSummary].filter(Boolean).join(' | ');
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
    const res = await sb.from('product_reviews').insert(fallbackPayload).select().single();
    if (res.error) throw new Error(res.error.message);
    created = res.data;
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
