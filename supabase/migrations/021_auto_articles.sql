-- Auto Article Factory Settings
-- Run this in Supabase SQL Editor.
-- NOTE: the app works fine WITHOUT this table (in-memory + env defaults are
-- used as fallback). This table only makes the admin "Run Now"/schedule
-- toggles persist across serverless cold starts.

CREATE TABLE IF NOT EXISTS auto_article_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  interval_minutes INTEGER DEFAULT 30,
  batch_size INTEGER DEFAULT 5,
  daily_limit INTEGER DEFAULT 50,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  with_image BOOLEAN DEFAULT true,
  min_score INTEGER DEFAULT 6,
  image_model TEXT DEFAULT 'gemini-2.0-flash-preview-image-generation',
  generated_today INTEGER DEFAULT 0,
  generated_date TEXT DEFAULT to_char(now(), 'YYYY-MM-DD'),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE auto_article_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY auto_article_settings_admin ON auto_article_settings
  FOR ALL USING (public.get_user_role() IN ('super_admin', 'admin', 'editor'));
