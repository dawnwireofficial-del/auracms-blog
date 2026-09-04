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
  productName?: string;
  slug: string;
  brand: string;
  mainCategory: string;
  category?: string;
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
  price?: number | string;
  referencePrice?: number;
  originalPrice?: number;
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
  specs?: Record<string, string>;
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
  reviewSummary?: string;
  categoryId?: string;
  stockStatus?: string;
  dealBadge?: string;
  couponCode?: string;
  clickCount?: number;
  createdAt?: string;
  productImage?: string;
  ctaText?: string;
  status?: string;
  keyFeatures?: string[];
  schemaEnabled?: boolean;
  couponExpiry?: string;
  alternativeStores?: { storeName: string; price: string; url: string; logo?: string }[];
  affiliateDisclaimer?: string;
  finalVerdict?: string;
  aiVerdict?: string;
  pageViews?: number;
  reviewArticle?: string;
  faq?: Array<{ question: string; answer: string }>;
  affiliateDisclosure?: string;
}

export interface MediaItem {
  id: string;
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
  altText?: string;
}

export type ProductReview = Product;

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  productCount: number;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  seoContent?: string;
  icon?: string; // SVG icon identifier
  desktopBanner?: string;
  mobileBanner?: string;
  subcategories?: Subcategory[];
  featuredBrandIds?: string[];
  featuredProductIds?: string[];
  dealsProductIds?: string[];
  order?: number;
  status?: 'active' | 'inactive';
  image?: string;
  parentId?: string;
  animationStyle?: string;
  sectionsBuilderConfig?: CategorySection[];
}

export interface CategorySection {
  id: string;
  type: string;
  sectionType?: string;
  categoryId?: string;
  title: string;
  subtitle?: string;
  enabled?: boolean;
  isActive?: boolean;
  order?: number;
  sortOrder?: number;
  productIds?: string[];
  customContent?: string;
  settings?: Record<string, any>;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  logo?: string;
  description: string;
  websiteUrl?: string;
  website?: string;
  featuredProductIds?: string[];
  featured?: boolean;
  status?: string;
}

