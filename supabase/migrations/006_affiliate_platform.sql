-- DawnWire Affiliate Platform Schema
-- Extends the core schema for full Amazon affiliate shopping experience

-- 1. Extended product_reviews (already exists from 004)
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS asin TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS shipping_info TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS editor_rating INTEGER DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_deal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS amazon_url TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS comparison_attributes JSONB DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_top_rated BOOLEAN DEFAULT FALSE;

-- 2. Brands (must come before brand_id FK in product_reviews)
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo TEXT,
  description TEXT,
  website TEXT,
  featured BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add brand_id FK after brands table exists
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- 3. Category Banners
CREATE TABLE IF NOT EXISTS public.category_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  desktop_image TEXT NOT NULL,
  mobile_image TEXT,
  heading TEXT,
  description TEXT,
  cta_text TEXT,
  cta_link TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Category Page Sections (dynamic page builder)
CREATE TABLE IF NOT EXISTS public.category_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'hero_banner', 'subcategory_grid', 'product_carousel', 'featured_products',
    'best_sellers', 'amazon_deals', 'trending_products', 'top_rated_products',
    'products_by_price', 'editors_choice', 'featured_brands', 'promotional_banner',
    'comparison_table', 'buying_guides', 'blog_articles', 'custom_text'
  )),
  title TEXT,
  subtitle TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  -- settings can hold: { product_ids, brand_ids, price_max, price_min, rating_min, discount_min, limit, custom_html, etc }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Deals
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  sale_price DECIMAL(10,2) NOT NULL,
  regular_price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  deal_type TEXT DEFAULT 'daily' CHECK (deal_type IN ('daily', 'weekly', 'monthly', 'clearance', 'flash')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'scheduled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Homepage Sections
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type TEXT NOT NULL CHECK (section_type IN (
    'hero_banner', 'shop_by_category', 'todays_deals', 'best_sellers',
    'trending_products', 'featured_products', 'editors_picks', 'top_rated_products',
    'products_under_price', 'featured_brands', 'product_comparisons',
    'buying_guides', 'latest_reviews', 'latest_blog', 'recently_viewed',
    'newsletter_signup', 'custom_text'
  )),
  title TEXT,
  subtitle TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Homepage Hero Slides
CREATE TABLE IF NOT EXISTS public.homepage_hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  desktop_image TEXT NOT NULL,
  mobile_image TEXT,
  heading TEXT,
  description TEXT,
  cta_text TEXT,
  cta_link TEXT,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. User Wishlist / Saved Products
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id),
  UNIQUE(session_id, product_id)
);

