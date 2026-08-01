import { cohereChat } from './ai';
import { getSupabaseAdmin } from './lib/supabase';
import { ensureBrandForProduct } from './seo-engine';

// ====== Auto-Import Pipeline ======
// Detects brand, category, and SEO metadata for every imported product so no
// manual editing is needed before going live.

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'of', 'to', 'in', 'on', 'a', 'an', 'is', 'by', 'vs', 'v', '&', 'and', 'plus']);

function slugify(text: string): string {
  return (text || '').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') || 'category';
}

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function normalizeBrandName(name: string): string {
  let n = String(name || '').trim();
  // Title case
  n = n.replace(/\b\w/g, (c) => c.toUpperCase());
  // Strip common suffixes
  n = n.replace(/\b(Inc|Inc\.|LLC|Ltd|Limited|Co|Corp|Corporation|Company|Group|International|Global|The)\b\.?$/gi, '').trim();
  return n;
}

function extractBrandFromName(productName: string): string | null {
  const name = (productName || '').trim();
  if (!name) return null;
  // Skip common lead words that are not brands
  const badLead = new Set(['the', 'a', 'an', 'new', 'best', 'top', 'premium', 'pro', 'professional', 'wireless', 'smart', 'portable', 'mini', 'max', 'ultra', 'amazon', 'amazon basics', 'generic', 'official']);
  // Brand is usually the first 1-2 capitalized words before a product descriptor
  const tokens = name.split(/\s+/);
  let brandWords: string[] = [];
  for (const t of tokens) {
    const clean = t.replace(/[^a-zA-Z0-9]/g, '');
    if (!clean) continue;
    if (!/^[A-Z][a-z]*$/.test(clean) && !/^[A-Z]{2,}[0-9]*$/.test(clean)) break;
    if (badLead.has(clean.toLowerCase())) break;
    brandWords.push(clean);
    if (brandWords.length >= 2) break;
  }
  if (brandWords.length === 0) return null;
  // Heuristic: single all-caps word (Sony, JBL, LG) or two title-case words (Google Pixel, Bose QuietComfort)
  const brand = brandWords.join(' ');
  if (brandWords.length === 1 && brandWords[0].length < 3) return null;
  return brand;
}

// ====== Category Detection ======

// Category keyword map — maps product-name keywords to existing category names.
// Used as a fallback signal when a product has no breadcrumb/BSR/department.
const CATEGORY_KEYWORD_MAP: Array<{ category: string; keywords: string[] }> = [
  { category: 'Electronics', keywords: ['tv', 'television', 'monitor', 'headphone', 'earbud', 'earphone', 'speaker', 'laptop', 'computer', 'camera', 'smartphone', 'phone', 'tablet', 'smartwatch', 'watch', 'keyboard', 'mouse', 'router', 'charger', 'cable', 'drone', 'gadget', 'electronics'] },
  { category: 'Beauty & Personal Care', keywords: ['serum', 'moisturizer', 'moisturiser', 'cleanser', 'cream', 'lotion', 'skincare', 'skin care', 'eye cream', 'face', 'facial', 'shampoo', 'conditioner', 'body wash', 'soap', 'perfume', 'cologne', 'makeup', 'lipstick', 'foundation', 'sunscreen', 'spf', 'retinol', 'hyaluronic', 'cosmetic', 'deodorant', 'beauty', 'glow'] },
  { category: 'Home & Kitchen', keywords: ['kitchen', 'cookware', 'blender', 'air fryer', 'coffee maker', 'kettle', 'toaster', 'microwave', 'refrigerator', 'dishwasher', 'vacuum', 'mop', 'home', 'furniture', 'lamp', 'mattress', 'pillow', 'blanket', 'towel', 'storage', 'organizer', 'utensil', 'pan', 'pot', 'knife', 'cutting board'] },
  { category: 'Fitness', keywords: ['gym', 'workout', 'weights', 'dumbbell', 'kettlebell', 'resistance band', 'yoga', 'mat', 'treadmill', 'exercise bike', 'protein', 'supplement', 'creatine', 'pre-workout', 'whey', 'bcaa', 'fitness', 'training', 'barbell', 'squat'] },
  { category: 'Sports & Outdoors', keywords: ['basketball', 'football', 'soccer', 'baseball', 'tennis', 'golf', 'camping', 'tent', 'sleeping bag', 'hiking', 'backpack', 'bike', 'bicycle', 'helmet', 'fishing', 'sports', 'outdoor', 'trail'] },
  { category: 'Gaming', keywords: ['gaming', 'playstation', 'xbox', 'nintendo', 'controller', 'game', 'console', 'vr', 'gpu', 'graphics card', 'esports', 'mechanical keyboard'] },
  { category: 'Automotive', keywords: ['car', 'automotive', 'vehicle', 'tire', 'tyre', 'oil filter', 'car seat', 'dash cam', 'car charger', 'battery', 'windshield', 'headlight'] },
  { category: 'Toys & Games', keywords: ['toy', 'lego', 'puzzle', 'board game', 'doll', 'action figure', 'plush', 'kids', 'child', 'play', 'building blocks'] },
  { category: 'Baby Products', keywords: ['baby', 'infant', 'diaper', 'stroller', 'carrier', 'crib', 'bottle', 'nursery', 'toddler', 'wipes'] },
  { category: 'Office & Productivity', keywords: ['office', 'desk', 'chair', 'printer', 'scanner', 'stapler', 'paper', 'notebook', 'filing', 'whiteboard', 'stationery'] },
  { category: 'AI & Software Tools', keywords: ['software', 'ai', 'artificial intelligence', 'saas', 'app', 'tool', 'automation', 'chatgpt', 'copilot', 'plugin', 'extension', 'analytics', 'seo tool'] },
];

