import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const sb = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsers() {
  const { data, error } = await sb.from('users').select('*');
  console.log('Users in DB:', data, error);
}

checkUsers().catch(console.error);
