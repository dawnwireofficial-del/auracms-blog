-- Amazon Product Synchronization Schema (prod-compatible)
-- Prod's product_reviews.id is TEXT (legacy), so FK columns reference TEXT not UUID.
-- Run this in Supabase SQL Editor or via Management API.

-- 1. Amazon Marketplaces
CREATE TABLE IF NOT EXISTS amazon_marketplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  region TEXT NOT NULL,
  paapi_endpoint TEXT NOT NULL,
  currency TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en_US',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO amazon_marketplaces (code, name, domain, region, paapi_endpoint, currency, locale) VALUES
  ('US', 'Amazon US', 'www.amazon.com', 'us-east-1', 'webservices.amazon.com', 'USD', 'en_US'),
  ('UK', 'Amazon UK', 'www.amazon.co.uk', 'eu-west-1', 'webservices.amazon.co.uk', 'GBP', 'en_GB'),
  ('AE', 'Amazon UAE', 'www.amazon.ae', 'eu-west-1', 'webservices.amazon.ae', 'AED', 'en_AE'),
  ('SA', 'Amazon Saudi Arabia', 'www.amazon.sa', 'eu-west-1', 'webservices.amazon.sa', 'SAR', 'en_SA'),
  ('CA', 'Amazon Canada', 'www.amazon.ca', 'us-east-1', 'webservices.amazon.ca', 'CAD', 'en_CA'),
  ('IN', 'Amazon India', 'www.amazon.in', 'eu-west-1', 'webservices.amazon.in', 'INR', 'en_IN'),
  ('DE', 'Amazon Germany', 'www.amazon.de', 'eu-west-1', 'webservices.amazon.de', 'EUR', 'de_DE'),
  ('FR', 'Amazon France', 'www.amazon.fr', 'eu-west-1', 'webservices.amazon.fr', 'EUR', 'fr_FR'),
  ('IT', 'Amazon Italy', 'www.amazon.it', 'eu-west-1', 'webservices.amazon.it', 'EUR', 'it_IT'),
  ('ES', 'Amazon Spain', 'www.amazon.es', 'eu-west-1', 'webservices.amazon.es', 'EUR', 'es_ES'),
  ('JP', 'Amazon Japan', 'www.amazon.co.jp', 'us-west-2', 'webservices.amazon.co.jp', 'JPY', 'ja_JP'),
  ('AU', 'Amazon Australia', 'www.amazon.com.au', 'us-west-2', 'webservices.amazon.com.au', 'AUD', 'en_AU'),
  ('BR', 'Amazon Brazil', 'www.amazon.com.br', 'us-east-1', 'webservices.amazon.com.br', 'BRL', 'pt_BR'),
  ('MX', 'Amazon Mexico', 'www.amazon.com.mx', 'us-east-1', 'webservices.amazon.com.mx', 'MXN', 'es_MX'),
  ('NL', 'Amazon Netherlands', 'www.amazon.nl', 'eu-west-1', 'webservices.amazon.nl', 'EUR', 'nl_NL'),
  ('SE', 'Amazon Sweden', 'www.amazon.se', 'eu-west-1', 'webservices.amazon.se', 'SEK', 'sv_SE'),
  ('PL', 'Amazon Poland', 'www.amazon.pl', 'eu-west-1', 'webservices.amazon.pl', 'PLN', 'pl_PL'),
  ('TR', 'Amazon Turkey', 'www.amazon.com.tr', 'eu-west-1', 'webservices.amazon.com.tr', 'TRY', 'tr_TR'),
  ('SG', 'Amazon Singapore', 'www.amazon.sg', 'us-west-2', 'webservices.amazon.sg', 'SGD', 'en_SG'),
  ('HK', 'Amazon Hong Kong', 'www.amazon.com.hk', 'us-west-2', 'webservices.amazon.com.hk', 'HKD', 'zh_HK')
ON CONFLICT (code) DO NOTHING;

