import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();
  console.log('Connected');
  await client.query("NOTIFY pgrst, 'reload schema'");
  console.log('Schema cache reloaded');
  await client.end();
}

run().catch(err => { console.error('Failed:', err.message); process.exit(1); });
