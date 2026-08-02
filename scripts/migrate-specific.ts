import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

async function runSpecific() {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  if (!process.env.SUPABASE_DB_URL) {
    console.error('ERROR: SUPABASE_DB_URL environment variable is required');
    process.exit(1);
  }
  const names = process.argv.slice(2);
  try {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = names.length
      ? names
      : fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const name of files) {
      const sqlPath = path.join(migrationsDir, name);
      if (!fs.existsSync(sqlPath)) { console.log(`SKIP (not found): ${name}`); continue; }
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log(`Running ${name}...`);
      await pool.query(sql);
      console.log(`${name} completed.`);
    }
  } catch (e) {
    console.error('Migration failed:', e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

runSpecific();
