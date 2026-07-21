import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('pg');

const sql = readFileSync(new URL('../supabase/migrations/003_add_slug_to_product_reviews.sql', import.meta.url), 'utf-8');

async function run() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL });
  await client.connect();
  console.log('Connected to Supabase DB');
  await client.query(sql);
  console.log('Migration 003 executed successfully');
  await client.end();
}

run().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