export interface Deal {
  id: string;
  productId: string;
  dealPrice?: number;
  salePrice?: number;
  referencePrice?: number;
  regularPrice?: number;
  discountPercentage?: number;
  categoryId?: string;
  isHomepage?: boolean;
  isFeatured?: boolean;
  dealBadge?: string;
  dealType?: string;
  dealStart?: string;
  dealEnd?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface Comparison {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  category?: string;
  productIds: string[]; // 2 to 4 products
  overview: string;
  specsComparison: Record<string, Record<string, string>>; // specName -> { productId: value }
  winnerId: string;
  winnerName?: string;
  verdict?: string;
  summary?: string;
  bestOverallId: string;
  bestBudgetId: string;
  bestPremiumId: string;
  authorId: string;
  publishedAt: string;
  lastUpdated?: string;
  seoTitle: string;
  metaDescription: string;
}

export interface EditorialReview {
  id: string;
  slug: string;
  title: string;
  productName?: string;
  productId: string;
  authorId: string;
  authorName?: string;
  reviewerId: string;
  summary: string;
  contentMarkdown: string;
  pros: string[];
  cons: string[];
  verdict: string;
  score: number;
  overallScore?: number;
  publishedAt: string;
  updatedAt: string;
  lastUpdated?: string;
  seoTitle: string;
  metaDescription: string;
}

export interface BuyingGuide {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  category?: string;
  authorId: string;
  intro: string;
  excerpt?: string;
  contentMarkdown: string;
  readTimeMinutes?: number;
  recommendedProductIds: string[];
  faqs: { question: string; answer: string }[];
  publishedAt: string;
  updatedAt: string;
  lastUpdated?: string;
  seoTitle: string;
  metaDescription: string;
}

export type BannerPlacement = 'hero_main' | 'hero_tile_1' | 'hero_tile_2' | 'hero_tile_3' | 'hero_tile_4' | 'promo_1' | 'promo_2' | 'promo_3' | 'promo_mid';

export interface CategoryBanner {
  id: string;
  categoryId: string;
  subcategory?: string;
  desktopImage: string;
  mobileImage?: string;
  title?: string;
  heading?: string;
  subtitle?: string;
  badgeText?: string;
  description: string;
  ctaText: string;
  targetUrl?: string;
  ctaLink?: string;
  altText?: string;
  affiliateUrl?: string;
  textAlignment?: 'left' | 'center' | 'right';
  overlayStrength?: number; // 0 to 100
  startDate?: string;
  endDate?: string;
  order?: number;
  sortOrder?: number;
  isEnabled?: boolean;
  isActive?: boolean;
  isArchived?: boolean;
  imageOnly?: boolean;
  placement?: BannerPlacement;
  impressions?: number;
  clicks?: number;
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
  keyword?: string;
  searchVolume?: number;
  competition?: string;
  estimatedCTR?: number;
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
  sender?: 'user' | 'assistant';
  role?: 'user' | 'assistant' | 'system';
  text?: string;
  content?: string;
  timestamp?: string | number;
  recommendedProducts?: Product[];
  comparison?: { title: string; items: { name: string; highlight: string; link: string }[] };
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  authorId: string;
  categoryId: string;
  productId?: string;
  tags: string[];
  status: 'draft' | 'pending' | 'ready' | 'published' | 'scheduled';
  visibility: 'public' | 'private';
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  readingTime: number;
  isFeatured: boolean;
  isTrending: boolean;
  isEditorsPick: boolean;
  allowComments: boolean;
  language?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'read' | 'unread';
}

export interface DripCampaignEmail {
  step: number;
  subject: string;
  delayDays: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId?: string;
  parentId?: string;
  name: string;
  email: string;
  content: string;
  status: 'approved' | 'pending' | 'spam';
  likesCount: number;
  likedBy?: string[];
  createdAt: string;
}

export interface AffiliateLink {
  id: string;
  title: string;
  destinationUrl: string;
  affiliateUrl: string;
  shortSlug: string;
  categoryId?: string;
  postId?: string;
  buttonText: string;
  disclosureText?: string;
  noFollow: boolean;
  sponsored: boolean;
  openInNewTab: boolean;
  clickCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  defaultLanguage: string;
  postsPerPage: number;
  enableComments: boolean;
  allowGuestComments: boolean;
  requireCommentApproval: boolean;
  affiliateDisclosureText: string;
  primaryColor: string;
  secondaryColor: string;
  headerMenu: { label: string; url: string }[];
  footerColumns: {
    title: string;
    links: { label: string; url: string }[];
  }[];
  socialLinks: {
    platform: string;
    url: string;
  }[];
  robotsTxt?: string;
  analyticsGaId?: string;
  analyticsGtmId?: string;
  metaPixelId?: string;
  searchConsoleVerification?: string;
  customHeadScripts?: string;
  customFooterScripts?: string;
  designSettings?: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor' | 'author' | 'subscriber';
  avatar?: string;
  bio?: string;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
}

export interface TopicCluster {
  id: string;
  name: string;
  slug: string;
  description: string;
  pillarPageId: string;
  pillarPageSlug: string;
  pillarPageTitle: string;
  clusterPostIds: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ContentUpgrade {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  postId?: string;
  postSlug?: string;
  downloadCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  slug?: string;
  client?: string;
  industry?: string;
  serviceType: string;
  image?: string;
  shortDescription?: string;
  problem?: string;
  solution?: string;
  results?: string;
  toolsUsed?: string[];
  websiteUrl?: string;
  gallery?: string[];
  testimonial?: { text: string; author: string; role?: string };
  ctaText: string;
  featured: boolean;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  icon?: string;
  overview: string;
  includes: string[];
  process: { step: string; description: string }[];
  benefits: string[];
  faqs?: { q: string; a: string }[];
  ctaText: string;
  ctaUrl?: string;
  featured: boolean;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt?: string;
}

export interface Redirect {
  id: string;
  source_url: string;
  target_url: string;
  redirect_type?: string;
  hit_count: number;
  createdAt?: string;
}

export interface Error404Log {
  id: string;
  url: string;
  referrer?: string;
  hit_count: number;
  first_seen: string;
  last_seen: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
  dripStep?: number;
  dripLastSentAt?: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface PriceAlert {
  id: string;
  userId?: string;
  sessionId?: string;
  email: string;
  productId: string;
  targetPrice: number;
  currentPrice: number;
  alertType: 'price_drop' | 'price_increase' | 'back_in_stock' | 'deal_available';
  isTriggered: boolean;
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: string;
  triggeredAt?: string;
}

export interface HomepageSection {
  id: string;
  sectionType: string;
  title?: string;
  subtitle?: string;
  sortOrder: number;
  isActive: boolean;
  settings: Record<string, any>;
}

export interface HomepageHeroSlide {
  id: string;
  desktopImage: string;
  mobileImage?: string;
  heading?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  altText?: string;
  sortOrder: number;
  isActive: boolean;
  imageOnly?: boolean;
  placement?: BannerPlacement;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
}

export interface WishlistItem {
  id: string;
  userId?: string;
  sessionId?: string;
  productId: string;
  createdAt: string;
}

export interface RecentlyViewed {
  id: string;
  userId?: string;
  sessionId?: string;
  productId: string;
  viewedAt: string;
}

export interface SavedComparison {
  id: string;
  userId?: string;
  sessionId?: string;
  name: string;
  productIds: string[];
}

export interface AffiliateClick {
  id: string;
  productId?: string;
  categoryId?: string;
  pageUrl?: string;
  pageType?: string;
  bannerId?: string;
  sectionType?: string;
  ctaPosition?: string;
  deviceType?: string;
  sessionId?: string;
  userId?: string;
  campaign?: string;
  articleId?: string;
  /** Browser user-agent captured at click time (bot detection). */
  userAgent?: string | null;
  /** True when the click came from a bot/script/preview scraper. */
  isBot?: boolean;
  createdAt: string;
}

export interface SearchLog {
  id: string;
  query: string;
  categoryId?: string;
  resultsCount: number;
  hasResults: boolean;
  sessionId?: string;
  userId?: string;
  clickedProductId?: string;
  createdAt: string;
}

export interface ExtendedProductReview extends Product {
  subcategoryId?: string;
  brandId?: string;
  features?: string[];
  technicalSpecs?: Record<string, string>;
  shippingInfo?: string;
  editorRating?: number;
  priceUpdatedAt?: string;
  lastUpdatedAt?: string;
  amazonUrl?: string;
  gallery?: string[];
  variants?: any;
  comparisonAttributes?: Record<string, string>;
  isTopRated?: boolean;
  brandObj?: Brand;
  brandName?: string;
}

