import { ProductReview } from '../types';

export function normalizeProduct(raw: any): ProductReview {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      productName: 'Unknown Product',
      rating: 0,
      pros: [],
      cons: [],
      keyFeatures: [],
      ctaText: 'Buy Now',
      schemaEnabled: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
  }

  const rawRating = raw.rating !== undefined && raw.rating !== null ? Number(raw.rating) : undefined;
  const validRating = rawRating !== undefined && !isNaN(rawRating) && rawRating >= 0 && rawRating <= 5 ? rawRating : 0;

  // Preserve specs details if nested
  const specsObj = typeof raw.specs === 'object' && raw.specs !== null ? raw.specs : {};

  return {
    id: String(raw.id || ''),
    slug: raw.slug ? String(raw.slug) : undefined,
    productName: String(raw.product_name || raw.productName || raw.title || 'Untitled Product'),
    brand: raw.brand ? String(raw.brand) : undefined,
    productImage: raw.product_image || raw.productImage || raw.featured_image || raw.featuredImage || '',
    affiliateUrl: raw.affiliate_url || raw.affiliateUrl || '',
    price: raw.price ? String(raw.price) : undefined,
    originalPrice: raw.original_price || raw.originalPrice ? String(raw.original_price || raw.originalPrice) : undefined,
    rating: validRating,
    bestFor: raw.best_for || raw.bestFor || undefined,
    stockStatus: raw.stock_status || raw.stockStatus || 'in_stock',
    dealBadge: raw.deal_badge || raw.dealBadge || undefined,
    couponCode: raw.coupon_code || raw.couponCode || undefined,
    couponExpiry: raw.coupon_expiry || raw.couponExpiry || undefined,
    categoryId: raw.category_id || raw.categoryId || undefined,
    pros: Array.isArray(raw.pros) ? raw.pros : (typeof raw.pros === 'string' && raw.pros ? [raw.pros] : []),
    cons: Array.isArray(raw.cons) ? raw.cons : (typeof raw.cons === 'string' && raw.cons ? [raw.cons] : []),
    keyFeatures: Array.isArray(raw.key_features || raw.keyFeatures) ? (raw.key_features || raw.keyFeatures) : [],
    specs: specsObj,
    ctaText: raw.cta_text || raw.ctaText || 'Buy Now',
    reviewSummary: raw.review_summary || raw.reviewSummary || raw.ai_verdict || raw.aiVerdict || '',
    aiVerdict: raw.ai_verdict || raw.aiVerdict || '',
    finalVerdict: raw.final_verdict || raw.finalVerdict || '',
    alternatives: Array.isArray(raw.alternatives) ? raw.alternatives : [],
    faqs: Array.isArray(raw.faqs) ? raw.faqs : [],
    schemaEnabled: Boolean(raw.schema_enabled ?? raw.schemaEnabled ?? true),
    status: raw.status === 'published' ? 'published' : 'draft',
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || undefined,
    clickCount: Number(raw.click_count || raw.clickCount || 0),
    pageViews: Number(raw.page_views || raw.pageViews || 0),
    ...(raw._entities ? { _entities: raw._entities } : {}),
  } as ProductReview;
}

export function normalizeProducts(items: any[]): ProductReview[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeProduct);
}
