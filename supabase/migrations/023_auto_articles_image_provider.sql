-- Auto Article Factory — image provider selection (Cloudflare / Gemini / Auto)
-- Run this in Supabase SQL Editor. Idempotent: safe to run repeatedly.
-- Adds image_provider (auto|cloudflare|gemini) + image_account_id (Cloudflare Account ID).

ALTER TABLE auto_article_settings ADD COLUMN IF NOT EXISTS image_provider TEXT DEFAULT 'auto';
ALTER TABLE auto_article_settings ADD COLUMN IF NOT EXISTS image_account_id TEXT DEFAULT '';
