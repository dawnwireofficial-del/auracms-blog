-- Fix permissions for bulk_import_jobs table
-- UUID primary keys with gen_random_uuid() do not create sequences,
-- so we only grant table-level permissions.
GRANT ALL ON bulk_import_jobs TO authenticated;
GRANT ALL ON bulk_import_jobs TO anon;
