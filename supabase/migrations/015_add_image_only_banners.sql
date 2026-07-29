-- Add image_only column to homepage_hero_slides for Image Only Banner mode
ALTER TABLE public.homepage_hero_slides
ADD COLUMN IF NOT EXISTS image_only BOOLEAN DEFAULT FALSE;
