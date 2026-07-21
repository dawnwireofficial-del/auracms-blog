-- Add missing columns to product_reviews for sales-boosting features
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS original_price TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock', 'limited'));
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS deal_badge TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS coupon_expiry TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS click_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS page_views INTEGER NOT NULL DEFAULT 0;
