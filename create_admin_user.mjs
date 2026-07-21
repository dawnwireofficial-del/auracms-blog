import { Client } from 'pg';

const connectionString = 'postgresql://postgres.nzghdxvbrndzkkoqdlqw:c0OIHLsGLHb3VPeo@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Connecting to Supabase PostgreSQL Pooler...');
  await client.connect();

  const adminId = '00000000-0000-4000-a000-000000000001';
  const email = 'admin@aura.com';

  console.log('Seeding super admin user in public.users...');
  await client.query(`
    INSERT INTO public.users (id, name, email, role, status, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin', status = 'active';
  `, [adminId, 'Super Admin', email, 'super_admin', 'active']);

  console.log('Super Admin user created successfully with ID:', adminId);
  await client.end();
}

run().catch(console.error);
