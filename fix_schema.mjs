import { Client } from 'pg';

const connectionString = 'postgresql://postgres.nzghdxvbrndzkkoqdlqw:c0OIHLsGLHb3VPeo@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Connecting to Supabase PostgreSQL Pooler...');
  await client.connect();

  console.log('Adding missing columns to product_reviews table...');
  const alterQueries = [
    `ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS created_at TEXT;`,
    `ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS updated_at TEXT;`,
    `ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS cta_text TEXT;`,
    `ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS stock_status TEXT;`,
    `ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS key_features JSONB;`,
    `ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS review_summary TEXT;`,
    `NOTIFY pgrst, 'reload schema';`
  ];

  for (const q of alterQueries) {
    console.log(`Executing: ${q}`);
    await client.query(q);
  }

  console.log('SUCCESS! Schema updated & PostgREST cache reloaded!');
  await client.end();
}

run().catch(err => {
  console.error('Schema update failed:', err);
  process.exit(1);
});
