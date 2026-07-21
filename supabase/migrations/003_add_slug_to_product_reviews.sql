-- Add slug column to product_reviews
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_reviews_slug ON public.product_reviews(slug) WHERE slug IS NOT NULL;

-- Add slug column to portfolio_projects
ALTER TABLE public.portfolio_projects ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_projects_slug ON public.portfolio_projects(slug) WHERE slug IS NOT NULL;
