import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  if (!process.env.SUPABASE_DB_URL) {
    console.error('ERROR: SUPABASE_DB_URL environment variable is required');
    console.error('Usage: SUPABASE_DB_URL=... npx tsx scripts/migrate-supabase.ts');
    process.exit(1);
  }

  try {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(`Running ${file}...`);
      await pool.query(sql);
      console.log(`${file} completed.`);
    }

    // Verify tables exist
    const { rows } = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('Tables:', rows.map(r => r.table_name).join(', '));
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await pool.end();
  }
}

runMigration();