-- 2. Amazon Sync Status per product
CREATE TABLE IF NOT EXISTS amazon_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  marketplace_code TEXT NOT NULL DEFAULT 'US',
  partner_tag TEXT NOT NULL DEFAULT '',
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending','queued','syncing','success','failed','paused')),
  priority INTEGER NOT NULL DEFAULT 0,
  current_price NUMERIC(12,2),
  current_price_updated_at TIMESTAMPTZ,
  previous_price NUMERIC(12,2),
  previous_price_updated_at TIMESTAMPTZ,
  reference_price NUMERIC(12,2),
  currency TEXT,
  availability TEXT,
  is_available BOOLEAN DEFAULT true,
  is_deal BOOLEAN DEFAULT false,
  deal_price NUMERIC(12,2),
  deal_end_time TIMESTAMPTZ,
  is_prime_deal BOOLEAN DEFAULT false,
  product_title TEXT,
  brand TEXT,
  main_image TEXT,
  additional_images TEXT[],
  product_features TEXT[],
  product_category TEXT,
  product_url TEXT,
  affiliate_url TEXT,
  variations JSONB,
  last_sync_at TIMESTAMPTZ,
  last_successful_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error_message TEXT,
  last_error_at TIMESTAMPTZ,
  is_asin_valid BOOLEAN DEFAULT true,
  asin_flagged BOOLEAN DEFAULT false,
  asin_flag_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, asin)
);

CREATE INDEX IF NOT EXISTS idx_amazon_sync_status_product_id ON amazon_sync_status(product_id);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_status_asin ON amazon_sync_status(asin);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_status_status ON amazon_sync_status(sync_status);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_status_next_sync ON amazon_sync_status(next_sync_at) WHERE next_sync_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_amazon_sync_status_priority ON amazon_sync_status(priority DESC);

-- 3. Amazon Price History
CREATE TABLE IF NOT EXISTS amazon_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  old_price NUMERIC(12,2),
  new_price NUMERIC(12,2),
  old_reference_price NUMERIC(12,2),
  new_reference_price NUMERIC(12,2),
  currency TEXT,
  is_deal BOOLEAN DEFAULT false,
  change_type TEXT CHECK (change_type IN ('price_drop','price_increase','deal_started','deal_ended','back_in_stock','out_of_stock','first_sync')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amazon_price_history_product ON amazon_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_amazon_price_history_asin ON amazon_price_history(asin);
CREATE INDEX IF NOT EXISTS idx_amazon_price_history_created ON amazon_price_history(created_at DESC);

-- 4. Amazon Sync Logs
CREATE TABLE IF NOT EXISTS amazon_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID,
  product_id TEXT REFERENCES product_reviews(id) ON DELETE SET NULL,
  asin TEXT,
  action TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started','success','failed','skipped','rate_limited')),
  request_used INTEGER DEFAULT 0,
  response_data JSONB,
  error_message TEXT,
  error_code TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_amazon_sync_logs_batch ON amazon_sync_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_logs_product ON amazon_sync_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_amazon_sync_logs_created ON amazon_sync_logs(created_at DESC);

-- 5. Amazon API Usage Tracking
CREATE TABLE IF NOT EXISTS amazon_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  requests_used INTEGER DEFAULT 0,
  requests_limit INTEGER DEFAULT 8640,
  earned_quota INTEGER DEFAULT 0,
  reset_at TIMESTAMPTZ,
  UNIQUE(date)
);

-- 6. Sync field mapping settings
CREATE TABLE IF NOT EXISTS amazon_sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 60,
  fast_sync_interval_minutes INTEGER DEFAULT 15,
  deal_sync_interval_minutes INTEGER DEFAULT 30,
  featured_sync_interval_minutes INTEGER DEFAULT 30,
  batch_size INTEGER DEFAULT 10,
  max_requests_per_hour INTEGER DEFAULT 360,
  max_retries INTEGER DEFAULT 3,
  retry_delay_minutes INTEGER DEFAULT 5,
  freshness_days INTEGER DEFAULT 7,
  fields_to_sync JSONB DEFAULT '[
    "price","availability","deal_status","product_title","product_image",
    "additional_images","brand","product_features","product_category",
    "product_url","affiliate_url","variations","reference_price",
    "currency","prime_deal_status","deal_end_time"
  ]'::jsonb,
  fields_auto_overwrite JSONB DEFAULT '[
    "price","availability","deal_status","product_title","product_image",
    "additional_images","brand","currency","is_prime_deal"
  ]'::jsonb,
  notify_on_failure BOOLEAN DEFAULT true,
  notify_on_price_change BOOLEAN DEFAULT true,
  notify_on_availability_change BOOLEAN DEFAULT true,
  notify_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO amazon_sync_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- 7. Encrypted API credentials store
CREATE TABLE IF NOT EXISTS amazon_api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_code TEXT NOT NULL REFERENCES amazon_marketplaces(code),
  access_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  partner_tag TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(marketplace_code)
);
