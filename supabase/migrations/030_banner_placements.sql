-- 030: Admin-managed homepage banner placement system
-- Adds a placement key + scheduling columns to homepage_hero_slides so a single
-- admin-managed banner pool can drive every homepage slot (hero main, 2x2 promo
-- tiles, campaign banners) with per-slot curated sizes and schedules.

ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS placement text DEFAULT 'hero_main';
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS badge_text text;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS start_date timestamptz;
ALTER TABLE public.homepage_hero_slides ADD COLUMN IF NOT EXISTS end_date timestamptz;

CREATE INDEX IF NOT EXISTS idx_homepage_hero_slides_placement ON public.homepage_hero_slides (placement);