function keywordSignals(review: any): string[] {
  const text = [
    review.product_name,
    review.name,
    review.title,
    review.best_for,
    review.bestFor,
    review.review_summary,
    typeof review.specs === 'object' && review.specs ? (review.specs.details?.department || '') : '',
  ].filter(Boolean).join(' ').toLowerCase();
  const hits: string[] = [];
  for (const entry of CATEGORY_KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (text.includes(kw.toLowerCase())) {
        hits.push(entry.category);
        break;
      }
    }
  }
  return hits;
}

function categorySignals(review: any): string[] {
  const signals: string[] = [];
  // Breadcrumb category (e.g. "Beauty & Personal Care") — strongest signal
  if (review.category && typeof review.category === 'string') signals.push(review.category);
  // Amazon BSR categories (e.g. "Beauty & Personal Care", "Eye Treatment Serums")
  if (Array.isArray(review.bsrDetail)) {
    for (const b of review.bsrDetail) {
      if (b && typeof b.category === 'string') signals.push(b.category);
    }
  }
  if (review.bestSellersRank && typeof review.bestSellersRank === 'string') signals.push(review.bestSellersRank);
  // Specs department
  const specs = review.specs || review.specifications || {};
  const dept = specs.details?.department || specs.department || specs.detail_bullets?.Department;
  if (dept && typeof dept === 'string') signals.push(dept);
  // Keyword fallback (product-name detection for products with no BSR/specs)
  signals.push(...keywordSignals(review));
  return signals.filter((s) => s && s.trim().length > 1);
}

function scoreCategorySignal(signal: string, catName: string): number {
  const sTokens = tokenize(signal);
  const cTokens = tokenize(catName);
  if (sTokens.length === 0 || cTokens.length === 0) return 0;
  const sigLower = signal.toLowerCase();
  const catLower = catName.toLowerCase();
  // Exact/full containment
  if (sigLower.includes(catLower) || catLower.includes(sigLower)) return 1;
  // Fraction of category words found in signal
  let overlap = 0;
  for (const w of cTokens) {
    if (sigLower.includes(w)) overlap++;
  }
  return overlap / cTokens.length;
}

async function getExistingCategories(): Promise<{ id: string; name: string; slug: string; parent_id: string | null }[]> {
  try {
    const sb = await getSupabaseAdmin();
    const { data } = await sb.from('categories').select('id, name, slug, parent_id').limit(500);
    return (data || []) as any[];
  } catch {
    return [];
  }
}

