-- Ensure bulk_import_jobs is accessible for admin operations
-- Disable RLS since this is an internal admin table
ALTER TABLE IF EXISTS bulk_import_jobs DISABLE ROW LEVEL SECURITY;

-- Grant full access to all roles that may be used by the application
GRANT ALL ON bulk_import_jobs TO authenticated;
GRANT ALL ON bulk_import_jobs TO anon;
GRANT ALL ON bulk_import_jobs TO public;
