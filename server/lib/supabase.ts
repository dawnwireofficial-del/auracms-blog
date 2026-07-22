import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
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

export async function getSupabaseAdmin(): Promise<SupabaseClient> {
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
