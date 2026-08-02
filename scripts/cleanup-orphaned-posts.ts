import pg from 'pg';

const { Pool } = pg;

async function cleanupOrphanedPosts() {
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  if (!process.env.SUPABASE_DB_URL) {
    console.error('ERROR: SUPABASE_DB_URL environment variable is required');
    process.exit(1);
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, title, slug, status, product_id FROM posts WHERE status != 'published' ORDER BY created_at DESC`
    );
    console.log(`Found ${rows.length} non-published posts:`);
    rows.forEach((r) => console.log(`  [${r.status}] ${r.slug} | ${r.title} | product_id=${r.product_id ?? 'NULL'}`));

    const orphans = rows.filter((r) => !r.product_id);
    console.log(`\nDeleting ${orphans.length} orphaned draft posts (product_id IS NULL)...`);
    if (orphans.length === 0) {
      console.log('Nothing to clean.');
      return;
    }
    for (const o of orphans) {
      await pool.query('DELETE FROM posts WHERE id = $1', [o.id]);
      console.log(`  deleted ${o.slug}`);
    }
    console.log('Cleanup complete.');
  } catch (e) {
    console.error('Cleanup failed:', e);
  } finally {
    await pool.end();
  }
}

cleanupOrphanedPosts();
