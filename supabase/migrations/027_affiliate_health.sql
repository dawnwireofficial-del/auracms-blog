-- Affiliate Link Health & Manual-Updates Pipeline (prod-compatible)
-- Prod's product_reviews.id is TEXT (legacy), so FK columns reference TEXT not UUID.
-- Idempotent: safe to re-run. Run in Supabase SQL Editor or via Management API.

-- 1. Affiliate health per product (report-only; never edits product_reviews rows)
CREATE TABLE IF NOT EXISTS affiliate_health (
  product_id TEXT PRIMARY KEY REFERENCES product_reviews(id) ON DELETE CASCADE,
  asin TEXT,
  affiliate_tag TEXT NOT NULL DEFAULT '',
  validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('pending','system_generated','healthy','fixable','broken','unavailable')),
  marked_for_update BOOLEAN DEFAULT false,
  manual_note TEXT,
  marked_by TEXT,
  marked_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  last_error TEXT,
  checked_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_health_status ON affiliate_health(validation_status);
CREATE INDEX IF NOT EXISTS idx_affiliate_health_marked ON affiliate_health(marked_for_update) WHERE marked_for_update = true;

-- 2. Affiliate link change log (reversibility / audit trail)
CREATE TABLE IF NOT EXISTS affiliate_link_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  old_url TEXT,
  new_url TEXT,
  updated_by TEXT,
  source TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_link_log_product ON affiliate_link_log(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_link_log_updated ON affiliate_link_log(updated_at DESC);
