-- 018_add_review_article.sql
-- Adds a long-form editorial "article" column to product_reviews so the
-- product page itself can serve as the review article (SEO intro + buying
-- guide body + FAQ), giving users direct access to affiliate CTAs.
--
-- RUN THIS IN THE SUPABASE SQL EDITOR, then run:
--   NOTIFY pgrst, 'reload schema';

ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS review_article TEXT;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS affiliate_disclosure TEXT;

-- posts.product_id links generated blog posts back to their source product
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS product_id TEXT;

CREATE INDEX IF NOT EXISTS idx_posts_product_id ON public.posts(product_id);
