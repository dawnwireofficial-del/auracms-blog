export function sanitizeReviewSummary(text: string | null | undefined): string | null {
  if (!text) return null;
  let clean = text;
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<[^>]*>/g, '');
  clean = clean.replace(/[.#]\w[^;{]*\{[^}]*\}/g, '');
  clean = clean.replace(/@\w+[^{]*\{[^}]*\}/g, '');
  clean = clean.replace(/@\w+[^;{]*;/g, '');
  clean = clean.replace(/\b(function|var|let|const)\s+\w+\s*\(?[^)]*\)?\s*\{?[^}]*\}?/g, '');
  clean = clean.replace(/[a-z-]+\s*:\s*[^;{]+[;{]/gi, '');
  clean = clean.replace(/[{}[\]()]/g, '');
  clean = clean.replace(/\.po-\w+/g, '');
  clean = clean.replace(/#po-\w+/g, '');
  clean = clean.replace(/logTechTermAssistMetric[\s\S]*?(?=\s|$)/g, '');
  clean = clean.replace(/csa\([^)]*\)[^;]*;/g, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean || null;
}

export function sanitizeText(text: unknown): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizePrice(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value.toFixed(2) : null;
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/[^0-9.]/g, '');
    const n = parseFloat(trimmed);
    return isNaN(n) ? null : n.toFixed(2);
  }
  return null;
}

export function normalizeRating(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) && n >= 0 && n <= 5 ? Math.round(n * 10) / 10 : null;
}

export function normalizeCount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export function sanitizeDealBadge(value: unknown): string | null {
  if (!value) return null;
  const s = String(value)
    .replace(/\.\w+/g, '')
    .replace(/[.#]\w[\w-]*([^{]*\{[^}]*\})?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > 100 ? s.substring(0, 100) : s || null;
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(v => typeof v === 'string').map(v => v.trim()).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((v: unknown) => typeof v === 'string').map((v: string) => v.trim()).filter(Boolean);
    } catch {}
    return [value.trim()].filter(Boolean);
  }
  return [];
}

export function normalizeImages(images: unknown): string[] {
  if (Array.isArray(images)) {
    return images
      .map(img => {
        if (typeof img === 'string') return img;
        if (img && typeof img === 'object') {
          if ('url' in img && typeof (img as any).url === 'string') return (img as any).url;
          if ('src' in img && typeof (img as any).src === 'string') return (img as any).src;
        }
        return null;
      })
      .filter((url): url is string => url !== null && /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif)/i.test(url))
      .filter((url, i, arr) => arr.indexOf(url) === i)
      .slice(0, 20);
  }
  if (typeof images === 'string') {
    const url = images.trim();
    return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|avif)/i.test(url) ? [url] : [];
  }
  return [];
}

export function normalizeVideoUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('data:')) return null;
  if (url.includes('youtube.com/embed?listType=search')) return null;
  if (url.includes('youtube.com/results')) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

export function normalizeBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true' || value === '1';
  if (typeof value === 'number') return value === 1;
  return false;
}

export function normalizeSpecs(specs: unknown): Record<string, unknown> {
  if (typeof specs !== 'object' || specs === null) return {};
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(specs)) {
    if (key === 'gallery' && Array.isArray(val)) {
      result[key] = normalizeImages(val);
      continue;
    }
    if (key === 'video_url' || key === 'videoUrl') {
      const v = normalizeVideoUrl(val);
      if (v) result[key] = v;
      continue;
    }
    if (key === 'isPrime' || key === 'isPrimeDeal' || key === 'isPrimeExclusive') {
      result[key] = normalizeBoolean(val);
      continue;
    }
    if (key === 'price' || key === 'currentPrice' || key === 'referencePrice' || key === 'listPrice') {
      const p = normalizePrice(val);
      if (p) result[key] = p;
      continue;
    }
    if (key === 'asin' || key === 'source' || key === 'marketplace' || key === 'availability' || key === 'currency') {
      result[key] = String(val).trim();
      continue;
    }
    if (key === 'details' && typeof val === 'object' && val !== null) {
      result[key] = normalizeSpecs(val);
      continue;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed) result[key] = trimmed;
      continue;
    }
    if (typeof val === 'number') {
      result[key] = val;
      continue;
    }
    if (typeof val === 'boolean') {
      result[key] = val;
      continue;
    }
    if (Array.isArray(val)) {
      result[key] = val;
      continue;
    }
  }
  return result;
}

export interface NormalizedProduct {
  product_name: string;
  brand: string | null;
  price: string | null;
  original_price: string | null;
  rating: number | null;
  review_count: number | null;
  pros: string[];
  cons: string[];
  key_features: string[];
  review_summary: string | null;
  final_verdict: string | null;
  best_for: string | null;
  slug?: string;
  stock_status: string;
  deal_badge: string | null;
  status: string;
  editor_score: number;
  coupon_code: string | null;
  coupon_expiry: string | null;
  asin: string | null;
  source: string | null;
  videoUrl: string | null;
  gallery: string[];
  ingredients: string | null;
  unitSize: string | null;
  unitPrice: string | null;
  bsrDetail: Array<{ rank: number; category: string }>;
  reviewHighlights: string | null;
  reviews: Array<{ name: string; avatar?: string; rating: number; title?: string; date?: string; body?: string; verified?: boolean; images?: string[] }>;
  reviewStats: { total: number; average: number; distribution: { 5: number; 4: number; 3: number; 2: number; 1: number } } | null;
  variations: Array<{ name: string; selectedValue: string; options: { value: string; image?: string; price?: string }[]; priceRange?: { low: string; high: string } }>;
  specs: Record<string, unknown> | null;
}