async function autoCreateCategory(name: string): Promise<string | null> {
  const clean = String(name || '').trim();
  if (!clean || clean.length < 2) return null;
  const slug = slugify(clean);
  try {
    const sb = await getSupabaseAdmin();
    const { data, error } = await sb
      .from('categories')
      .insert({
        id: crypto.randomUUID(),
        name: clean,
        slug,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) {
      // Race: another insert may have created it
      const { data: existing } = await sb.from('categories').select('id').eq('slug', slug).limit(1);
      if (existing && existing[0]) return existing[0].id;
      return null;
    }
    return data?.id || null;
  } catch {
    return null;
  }
}

/**
 * Detect the best matching category for an imported product.
 * Uses breadcrumb category, best_for, Amazon BSR, and spec department signals.
 * Auto-creates a new category when a strong signal exists with no match.
 */
export async function detectCategoryForProduct(review: any): Promise<{ category_id: string | null; best_for: string | null }> {
  try {
    const signals = categorySignals(review);
    const cats = await getExistingCategories();
    if (cats.length === 0) return { category_id: null, best_for: review.best_for || review.bestFor || null };

    let best: { id: string; name: string } | null = null;
    let bestScore = 0;
    const usedSignal = new Set<string>();

    for (const signal of signals) {
      if (!signal) continue;
      let signalBest: { id: string; name: string } | null = null;
      let signalScore = 0;
      for (const cat of cats) {
        const score = scoreCategorySignal(signal, cat.name);
        if (score > signalScore) {
          signalScore = score;
          signalBest = { id: cat.id, name: cat.name };
        }
      }
      if (signalBest && signalScore > bestScore) {
        best = signalBest;
        bestScore = signalScore;
        usedSignal.add(signal);
      }
    }

    // If we have a strong uncategorized signal (e.g. Amazon BSR/department), auto-create
    if (!best) {
      for (const signal of signals) {
        const clean = String(signal).trim();
        if (clean.length < 2) continue;
        if (/^\d/.test(clean)) continue; // e.g. "#1 Best Seller in X" rank prefixes
        const isAlreadyCat = cats.some((c) => c.name.toLowerCase() === clean.toLowerCase());
        if (isAlreadyCat) continue;
        const createdId = await autoCreateCategory(clean);
        if (createdId) {
          return { category_id: createdId, best_for: clean };
        }
      }
      return { category_id: null, best_for: review.best_for || review.bestFor || null };
    }

    // best_for award badge: derive from category or existing best_for
    const bestFor = review.best_for || review.bestFor || (best.name ? `Best ${best.name} Pick` : null);
    return { category_id: best.id, best_for: bestFor };
  } catch {
    return { category_id: null, best_for: review.best_for || review.bestFor || null };
  }
}

// ====== Brand Detection ======

/**
 * Detect brand from review data. Uses the brand field, else extracts from the
 * product name. Returns normalized brand + its DB row id (auto-created if needed).
 */
export async function detectBrandForProduct(review: any): Promise<{ brand: string | null; brand_id: string | null }> {
  let brandName = review.brand || null;
  if (brandName && typeof brandName === 'string') {
    brandName = normalizeBrandName(brandName);
  } else {
    const fromName = extractBrandFromName(review.product_name);
    if (fromName) brandName = normalizeBrandName(fromName);
  }
  if (!brandName || brandName.toLowerCase() === 'generic') {
    return { brand: null, brand_id: null };
  }
  const brandId = await ensureBrandForProduct(brandName).catch(() => null);
  return { brand: brandName, brand_id: brandId };
}

// ====== SEO Generation ======

/**
 * Generate full SEO metadata + editorial fields for a product using AI.
 * Falls back to deterministic heuristics if AI is unavailable.
 */
export interface ProductSeo {
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  best_for?: string;
  final_verdict?: string;
  editor_score?: number;
  review_summary?: string;
  pros?: string[];
  cons?: string[];
  key_features?: string[];
}

export async function generateSeoForProduct(product: any): Promise<ProductSeo> {
  const title = product.product_name || '';
  const brand = product.brand || '';
  const price = product.price || '';
  const rating = product.rating || 0;
  const category = product.best_for || product.category || '';
  const summary = product.review_summary || '';

  const fallback: ProductSeo = {};
  fallback.seo_title = `${title} Review${brand ? `: Best ${brand} Picks` : ''}`.substring(0, 60);
  fallback.seo_description = (summary || `Read our in-depth review of ${title}${brand ? ` by ${brand}` : ''}. ${category ? `Best for: ${category}.` : ''} Compare prices, pros & cons.`).substring(0, 158);
  fallback.seo_keywords = [title, brand, category, 'review', 'buying guide', 'best ' + category].filter(Boolean);
  fallback.best_for = category || `Best ${title.split(' ')[0] || 'Product'} Pick`;
  fallback.editor_score = Number(rating) ? Math.min(10, Math.max(1, Math.round(Number(rating) * 2 * 2) / 2)) : 8.5;

  try {
    const systemPrompt = 'You are a senior SEO and affiliate content strategist for DawnWire (dawnwire.com). Return strict, raw JSON only. No markdown, no commentary.';
    const prompt = `Generate premium SEO metadata + editorial fields for this product review.

PRODUCT:
- Name: ${title}
- Brand: ${brand || 'Unknown'}
- Price: $${price || 'N/A'}
- Rating: ${rating || 'N/A'}/5
- Category: ${category || 'N/A'}
- Review Summary: ${(summary || 'N/A').substring(0, 800)}

Return JSON ONLY with EXACTLY these keys:
{
  "seo_title": "High-CTR SEO title under 60 characters",
  "seo_description": "Compelling meta description under 160 characters with price and CTA",
  "seo_keywords": ["primary keyword", "secondary keyword", "brand keyword", "category keyword", "long-tail keyword"],
  "best_for": "Award badge phrase e.g. Best Overall Wireless Headphones",
  "final_verdict": "3-4 sentence honest expert verdict with clear recommendation",
  "editor_score": 9.2,
  "review_summary": "2-3 sentence SEO-friendly summary including product name and key differentiator",
  "pros": ["benefit-driven pro 1", "pro 2", "pro 3"],
  "cons": ["constructive con 1", "con 2"]
}`;
    const raw = await cohereChat(prompt, systemPrompt);
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) return fallback;
    const data = JSON.parse(cleaned.substring(start, end + 1));
    const result: Record<string, any> = {};
    if (data.seo_title && String(data.seo_title).length >= 10) result.seo_title = String(data.seo_title).substring(0, 65);
    if (data.seo_description && String(data.seo_description).length >= 40) result.seo_description = String(data.seo_description).substring(0, 160);
    if (Array.isArray(data.seo_keywords)) result.seo_keywords = data.seo_keywords.slice(0, 10).map((k: any) => String(k)).filter(Boolean);
    if (data.best_for && String(data.best_for).length >= 3) result.best_for = String(data.best_for);
    if (data.final_verdict && String(data.final_verdict).length >= 20) result.final_verdict = String(data.final_verdict);
    if (typeof data.editor_score === 'number') result.editor_score = Math.min(10, Math.max(1, data.editor_score));
    if (data.review_summary && String(data.review_summary).length >= 20) result.review_summary = String(data.review_summary);
    if (Array.isArray(data.pros)) result.pros = data.pros.slice(0, 8).map((p: any) => String(p)).filter(Boolean);
    if (Array.isArray(data.cons)) result.cons = data.cons.slice(0, 6).map((c: any) => String(c)).filter(Boolean);
    return result;
  } catch {
    return fallback;
  }
}

