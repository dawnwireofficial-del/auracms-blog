-- Article Generator: add featured image alt-text storage for posts.
-- Existing rows remain compatible (column is nullable and defaults to empty).
ALTER TABLE posts ADD COLUMN IF NOT EXISTS featured_image_alt TEXT;