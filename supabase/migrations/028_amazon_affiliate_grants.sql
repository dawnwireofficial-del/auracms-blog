-- Grant DML privileges on Amazon Sync + Affiliate Health tables.
-- Migration 026 (amazon_sync_prod) and 027 (affiliate_health) were applied via
-- the Supabase Management API, which creates tables WITHOUT the default grants
-- Supabase applies to tables created through the SQL Editor / dashboard
-- (SELECT/INSERT/UPDATE/DELETE for anon, authenticated, service_role).
-- Without these, every query on these tables fails with 42501
-- "permission denied for table" even for service_role.
-- Idempotent: GRANT is safe to re-run. Run in Supabase SQL Editor or via
-- Management API.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  amazon_marketplaces,
  amazon_sync_status,
  amazon_price_history,
  amazon_sync_logs,
  amazon_api_usage,
  amazon_sync_settings,
  amazon_api_credentials,
  affiliate_health,
  affiliate_link_log
TO anon, authenticated, service_role;

-- Sequences used by these tables (none expected, but harmless if present).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
