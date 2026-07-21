import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });

async function fix() {
  await pool.query("UPDATE auth.users SET email_confirmed_at = NOW(), confirmation_sent_at = NOW(), confirmed_at = NOW() WHERE email = 'admin@dawnwire.com'");
  console.log('Auth user confirmed');
  
  await pool.query(`INSERT INTO public.users (id, name, email, role, status, created_at) VALUES ('af59e58d-96ca-4159-b6ad-b87831087892', 'System Admin', 'admin@dawnwire.com', 'super_admin', 'active', NOW()) ON CONFLICT (email) DO UPDATE SET role = 'super_admin', name = 'System Admin'`);
  console.log('User profile created');
  
  await pool.query("UPDATE public.settings SET site_name = 'DawnWire', site_tagline = 'Technology that helps businesses grow.' WHERE TRUE");
  console.log('Settings updated');
  
  await pool.end();
}

fix().catch(e => { console.error(e); process.exit(1); });
