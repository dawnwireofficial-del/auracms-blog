-- DawnWire SEO Engine Schema

-- Add SEO columns to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS focus_keyword TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS secondary_keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS robots_index BOOLEAN DEFAULT TRUE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS robots_follow BOOLEAN DEFAULT TRUE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS twitter_title TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS twitter_description TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS twitter_image TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS schema_type TEXT DEFAULT 'Article';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS schema_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS breadcrumbs_hide BOOLEAN DEFAULT FALSE;

-- Add SEO columns to pages
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS focus_keyword TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS robots_index BOOLEAN DEFAULT TRUE;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS robots_follow BOOLEAN DEFAULT TRUE;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS twitter_title TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS twitter_description TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS twitter_image TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS schema_type TEXT DEFAULT 'WebPage';
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS schema_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS breadcrumbs_hide BOOLEAN DEFAULT FALSE;

-- Add SEO columns to categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS robots_index BOOLEAN DEFAULT TRUE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS h1_text TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS intro_content TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS bottom_content TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS featured_image TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Add SEO columns to settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS twitter_card TEXT DEFAULT 'summary_large_image';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS analytics_ga_id TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS analytics_gtm_id TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS search_console_verification TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS custom_head_scripts TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS custom_footer_scripts TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sitemap_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sitemap_include_posts BOOLEAN DEFAULT TRUE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sitemap_include_pages BOOLEAN DEFAULT TRUE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS sitemap_include_categories BOOLEAN DEFAULT TRUE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS robots_content TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS lazy_load_images BOOLEAN DEFAULT TRUE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS preload_featured_image BOOLEAN DEFAULT TRUE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS breadcrumbs_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS breadcrumbs_separator TEXT DEFAULT '/';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS outdated_threshold_days INTEGER DEFAULT 180;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS auto_affiliate_disclaimer BOOLEAN DEFAULT TRUE;

-- 1. Redirects
CREATE TABLE IF NOT EXISTS public.redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301,
  hit_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 404 Error Logs
CREATE TABLE IF NOT EXISTS public.error_404_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  referrer TEXT,
  hit_count INTEGER NOT NULL DEFAULT 1,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Keywords
CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  page_id UUID,
  page_type TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'writing', 'published', 'ranking', 'needs_update')),
  search_intent TEXT,
  difficulty INTEGER,
  monthly_volume INTEGER,
  content_type TEXT,
  notes TEXT,
  related_keywords TEXT[] DEFAULT '{}',
  internal_link_target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Content Briefs
CREATE TABLE IF NOT EXISTS public.content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_keyword TEXT NOT NULL,
  search_intent TEXT,
  target_audience TEXT,
  suggested_title TEXT,
  suggested_slug TEXT,
  suggested_headings TEXT[] DEFAULT '{}',
  faqs JSONB DEFAULT '[]',
  internal_links JSONB DEFAULT '[]',
  affiliate_links JSONB DEFAULT '[]',
  competitor_notes TEXT,
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'writing', 'editing', 'published', 'update_needed')),
  assigned_writer TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. FAQ Items
CREATE TABLE IF NOT EXISTS public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  schema_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Product Reviews
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  brand TEXT,
  product_image TEXT,
  affiliate_url TEXT,
  price TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 0,
  best_for TEXT,
  pros TEXT[] DEFAULT '{}',
  cons TEXT[] DEFAULT '{}',
  key_features TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}',
  cta_text TEXT NOT NULL DEFAULT 'Buy on Amazon',
  affiliate_disclaimer TEXT,
  review_summary TEXT,
  final_verdict TEXT,
  alternatives TEXT[] DEFAULT '{}',
  faqs JSONB DEFAULT '[]',
  schema_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Portfolio Projects
CREATE TABLE IF NOT EXISTS public.portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client TEXT,
  industry TEXT,
  service_type TEXT NOT NULL,
  image TEXT,
  short_description TEXT,
  problem TEXT,
  solution TEXT,
  results TEXT,
  tools_used TEXT[] DEFAULT '{}',
  website_url TEXT,
  gallery TEXT[] DEFAULT '{}',
  testimonial JSONB DEFAULT '{}',
  cta_text TEXT NOT NULL DEFAULT 'Work With Me',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  overview TEXT NOT NULL,
  includes TEXT[] DEFAULT '{}',
  process JSONB DEFAULT '[]',
  benefits TEXT[] DEFAULT '{}',
  faqs JSONB DEFAULT '[]',
  cta_text TEXT NOT NULL DEFAULT 'Get Started',
  cta_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Comparison Tables
CREATE TABLE IF NOT EXISTS public.comparison_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  products JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Internal Links
CREATE TABLE IF NOT EXISTS public.internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  anchor_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Affiliate Link Clicks Tracking
ALTER TABLE public.affiliate_links ADD COLUMN IF NOT EXISTS clicks_by_page JSONB DEFAULT '{}';
ALTER TABLE public.affiliate_links ADD COLUMN IF NOT EXISTS clicks_by_date JSONB DEFAULT '{}';
ALTER TABLE public.affiliate_links ADD COLUMN IF NOT EXISTS group_name TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_redirects_source ON public.redirects(source_url);
CREATE INDEX IF NOT EXISTS idx_redirects_hits ON public.redirects(hit_count DESC);
CREATE INDEX IF NOT EXISTS idx_404_url ON public.error_404_logs(url);
CREATE INDEX IF NOT EXISTS idx_404_last_seen ON public.error_404_logs(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_page ON public.keywords(page_id, page_type);
CREATE INDEX IF NOT EXISTS idx_keywords_status ON public.keywords(status);
CREATE INDEX IF NOT EXISTS idx_content_briefs_status ON public.content_briefs(status);
CREATE INDEX IF NOT EXISTS idx_faq_order ON public.faq_items(display_order);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON public.product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON public.portfolio_projects(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_portfolio_status ON public.portfolio_projects(status);
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_featured ON public.services(featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_internal_links_source ON public.internal_links(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_internal_links_target ON public.internal_links(target_id, target_type);

-- RLS policies for new tables
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_404_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_links ENABLE ROW LEVEL SECURITY;

-- RLS: public read for published content
CREATE POLICY redirects_all_admin ON public.redirects FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
CREATE POLICY error_404_all_admin ON public.error_404_logs FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
CREATE POLICY keywords_all_admin ON public.keywords FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
CREATE POLICY content_briefs_all_admin ON public.content_briefs FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
CREATE POLICY faq_select_public ON public.faq_items FOR SELECT USING (TRUE);
CREATE POLICY faq_all_admin ON public.faq_items FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
CREATE POLICY product_reviews_select_public ON public.product_reviews FOR SELECT USING (status = 'published');
CREATE POLICY product_reviews_all_admin ON public.product_reviews FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
CREATE POLICY portfolio_select_public ON public.portfolio_projects FOR SELECT USING (status = 'published');
CREATE POLICY portfolio_all_admin ON public.portfolio_projects FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
CREATE POLICY services_select_public ON public.services FOR SELECT USING (status = 'published');
CREATE POLICY services_all_admin ON public.services FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
CREATE POLICY comparison_tables_all_admin ON public.comparison_tables FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
CREATE POLICY internal_links_select_public ON public.internal_links FOR SELECT USING (TRUE);
CREATE POLICY internal_links_all_admin ON public.internal_links FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));

-- Grant permissions
GRANT SELECT ON public.faq_items TO anon;
GRANT SELECT ON public.product_reviews TO anon;
GRANT SELECT ON public.portfolio_projects TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.internal_links TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
