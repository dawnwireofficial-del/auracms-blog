import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
    }
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
  }
  return client;
}

let adminClient: SupabaseClient | null = null;

export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  if (!adminClient) {
    if (supabaseServiceKey) {
      adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
      });
    } else {
      adminClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });
    }
  }
  return adminClient;
}
