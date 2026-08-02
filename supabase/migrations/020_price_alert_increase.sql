-- 020: Price alert emails (drop + increase)
-- Adds missing columns used by the code and widens alert_type to support price_increase.
-- Safe to run repeatedly (idempotent).

ALTER TABLE public.price_alerts
  ADD COLUMN IF NOT EXISTS current_price DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMPTZ NULL;

-- Widen the alert_type CHECK to include price_increase.
ALTER TABLE public.price_alerts DROP CONSTRAINT IF EXISTS price_alerts_alert_type_check;
ALTER TABLE public.price_alerts
  ADD CONSTRAINT price_alerts_alert_type_check
  CHECK (alert_type IN ('price_drop', 'price_increase', 'back_in_stock', 'deal_available'));
