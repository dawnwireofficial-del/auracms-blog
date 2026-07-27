-- Add missing editor_score column to product_reviews
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS editor_score INTEGER DEFAULT 0;

-- Also ensure other commonly-used columns exist
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS final_verdict TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS best_for TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS cta_text TEXT DEFAULT 'Buy on Amazon';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS key_features JSONB DEFAULT '[]';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS pros JSONB DEFAULT '[]';
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS cons JSONB DEFAULT '[]';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
