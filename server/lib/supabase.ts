import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient } from '../db/mysql-adapter';

const useMysql = !!process.env.MYSQL_URL;

let client: SupabaseClient | null = null;
let mysqlClient: ReturnType<typeof createSupabaseClient> | null = null;

// Returns supabase-js client OR the MySQL adapter (same fluent surface).
// Typed as any so call sites work identically in both modes.
export function getSupabase(): any {
  if (useMysql) {
    if (!mysqlClient) mysqlClient = createSupabaseClient();
    return mysqlClient;
  }
  if (!client) {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }
    client = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return client;
}

let adminClient: SupabaseClient | null = null;
let mysqlAdminClient: ReturnType<typeof createSupabaseClient> | null = null;

export async function getSupabaseAdmin(): Promise<any> {
  if (useMysql) {
    if (!mysqlAdminClient) mysqlAdminClient = createSupabaseClient();
    return mysqlAdminClient;
  }
  if (!adminClient) {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('SUPABASE_URL and service/anon key environment variables are required');
    }
    adminClient = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return adminClient;
}