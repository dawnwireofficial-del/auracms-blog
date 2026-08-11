-- 029: Category visual assets + global design/animation settings
-- Adds per-category image/icon/banner/animation columns and a JSON design_settings
-- column on the settings row so admins can manage banners, category images and
-- SVG animation preferences without further schema changes.

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS desktop_banner text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS mobile_banner text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS animation_style text;

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS design_settings jsonb;