export function normalizeImportedProduct(raw: any): NormalizedProduct {
  const gallery = normalizeImages(raw.gallery || raw.additionalImages || raw.images || []);
  const videoUrl = normalizeVideoUrl(raw.videoUrl || raw.video_url);
  const reviewSummary = sanitizeText(raw.review_summary || raw.shortDescription || raw.fullDescription || '');
  const finalVerdict = sanitizeText(raw.final_verdict || raw.editorVerdict || '');
  const reviewHighlights = sanitizeText(raw.reviewHighlights || '');
  const ingredients = sanitizeText(raw.ingredients || '');
  const unitSize = sanitizeText(raw.unitSize || '');
  const unitPrice = sanitizeText(raw.unitPrice || '');
  const pros = normalizeStringArray(raw.pros);
  const cons = normalizeStringArray(raw.cons);
  const keyFeatures = normalizeStringArray(raw.key_features || raw.mainFeatures || raw.features);

  let reviewStats = null;
  if (raw.reviewStats && typeof raw.reviewStats === 'object') {
    const rs = raw.reviewStats;
    const total = normalizeCount(rs.total);
    const average = normalizeRating(rs.average);
    const distribution = rs.distribution && typeof rs.distribution === 'object'
      ? {
          5: normalizeCount(rs.distribution['5']) || 0,
          4: normalizeCount(rs.distribution['4']) || 0,
          3: normalizeCount(rs.distribution['3']) || 0,
          2: normalizeCount(rs.distribution['2']) || 0,
          1: normalizeCount(rs.distribution['1']) || 0,
        }
      : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (total || average) {
      reviewStats = { total: total || 0, average: average || 0, distribution };
    }
  }

  let reviews: any[] = [];
  if (Array.isArray(raw.reviews)) {
    reviews = raw.reviews
      .filter((r: any) => r && typeof r === 'object')
      .map((r: any) => ({
        name: sanitizeText(r.name || ''),
        avatar: typeof r.avatar === 'string' ? r.avatar : undefined,
        rating: normalizeRating(r.rating) || 0,
        title: sanitizeText(r.title || ''),
        date: typeof r.date === 'string' ? r.date : undefined,
        body: sanitizeText(r.body || ''),
        verified: Boolean(r.verified),
        images: Array.isArray(r.images) ? r.images.filter((i: unknown) => typeof i === 'string').slice(0, 5) : undefined,
      }))
      .slice(0, 50);
  }

  let bsrDetail: Array<{ rank: number; category: string }> = [];
  if (Array.isArray(raw.bsrDetail)) {
    bsrDetail = raw.bsrDetail
      .filter((b: any) => b && typeof b.rank === 'number' && typeof b.category === 'string')
      .slice(0, 5);
  }

  let variations: any[] = [];
  if (Array.isArray(raw.variations)) {
    variations = raw.variations
      .filter((v: any) => v && typeof v === 'object')
      .map((v: any) => ({
        name: String(v.name || ''),
        selectedValue: String(v.selectedValue || ''),
        options: Array.isArray(v.options) ? v.options.map((o: any) => ({
          value: String(o.value || ''),
          image: typeof o.image === 'string' ? o.image : undefined,
          price: normalizePrice(o.price) || undefined,
        })) : [],
        priceRange: v.priceRange && typeof v.priceRange === 'object'
          ? { low: String(v.priceRange.low || ''), high: String(v.priceRange.high || '') }
          : undefined,
      }));
  }

  const rprice = normalizePrice(raw.price || raw.currentPrice);
  const rlistPrice = normalizePrice(raw.listPrice || raw.original_price || raw.referencePrice);

  return {
    product_name: String(raw.product_name || raw.title || '').trim().substring(0, 500),
    brand: raw.brand ? String(raw.brand).trim().substring(0, 200) : null,
    price: rprice,
    original_price: rlistPrice,
    rating: normalizeRating(raw.rating),
    review_count: normalizeCount(raw.reviewCount || raw.review_count),
    pros,
    cons,
    key_features: keyFeatures,
    review_summary: reviewSummary || null,
    final_verdict: finalVerdict || null,
    best_for: raw.best_for || raw.bestFor || null,
    slug: raw.slug || undefined,
    stock_status: raw.stockStatus || raw.stock_status || 'in_stock',
    deal_badge: sanitizeDealBadge(raw.dealBadge || raw.deal_badge),
    status: raw.status || 'draft',
    editor_score: typeof raw.editor_score === 'number' ? raw.editor_score : (typeof raw.editorScore === 'number' ? raw.editorScore : 0),
    coupon_code: raw.couponCode || raw.coupon_code || null,
    coupon_expiry: raw.couponExpiry || raw.coupon_expiry || null,
    asin: raw.asin ? String(raw.asin).trim() : null,
    source: raw.source ? String(raw.source).trim() : null,
    videoUrl,
    gallery,
    ingredients: ingredients || null,
    unitSize: unitSize || null,
    unitPrice: unitPrice || null,
    bsrDetail,
    reviewHighlights: reviewHighlights || null,
    reviews,
    reviewStats,
    variations,
    specs: raw.specs && typeof raw.specs === 'object' ? normalizeSpecs(raw.specs) : null,
  };
}
