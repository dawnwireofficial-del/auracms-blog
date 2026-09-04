// De-duplicate published posts that share the same product_id (auto-generated
// buying guides were created multiple times, leaving "-mt…" suffix copies).
// Also removes leftover E2E/test posts. Everything deleted is first backed up
// into a `posts_trash_*` table so it is fully recoverable.
import mysql from 'mysql2/promise';

const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST || 'srv1932.hstgr.io',
  port: +(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'u916810702_dawnwire',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'u916810702_dawnwire',
});

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const trash = `posts_trash_${stamp}`;

// 1) Groups of published posts sharing one product_id
const [groups] = await db.query(
  `SELECT product_id, COUNT(*) c
     FROM posts
    WHERE status = 'published' AND product_id IS NOT NULL
    GROUP BY product_id HAVING COUNT(*) > 1`
);
console.log(`Duplicate product groups: ${groups.length}`);

const keepIds = [];
const deleteIds = [];

for (const g of groups) {
  const [rows] = await db.query(
    `SELECT id, title, slug, product_id, featured_image, content, created_at, updated_at
       FROM posts WHERE product_id = ? AND status = 'published' ORDER BY created_at ASC`,
    [g.product_id]
  );
  // Keeper priority: canonical slug (no -mt suffix) > has featured image > longest content > earliest
  const scored = rows.map((r) => ({
    ...r,
    score:
      (r.slug && !/[-_]mt[a-z0-9]+$/i.test(r.slug) ? 1000 : 0) +
      (r.featured_image ? 200 : 0) +
      Math.min((r.content || '').length, 2000) / 10 +
      (r.created_at ? 0 : -500),
  }));
  scored.sort((a, b) => b.score - a.score);
  const keeper = scored[0];
  keepIds.push(keeper.id);
  scored.slice(1).forEach((r) => deleteIds.push(r.id));
}

// 2) Leftover test posts (any status)
const [testPosts] = await db.query(
  `SELECT id FROM posts
    WHERE title LIKE '%E2E Test%' OR title LIKE '%mtmpjiqs%' OR title LIKE '%DawnWireQA%'
       OR slug LIKE '%e2e-test%' OR slug LIKE '%mtmpjiqs%'`
);
testPosts.forEach((r) => deleteIds.push(r.id));

const finalDelete = [...new Set(deleteIds)].filter((id) => !keepIds.includes(id));
console.log(`Keeping ${keepIds.length} posts; deleting ${finalDelete.length} duplicates/test posts`);

if (finalDelete.length === 0) {
  console.log('Nothing to delete.');
  await db.end();
  process.exit(0);
}

// Backup then delete, in a transaction
await db.beginTransaction();
try {
  await db.query(
    `CREATE TABLE IF NOT EXISTS \`${trash}\` LIKE posts`
  );
  // insert chunks (mysql2 placeholders limit ~65535)
  for (let i = 0; i < finalDelete.length; i += 500) {
    const chunk = finalDelete.slice(i, i + 500);
    await db.query(
      `INSERT INTO \`${trash}\` SELECT * FROM posts WHERE id IN (${chunk.map(() => '?').join(',')})`,
      chunk
    );
  }
  for (let i = 0; i < finalDelete.length; i += 500) {
    const chunk = finalDelete.slice(i, i + 500);
    await db.query(
      `DELETE FROM posts WHERE id IN (${chunk.map(() => '?').join(',')})`,
      chunk
    );
  }
  await db.commit();
  console.log(`Done. Backup table: ${trash} (${finalDelete.length} rows recoverable).`);
} catch (e) {
  await db.rollback();
  throw e;
}
await db.end();
