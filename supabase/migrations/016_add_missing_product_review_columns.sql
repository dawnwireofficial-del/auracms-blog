-- 016_add_missing_product_review_columns.sql
-- Consolidated fix: add all columns that the app code (server/seo-engine.ts,
-- ProductReviewManager.tsx, store.ts, amazon-sync-engine) expects but that are
-- MISSING from the production product_reviews table.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR, then run:
--   NOTIFY pgrst, 'reload schema';
-- or just wait ~5 seconds for PostgREST to auto-reload its schema cache.

ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS asin TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS amazon_url TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'limited'));
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS page_views INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_deal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS shipping_info TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS editor_rating INTEGER DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS last_updated_at TIMESTAMPTZ;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS comparison_attributes JSONB DEFAULT '{}';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT FALSE;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS is_top_rated BOOLEAN DEFAULT FALSE;
-- NOTE: brands.id and categories.id are TEXT (not UUID), so these use TEXT without FK constraints.
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS brand_id TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS subcategory_id TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_summary TEXT;

-- Indexes (safe to run even if they exist)
CREATE INDEX IF NOT EXISTS idx_product_reviews_asin ON public.product_reviews(asin);
CREATE INDEX IF NOT EXISTS idx_product_reviews_brand ON public.product_reviews(brand);
CREATE INDEX IF NOT EXISTS idx_product_reviews_category ON public.product_reviews(category_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_subcategory ON public.product_reviews(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_price ON public.product_reviews(price);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_featured ON public.product_reviews(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_reviews_deal ON public.product_reviews(is_deal) WHERE is_deal = TRUE;
CREATE INDEX IF NOT EXISTS idx_product_reviews_trending ON public.product_reviews(is_trending) WHERE is_trending = TRUE;
