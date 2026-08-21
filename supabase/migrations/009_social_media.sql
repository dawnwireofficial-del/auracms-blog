-- Migration 009: Social Media Publishing
-- Tables for storing social media credentials, posts, and analytics

-- Social media credentials (encrypted tokens)
CREATE TABLE IF NOT EXISTS social_media_credentials (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'pinterest')),
  access_token TEXT NOT NULL,
  page_id TEXT,
  board_id TEXT,
  profile_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Social media post log
CREATE TABLE IF NOT EXISTS social_media_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'pinterest')),
  caption TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'failed')),
  platform_post_id TEXT,
  error_message TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_social_posts_product ON social_media_posts(product_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_creds_platform ON social_media_credentials(platform);

-- Unique constraint: one credential per platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_creds_platform_unique ON social_media_credentials(platform) WHERE is_active = true;

-- RLS policies
ALTER TABLE social_media_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on credentials" ON social_media_credentials
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on posts" ON social_media_posts
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON social_media_credentials TO service_role;
GRANT ALL ON social_media_posts TO service_role;
GRANT ALL ON social_media_credentials TO authenticated;
GRANT ALL ON social_media_posts TO authenticated;
GRANT SELECT ON social_media_credentials TO anon;
GRANT SELECT ON social_media_posts TO anon;
