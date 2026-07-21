-- Create testimonials table for admin-managed client reviews
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant permissions
GRANT ALL ON public.testimonials TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published testimonials
CREATE POLICY "Public can read published testimonials" ON public.testimonials
  FOR SELECT USING (status = 'published');

-- Allow server-side CRUD (auth is handled by the API middleware, not RLS)
DROP POLICY IF EXISTS "Authenticated users can manage testimonials" ON public.testimonials;
CREATE POLICY "Server can manage testimonials" ON public.testimonials
  FOR ALL USING (true);