// ====== Orchestration ======

export interface AutoProcessResult {
  productId: string;
  brand: string | null;
  brand_id: string | null;
  category_id: string | null;
  best_for: string | null;
  seo: boolean;
  changes: string[];
  error?: string;
}

/**
 * Full auto-enrichment for a single product: brand + category + AI SEO.
 * Call after import to finalize the record before/while going live.
 */
export async function autoProcessProduct(productId: string): Promise<AutoProcessResult> {
  const changes: string[] = [];
  try {
    const sb = await getSupabaseAdmin();
    const { data: product } = await sb.from('product_reviews').select('*').eq('id', productId).maybeSingle();
    if (!product) return { productId, brand: null, brand_id: null, category_id: null, best_for: null, seo: false, changes: [], error: 'Product not found' };

    const updates: Record<string, any> = {};

    // 1. Brand detection
    let brandResult = { brand: null as string | null, brand_id: null as string | null };
    try {
      brandResult = await detectBrandForProduct(product);
      if (brandResult.brand) {
        updates.brand = brandResult.brand;
        if (brandResult.brand_id) updates.brand_id = brandResult.brand_id;
        if (product.brand !== brandResult.brand) changes.push(`brand: ${product.brand || '(none)'} -> ${brandResult.brand}`);
      }
    } catch { /* keep existing */ }

    // 2. Category detection
    try {
      const catResult = await detectCategoryForProduct(product);
      if (catResult.category_id) {
        updates.category_id = catResult.category_id;
        if (product.category_id !== catResult.category_id) changes.push('category_id assigned');
      }
      if (catResult.best_for && !product.best_for) {
        updates.best_for = catResult.best_for;
        changes.push(`best_for: ${catResult.best_for}`);
      }
    } catch { /* keep existing */ }

    // 3. AI SEO generation (fills missing fields, never overwrites existing SEO)
    let seoDone = false;
    try {
      const seo = await generateSeoForProduct({ ...product, ...updates });
      if (seo.seo_title && !product.seo_title) {
        updates.seo_title = seo.seo_title;
        changes.push('seo_title generated');
      }
      if (seo.seo_description && !product.seo_description) {
        updates.seo_description = seo.seo_description;
        changes.push('seo_description generated');
      }
      if (Array.isArray(seo.seo_keywords) && seo.seo_keywords.length && (!product.seo_keywords || !product.seo_keywords.length)) {
        updates.seo_keywords = seo.seo_keywords;
        changes.push('seo_keywords generated');
      }
      if (seo.best_for && !product.best_for && !updates.best_for) {
        updates.best_for = seo.best_for;
        changes.push('best_for generated');
      }
      if (seo.final_verdict && !product.final_verdict) {
        updates.final_verdict = seo.final_verdict;
        changes.push('final_verdict generated');
      }
      if (typeof seo.editor_score === 'number' && !product.editor_score) {
        updates.editor_score = seo.editor_score;
        changes.push('editor_score generated');
      }
      if (seo.review_summary && !product.review_summary) {
        updates.review_summary = seo.review_summary;
        changes.push('review_summary generated');
      }
      if (Array.isArray(seo.pros) && seo.pros.length && (!product.pros || !product.pros.length)) {
        updates.pros = seo.pros;
        changes.push('pros generated');
      }
      if (Array.isArray(seo.cons) && seo.cons.length && (!product.cons || !product.cons.length)) {
        updates.cons = seo.cons;
        changes.push('cons generated');
      }
      seoDone = true;
    } catch { /* AI unavailable — keep existing */ }

    if (Object.keys(updates).length > 0) {
      await sb.from('product_reviews').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', productId);
    }

    return {
      productId,
      brand: brandResult.brand,
      brand_id: brandResult.brand_id,
      category_id: updates.category_id || product.category_id || null,
      best_for: updates.best_for || product.best_for || null,
      seo: seoDone,
      changes,
    };
  } catch (e: any) {
    return { productId, brand: null, brand_id: null, category_id: null, best_for: null, seo: false, changes: [], error: e.message };
  }
}

/**
 * Backfill: auto-process all published products missing brand/category/SEO.
 * Runs in batches to respect API rate limits.
 */
export async function autoProcessAllProducts(limit: number = 50, onlyMissing = true): Promise<{ processed: number; results: AutoProcessResult[] }> {
  const sb = await getSupabaseAdmin();
  const { data: products } = await sb
    .from('product_reviews')
    .select('id, product_name, brand, best_for, category_id, seo_title, final_verdict')
    .eq('status', 'published')
    .limit(Math.min(limit, 200));

  const targets = onlyMissing
    ? (products || []).filter((p: any) => !p.category_id || !p.seo_title || !p.best_for)
    : (products || []);

  const results: AutoProcessResult[] = [];
  for (const p of targets.slice(0, limit)) {
    const r = await autoProcessProduct(p.id);
    results.push(r);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return { processed: results.length, results };
}
