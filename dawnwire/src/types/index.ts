/**
 * DawnWire - Type Definitions
 */

export interface ProductVideo {
  id: string;
  title: string;
  youtubeId: string;
  author: string;
  duration: string;
  thumbnailUrl?: string;
  type: 'review' | 'unboxing' | 'demo' | 'benchmark';
}

export interface Product {
  id: string;
  asin: string;
  title: string;
  slug: string;
  brand: string;
  mainCategory: string;
  subcategory: string;
  productType: string;
  shortDescription: string;
  fullDescription: string;
  images: string[];
  videos?: ProductVideo[];
  videoUrl?: string;
  amazonOriginalUrl: string;
  affiliateUrl: string;
  amazonMarketplace: string;
  associateTrackingId: string;
  currentPrice?: number;
  referencePrice?: number;
  currency: string;
  discountPercentage?: number;
  isAvailable: boolean;
  isDeal: boolean;
  dealStart?: string;
  dealEnd?: string;
  isPrime: boolean;
  rating?: number;
  reviewCount?: number;
  mainFeatures: string[];
  specifications: Record<string, string>;
  pros: string[];
  cons: string[];
  bestFor: string;
  editorVerdict: string;
  editorScore: number; // 0.0 - 10.0
  variants?: { name: string; asin: string; price?: number }[];
  similarProductIds: string[];
  alternativeProductIds: string[];
  relatedComparisonIds: string[];
  relatedGuideIds: string[];
  isFeatured: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  published: boolean;
  lastSyncedAt: string;
  lastReviewedAt?: string;
  seoTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  canonicalUrl?: string;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  productCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  seoContent: string;
  icon: string; // SVG icon identifier
  desktopBanner?: string;
  mobileBanner?: string;
  subcategories: Subcategory[];
  featuredBrandIds: string[];
  featuredProductIds: string[];
  dealsProductIds: string[];
  order: number;
  sectionsBuilderConfig?: CategorySection[];
}

export interface CategorySection {
  id: string;
  type: 'hero_banner' | 'subcategory_grid' | 'product_carousel' | 'product_grid' | 'deals' | 'buying_guides' | 'comparison_table' | 'brands' | 'custom_text' | 'ai_finder';
  title: string;
  enabled: boolean;
  order: number;
  productIds?: string[];
  customContent?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  websiteUrl: string;
  featuredProductIds: string[];
}

export interface Deal {
  id: string;
  productId: string;
  dealPrice: number;
  referencePrice: number;
  discountPercentage: number;
  categoryId: string;
  isHomepage: boolean;
  dealBadge: string;
  dealStart: string;
  dealEnd: string;
}

export interface Comparison {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  productIds: string[]; // 2 to 4 products
  overview: string;
  specsComparison: Record<string, Record<string, string>>; // specName -> { productId: value }
  winnerId: string;
  bestOverallId: string;
  bestBudgetId: string;
  bestPremiumId: string;
  authorId: string;
  publishedAt: string;
  seoTitle: string;
  metaDescription: string;
}

export interface EditorialReview {
  id: string;
  slug: string;
  title: string;
  productId: string;
  authorId: string;
  reviewerId: string;
  summary: string;
  contentMarkdown: string;
  pros: string[];
  cons: string[];
  verdict: string;
  score: number;
  publishedAt: string;
  updatedAt: string;
  seoTitle: string;
  metaDescription: string;
}

export interface BuyingGuide {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  authorId: string;
  intro: string;
  contentMarkdown: string;
  recommendedProductIds: string[];
  faqs: { question: string; answer: string }[];
  publishedAt: string;
  updatedAt: string;
  seoTitle: string;
  metaDescription: string;
}

export interface CategoryBanner {
  id: string;
  categoryId: string;
  subcategory?: string;
  desktopImage: string;
  mobileImage: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  description: string;
  ctaText: string;
  targetUrl: string;
  affiliateUrl?: string;
  textAlignment: 'left' | 'center' | 'right';
  overlayStrength: number; // 0 to 100
  startDate?: string;
  endDate?: string;
  isEnabled: boolean;
  order: number;
  impressions: number;
  clicks: number;
}

export interface Author {
  id: string;
  slug: string;
  name: string;
  avatarUrl: string;
  bio: string;
  role: string;
  expertiseCategories: string[];
  publishedArticlesCount: number;
  socialLinks?: { twitter?: string; linkedin?: string; website?: string };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'super_admin' | 'admin' | 'editor' | 'seo_manager' | 'product_manager' | 'analyst' | 'viewer' | 'user';
  createdAt: string;
  wishlistProductIds: string[];
}

export interface AffiliateClickLog {
  id: string;
  productId: string;
  asin: string;
  productTitle: string;
  category: string;
  brand: string;
  ctaText: string;
  ctaPosition: string; // e.g., "product_page_hero", "sticky_mobile", "card_grid", "chatbot"
  pageSource: string;
  device: 'mobile' | 'desktop' | 'tablet';
  marketplace: string;
  timestamp: string;
}

export interface SEOOpportunity {
  id: string;
  type: 'ranking_4_20' | 'high_impression_low_ctr' | 'traffic_loss' | 'missing_schema' | 'content_refresh';
  title: string;
  path: string;
  targetKeyword: string;
  currentPosition?: number;
  impressions?: number;
  ctr?: number;
  suggestion: string;
  status: 'ai_research' | 'draft_prepared' | 'fact_check_required' | 'editor_review' | 'published';
}

export interface AmazonSyncLog {
  id: string;
  timestamp: string;
  productsSynced: number;
  priceUpdates: number;
  availabilityChanges: number;
  failedAsins: string[];
  status: 'success' | 'partial' | 'failed';
  triggerType: 'scheduled' | 'manual';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendedProducts?: Product[];
  comparison?: { title: string; items: { name: string; highlight: string; link: string }[] };
}
