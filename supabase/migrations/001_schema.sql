-- DawnWire Supabase Schema
-- Run this in your Supabase SQL Editor or via migration tool

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users / Profiles (linked to auth.users via UUID)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'subscriber' CHECK (role IN ('super_admin', 'admin', 'editor', 'author', 'subscriber')),
  avatar TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Posts
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'scheduled')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reading_time INTEGER NOT NULL DEFAULT 1,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_trending BOOLEAN NOT NULL DEFAULT FALSE,
  is_editors_pick BOOLEAN NOT NULL DEFAULT FALSE,
  allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT
);

-- 3. Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- 4. Tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- 5. Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'spam')),
  likes_count INTEGER NOT NULL DEFAULT 0,
  liked_by TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Affiliate Links
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  destination_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  short_slug TEXT NOT NULL UNIQUE,
  category_id TEXT,
  post_id TEXT,
  button_text TEXT NOT NULL DEFAULT 'Buy Now',
  disclosure_text TEXT,
  no_follow BOOLEAN NOT NULL DEFAULT TRUE,
  sponsored BOOLEAN NOT NULL DEFAULT TRUE,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT TRUE,
  click_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Pages (Static)
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  featured_image TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title TEXT,
  seo_description TEXT
);

-- 8. Settings (single-row config)
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT 'DawnWire',
  site_tagline TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  favicon_url TEXT,
  default_language TEXT NOT NULL DEFAULT 'en',
  posts_per_page INTEGER NOT NULL DEFAULT 6,
  enable_comments BOOLEAN NOT NULL DEFAULT TRUE,
  allow_guest_comments BOOLEAN NOT NULL DEFAULT TRUE,
  require_comment_approval BOOLEAN NOT NULL DEFAULT FALSE,
  affiliate_disclosure_text TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#0f172a',
  secondary_color TEXT NOT NULL DEFAULT '#3b82f6',
  header_menu JSONB NOT NULL DEFAULT '[]'::jsonb,
  footer_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Media Library
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alt_text TEXT
);

-- 10. Contact Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('read', 'unread'))
);

-- 11. Newsletter Subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Activity Logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_status ON public.posts(status);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_category ON public.posts(category_id);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX idx_posts_featured ON public.posts(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_posts_trending ON public.posts(is_trending) WHERE is_trending = TRUE;
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_comments_post ON public.comments(post_id);
CREATE INDEX idx_affiliate_slug ON public.affiliate_links(short_slug);
CREATE INDEX idx_pages_slug ON public.pages(slug);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_logs_created ON public.activity_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper: bypass RLS recursion by checking role via SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1),
    'subscriber'
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO anon, authenticated;

-- RLS: users - self-read + admin-read
CREATE POLICY users_select ON public.users FOR SELECT USING (
  id = auth.uid() OR public.get_user_role() IN ('super_admin', 'admin')
);
CREATE POLICY users_all_admin ON public.users FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- RLS: posts - public read published, auth users read based on role
CREATE POLICY posts_public_select ON public.posts FOR SELECT USING (
  status = 'published' AND visibility = 'public'
);
CREATE POLICY posts_auth_select ON public.posts FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    author_id = auth.uid() OR public.get_user_role() IN ('super_admin', 'admin', 'editor')
  )
);
CREATE POLICY posts_insert ON public.posts FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND public.get_user_role() IN ('super_admin', 'admin', 'editor', 'author')
);
CREATE POLICY posts_update ON public.posts FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    author_id = auth.uid() OR public.get_user_role() IN ('super_admin', 'admin', 'editor')
  )
);
CREATE POLICY posts_delete ON public.posts FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    author_id = auth.uid() OR public.get_user_role() IN ('super_admin', 'admin', 'editor')
  )
);

-- RLS: categories - public read, admin write
CREATE POLICY categories_select ON public.categories FOR SELECT USING (TRUE);
CREATE POLICY categories_all_admin ON public.categories FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);

-- RLS: comments - public read approved, insert based on settings, admin moderate
CREATE POLICY comments_select ON public.comments FOR SELECT USING (
  status = 'approved' OR auth.role() = 'authenticated'
);
CREATE POLICY comments_insert ON public.comments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY comments_update_admin ON public.comments FOR UPDATE USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);
CREATE POLICY comments_delete_admin ON public.comments FOR DELETE USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);

-- RLS: affiliate_links - public read, admin write
CREATE POLICY affiliate_select ON public.affiliate_links FOR SELECT USING (TRUE);
CREATE POLICY affiliate_all_admin ON public.affiliate_links FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);

-- RLS: pages - public read published, admin read all
CREATE POLICY pages_select_public ON public.pages FOR SELECT USING (status = 'published');
CREATE POLICY pages_select_admin ON public.pages FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);
CREATE POLICY pages_all_admin ON public.pages FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);

-- RLS: settings - public read, admin write
CREATE POLICY settings_select ON public.settings FOR SELECT USING (TRUE);
CREATE POLICY settings_update_admin ON public.settings FOR UPDATE USING (
  public.get_user_role() IN ('super_admin', 'admin')
);
CREATE POLICY settings_insert_admin ON public.settings FOR INSERT WITH CHECK (
  public.get_user_role() IN ('super_admin', 'admin')
);

-- RLS: media - read if auth, admin write
CREATE POLICY media_select_auth ON public.media FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY media_all_editor ON public.media FOR ALL USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor', 'author')
);

-- RLS: messages - admins only
CREATE POLICY messages_select_admin ON public.messages FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);
CREATE POLICY messages_insert_anon ON public.messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY messages_update_admin ON public.messages FOR UPDATE USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);

-- RLS: newsletter - admins read, anon insert
CREATE POLICY newsletter_select_admin ON public.newsletter_subscribers FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);
CREATE POLICY newsletter_insert_anon ON public.newsletter_subscribers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY newsletter_delete_admin ON public.newsletter_subscribers FOR DELETE USING (
  public.get_user_role() IN ('super_admin', 'admin', 'editor')
);

-- RLS: activity_logs - admins only
CREATE POLICY logs_select_admin ON public.activity_logs FOR SELECT USING (
  public.get_user_role() IN ('super_admin', 'admin')
);
CREATE POLICY logs_insert_trigger ON public.activity_logs FOR INSERT WITH CHECK (TRUE);

-- Grant table permissions to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON public.comments TO anon;
GRANT INSERT ON public.messages TO anon;
GRANT INSERT ON public.newsletter_subscribers TO anon;