-- 9. Recently Viewed Products
CREATE TABLE IF NOT EXISTS public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Product Comparisons (saved)
CREATE TABLE IF NOT EXISTS public.saved_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT,
  name TEXT DEFAULT 'My Comparison',
  product_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Affiliate Click Tracking
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.product_reviews(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  page_url TEXT,
  page_type TEXT,
  banner_id UUID,
  section_type TEXT,
  cta_position TEXT,
  device_type TEXT,
  session_id TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  campaign TEXT,
  article_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Search Analytics
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  results_count INTEGER DEFAULT 0,
  has_results BOOLEAN DEFAULT TRUE,
  session_id TEXT,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  clicked_product_id UUID REFERENCES public.product_reviews(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Price Drop / Deal Alerts
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID NOT NULL REFERENCES public.product_reviews(id) ON DELETE CASCADE,
  target_price DECIMAL(10,2),
  alert_type TEXT NOT NULL DEFAULT 'price_drop' CHECK (alert_type IN ('price_drop', 'back_in_stock', 'deal_available')),
  is_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Email Preferences for Users
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS deal_alerts BOOLEAN DEFAULT FALSE;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS price_drop_alerts BOOLEAN DEFAULT FALSE;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN DEFAULT TRUE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_asin ON public.product_reviews(asin);
CREATE INDEX IF NOT EXISTS idx_product_reviews_brand ON public.product_reviews(brand);
CREATE INDEX IF NOT EXISTS idx_product_reviews_category ON public.product_reviews(category_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_subcategory ON public.product_reviews(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_price ON public.product_reviews(price);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_featured ON public.product_reviews(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_reviews_deal ON public.product_reviews(is_deal) WHERE is_deal = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_reviews_trending ON public.product_reviews(is_trending) WHERE is_trending = TRUE;
CREATE INDEX IF NOT EXISTS idx_category_banners_category ON public.category_banners(category_id);
CREATE INDEX IF NOT EXISTS idx_category_sections_category ON public.category_sections(category_id);
CREATE INDEX IF NOT EXISTS idx_deals_product ON public.deals(product_id);
CREATE INDEX IF NOT EXISTS idx_deals_category ON public.deals(category_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_user ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_session ON public.wishlist_items(session_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user ON public.recently_viewed(user_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_session ON public.recently_viewed(session_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product ON public.affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_category ON public.affiliate_clicks(category_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON public.search_logs(query);
CREATE INDEX IF NOT EXISTS idx_search_logs_date ON public.search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON public.brands(slug);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_order ON public.homepage_sections(sort_order);

-- RLS Policies for new tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Public read for brands, banners, sections, deals, homepage
CREATE POLICY brands_select ON public.brands FOR SELECT USING (TRUE);
CREATE POLICY brands_all_admin ON public.brands FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));

CREATE POLICY banners_select ON public.category_banners FOR SELECT USING (TRUE);
CREATE POLICY banners_all_admin ON public.category_banners FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));

CREATE POLICY sections_select ON public.category_sections FOR SELECT USING (TRUE);
CREATE POLICY sections_all_admin ON public.category_sections FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));

CREATE POLICY deals_select ON public.deals FOR SELECT USING (TRUE);
CREATE POLICY deals_all_admin ON public.deals FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));

CREATE POLICY homepage_sections_select ON public.homepage_sections FOR SELECT USING (TRUE);
CREATE POLICY homepage_sections_all_admin ON public.homepage_sections FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));

CREATE POLICY homepage_hero_select ON public.homepage_hero_slides FOR SELECT USING (TRUE);
CREATE POLICY homepage_hero_all_admin ON public.homepage_hero_slides FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));

-- User data: own read/write
CREATE POLICY wishlist_select_own ON public.wishlist_items FOR SELECT USING (
  user_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE)
);
CREATE POLICY wishlist_insert_own ON public.wishlist_items FOR INSERT WITH CHECK (
  user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL)
);
CREATE POLICY wishlist_delete_own ON public.wishlist_items FOR DELETE USING (
  user_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE)
);
CREATE POLICY wishlist_all_admin ON public.wishlist_items FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY recently_viewed_select_own ON public.recently_viewed FOR SELECT USING (
  user_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE)
);
CREATE POLICY recently_viewed_insert_own ON public.recently_viewed FOR INSERT WITH CHECK (TRUE);
CREATE POLICY recently_viewed_all_admin ON public.recently_viewed FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

CREATE POLICY comparisons_select_own ON public.saved_comparisons FOR SELECT USING (
  user_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE)
);
CREATE POLICY comparisons_all_own ON public.saved_comparisons FOR ALL USING (
  user_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE)
);

-- Clicks and logs: insert for all, read for admin
CREATE POLICY clicks_insert ON public.affiliate_clicks FOR INSERT WITH CHECK (TRUE);
CREATE POLICY clicks_select_admin ON public.affiliate_clicks FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);

CREATE POLICY search_logs_insert ON public.search_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY search_logs_select_admin ON public.search_logs FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);

CREATE POLICY price_alerts_insert_own ON public.price_alerts FOR INSERT WITH CHECK (TRUE);
CREATE POLICY price_alerts_select_own ON public.price_alerts FOR SELECT USING (
  user_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE)
);
CREATE POLICY price_alerts_delete_own ON public.price_alerts FOR DELETE USING (
  user_id = auth.uid() OR session_id = current_setting('app.session_id', TRUE)
);

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.brands, public.category_banners, public.category_sections, public.deals,
  public.homepage_sections, public.homepage_hero_slides TO anon;
GRANT INSERT ON public.wishlist_items, public.recently_viewed, public.affiliate_clicks,
  public.search_logs, public.price_alerts, public.saved_comparisons TO anon;
