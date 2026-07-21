export type UserRole = 'super_admin' | 'admin' | 'editor' | 'author' | 'subscriber';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  status: 'active' | 'suspended' | 'banned';
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  authorId: string;
  categoryId: string;
  tags: string[]; // tag slugs or names
  status: 'draft' | 'pending' | 'published' | 'scheduled';
  visibility: 'public' | 'private';
  scheduledAt?: string;
  publishedAt?: string;
  language?: string;
  translationId?: string;
  createdAt: string;
  updatedAt: string;
  readingTime: number; // in minutes
  isFeatured: boolean;
  isTrending: boolean;
  isEditorsPick: boolean;
  allowComments: boolean;
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  status: 'active' | 'inactive';
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId?: string; // if registered
  parentId?: string; // for nested
  name: string; // fallback if guest
  email: string; // fallback if guest
  content: string;
  status: 'approved' | 'pending' | 'spam';
  likesCount: number;
  likedBy?: string[]; // userIds or IPs
  createdAt: string;
}

export interface AffiliateLink {
  id: string;
  title: string;
  destinationUrl: string;
  affiliateUrl: string;
  shortSlug: string; // for /go/[slug]
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
  // SEO settings
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  analyticsGaId?: string;
  analyticsGtmId?: string;
  searchConsoleVerification?: string;
  metaPixelId?: string;
  customHeadScripts?: string;
  customFooterScripts?: string;
  // Sitemap settings
  sitemapEnabled?: boolean;
  sitemapIncludePosts?: boolean;
  sitemapIncludePages?: boolean;
  sitemapIncludeCategories?: boolean;
  // Robots
  robotsContent?: string;
  // Performance
  lazyLoadImages?: boolean;
  preloadFeaturedImage?: boolean;
  // Breadcrumbs
  breadcrumbsEnabled?: boolean;
  breadcrumbsSeparator?: string;
  // Outdated content
  outdatedThresholdDays?: number;
  // Affiliate
  autoAffiliateDisclaimer?: boolean;
}

