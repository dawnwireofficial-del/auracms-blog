-- Drop legacy camelCase duplicate columns on public.posts.
-- These were created by an older schema; the canonical snake_case columns
-- (featured_image, created_at, updated_at, published_at, category_id,
-- author_id, seo_title, seo_description, allow_comments) are the ones the app
-- writes and reads. The camelCase duplicates are all NULL and caused a
-- snakeToCamel collision in the API response mapper.
-- Keep: readingTime, isFeatured, isTrending, isEditorsPick (camelCase, no snake
-- equivalent in this DB; the app writes these names).
ALTER TABLE public.posts
  DROP COLUMN IF EXISTS "featuredImage",
  DROP COLUMN IF EXISTS "createdAt",
  DROP COLUMN IF EXISTS "updatedAt",
  DROP COLUMN IF EXISTS "publishedAt",
  DROP COLUMN IF EXISTS "categoryId",
  DROP COLUMN IF EXISTS "authorId",
  DROP COLUMN IF EXISTS "seoTitle",
  DROP COLUMN IF EXISTS "seoDescription",
  DROP COLUMN IF EXISTS "allowComments";