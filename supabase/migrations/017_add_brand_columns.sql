-- DawnWire: Align brands table with app expectations (optional but recommended).
-- The legacy brands table only had (id, name, slug, logo_url, description, status).
-- Adds the missing columns used by AdminBrands / Brand type. All idempotent.

ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