export interface SeoMeta {
  id?: string;
  pageType: 'post' | 'page' | 'category' | 'product' | 'author' | 'home';
  pageId?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  schemaType?: string;
  schemaEnabled?: boolean;
  breadcrumbsHide?: boolean;
  createdAt?: string;
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

export interface InternalLink {
  id?: string;
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  anchorText: string;
  createdAt?: string;
}

export interface Keyword {
  id: string;
  keyword: string;
  pageId?: string;
  pageType?: string;
  status: 'planned' | 'writing' | 'published' | 'ranking' | 'needs_update';
  searchIntent?: string;
  difficulty?: number;
  monthlyVolume?: number;
  contentType?: string;
  notes?: string;
  relatedKeywords?: string[];
  internalLinkTarget?: string;
  createdAt: string;
}

export interface ContentBrief {
  id: string;
  mainKeyword: string;
  searchIntent?: string;
  targetAudience?: string;
  suggestedTitle?: string;
  suggestedSlug?: string;
  suggestedHeadings?: string[];
  faqs?: { q: string; a: string }[];
  internalLinks?: { url: string; anchor: string }[];
  affiliateLinks?: { url: string; anchor: string }[];
  competitorNotes?: string;
  status: 'idea' | 'writing' | 'editing' | 'published' | 'update_needed';
  assignedWriter?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  schemaEnabled: boolean;
  createdAt: string;
}

export interface ComparisonTable {
  id: string;
  title: string;
  products: ComparisonProduct[];
  createdAt: string;
  updatedAt?: string;
}

export interface ComparisonProduct {
  name: string;
  image?: string;
  price?: string;
  rating?: number;
  pros: string[];
  cons: string[];
  ctaUrl?: string;
  ctaText?: string;
  affiliateLinkId?: string;
  bestFor?: string;
}

export interface ProductReview {
  id: string;
  slug?: string;
  productName: string;
  brand?: string;
  productImage?: string;
  affiliateUrl?: string;
  price?: string;
  originalPrice?: string;
  alternativeStores?: { storeName: string; price: string; url: string; logo?: string }[];
  rating: number;
  bestFor?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'limited';
  dealBadge?: string;
  couponCode?: string;
  couponExpiry?: string;
  categoryId?: string;
  pros: string[];
  cons: string[];
  keyFeatures: string[];
  specs?: Record<string, string>;
  ctaText: string;
  affiliateDisclaimer?: string;
  reviewSummary?: string;
  aiVerdict?: string;
  finalVerdict?: string;
  alternatives?: string[];
  faqs?: { q: string; a: string }[];
  schemaEnabled: boolean;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt?: string;
  clickCount?: number;
  pageViews?: number;
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

export interface SeoScore {
  score: number;
  checks: {
    titleHasKeyword: boolean;
    descriptionHasKeyword: boolean;
    h1HasKeyword: boolean;
    firstParagraphHasKeyword: boolean;
    slugHasKeyword: boolean;
    h2HasKeyword: boolean;
    properHeadings: boolean;
    minWordCount: boolean;
    hasInternalLinks: boolean;
    hasExternalLinks: boolean;
    hasImageAltText: boolean;
    hasFaq: boolean;
    hasSchema: boolean;
    titleLengthOk: boolean;
    descriptionLengthOk: boolean;
    readabilityOk: boolean;
  };
  warnings: string[];
  critical: string[];
  good: string[];
}

export interface MediaItem {
  id: string;
  fileName: string;
  url: string; // data URL or path
  mimeType: string;
  size: number; // in bytes
  createdAt: string;
  altText?: string;
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

export interface NewsletterSubscriber {
  id: string;
  email: string;
  createdAt: string;
  dripStep?: number;
  dripLastSentAt?: string;
}

export interface DripCampaignEmail {
  step: number;
  subject: string;
  delayDays: number;
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

export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  details: string;
  createdAt: string;
}

// ====== Affiliate Platform Types ======

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  website?: string;
  featured: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBanner {
  id: string;
  categoryId: string;
  desktopImage: string;
  mobileImage?: string;
  heading?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  altText?: string;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  isArchived: boolean;
}

export type CategorySectionType =
  | 'hero_banner' | 'subcategory_grid' | 'product_carousel' | 'featured_products'
  | 'best_sellers' | 'amazon_deals' | 'trending_products' | 'top_rated_products'
  | 'products_by_price' | 'editors_choice' | 'featured_brands' | 'promotional_banner'
  | 'comparison_table' | 'buying_guides' | 'blog_articles' | 'custom_text';

export interface CategorySection {
  id: string;
  categoryId: string;
  sectionType: CategorySectionType;
  title?: string;
  subtitle?: string;
  sortOrder: number;
  isActive: boolean;
  settings: Record<string, any>;
}

export interface Deal {
  id: string;
  productId: string;
  salePrice: number;
  regularPrice: number;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  isFeatured: boolean;
  dealType: 'daily' | 'weekly' | 'monthly' | 'clearance' | 'flash';
  categoryId?: string;
  status: 'active' | 'expired' | 'scheduled';
}

export type HomepageSectionType =
  | 'hero_banner' | 'shop_by_category' | 'todays_deals' | 'best_sellers'
  | 'trending_products' | 'featured_products' | 'editors_picks' | 'top_rated_products'
  | 'products_under_price' | 'featured_brands' | 'product_comparisons'
  | 'buying_guides' | 'latest_reviews' | 'latest_blog' | 'recently_viewed'
  | 'newsletter_signup' | 'custom_text';

export interface HomepageSection {
  id: string;
  sectionType: HomepageSectionType;
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

export interface PriceAlert {
  id: string;
  userId?: string;
  sessionId?: string;
  email: string;
  productId: string;
  targetPrice: number;
  currentPrice: number;
  alertType: 'price_drop' | 'back_in_stock' | 'deal_available';
  isTriggered: boolean;
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: string;
  triggeredAt?: string;
}

// Extended ProductReview with all affiliate fields
export interface ExtendedProductReview extends ProductReview {
  asin?: string;
  subcategoryId?: string;
  brandId?: string;
  discountPercentage?: number;
  reviewCount?: number;
  features?: string[];
  technicalSpecs?: Record<string, string>;
  shippingInfo?: string;
  editorRating?: number;
  isFeatured?: boolean;
  isDeal?: boolean;
  priceUpdatedAt?: string;
  lastUpdatedAt?: string;
  amazonUrl?: string;
  gallery?: string[];
  variants?: Record<string, any>;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  comparisonAttributes?: Record<string, string>;
  isTrending?: boolean;
  isTopRated?: boolean;
  brandObj?: Brand;
  brandName?: string;
}

// ====== AI Shopping Assistant ======
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  products?: any[];
  productCards?: ProductCard[];
  comparisonData?: any;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  sessionId: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  context?: { pageType?: string; pageSlug?: string; category?: string; productSlug?: string };
}

export interface ProductCard {
  id: string;
  slug: string;
  productName: string;
  brand?: string;
  productImage?: string;
  price?: string;
  originalPrice?: string;
  rating: number;
  bestFor?: string;
  keyFeatures?: string[];
  pros?: string[];
  cons?: string[];
  affiliateUrl?: string;
  discountPercentage?: number;
  stockStatus?: string;
  dealBadge?: string;
  reason?: string;
}

export interface ChatbotSettings {
  id?: string;
  name: string;
  welcomeMessage: string;
  suggestedPrompts: string[];
  brandTone: string;
  affiliateDisclosure: string;
  priceDisclaimer: string;
  supportedLanguages: string[];
  enabledCategories: string[];
  productRecommendationLimit: number;
  aiInstructions: string;
  restrictedTopics: string[];
  contactEmail: string;
  enableLeadForm: boolean;
  chatbotPosition: 'bottom-right' | 'bottom-left';
  showOnDesktop: boolean;
  showOnMobile: boolean;
  chatbotIcon: string;
  primaryColor: string;
  isActive: boolean;
  dailyMessageLimit: number;
  guestMessageLimit: number;
  userMessageLimit: number;
  maxResponseLength: number;
  monthlyAiBudget: number;
  useSmallModel: boolean;
}

