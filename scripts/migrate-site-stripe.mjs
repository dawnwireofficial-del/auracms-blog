// Migrate the top-N highest-traffic products whose affiliate links are bare
// system-generated URLs (`/dp/ASIN?tag=dawnwire-20`) into SiteStripe-format
// deep links (`/dp/ASIN?tag=...&linkCode=ll2&language=en_US`) — the shape the
// Amazon SiteStripe tool produces (minus per-click tokens only SiteStripe can
// mint). Outputs a CSV of the migrated ASINs so the very top items can be
// re-linked from the SiteStripe toolbar for full linkId tracking.
//
// Traffic metric: click_count (page_views was never populated in MySQL).
// Usage: node scripts/migrate-site-stripe.mjs [--apply] [--top N]
import fs from 'fs';
import mysql from 'mysql2/promise';

const env = {};
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m) env[m[1]] = m[2];
}

const APPLY = process.argv.includes('--apply');
const topIdx = process.argv.indexOf('--top');
const TOP = Number(topIdx >= 0 ? process.argv[topIdx + 1] : 50) || 50;
const TAG = env.AMAZON_PARTNER_TAG || 'dawnwire-20';

const c = await mysql.createConnection({
  host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT),
  user: env.MYSQL_USER, password: env.MYSQL_PASSWORD, database: env.MYSQL_DATABASE,
});

// System-generated = Amazon URL, tagged, NOT a manual/SiteStripe link.
const [rows] = await c.query(
  `SELECT id, slug, product_name, affiliate_url, amazon_url, asin, click_count, page_views
   FROM product_reviews
   WHERE status = 'published'
     AND affiliate_url IS NOT NULL AND affiliate_url != ''
     AND affiliate_url LIKE '%amazon%'
     AND affiliate_url LIKE '%tag=${TAG}%'
     AND affiliate_url NOT LIKE '%linkCode=%'
     AND affiliate_url NOT LIKE '%ref=%'
     AND affiliate_url NOT LIKE '%ref_=%'
   ORDER BY click_count DESC, page_views DESC, created_at DESC`,
);

console.log(`System-generated candidates: ${rows.length} | migrating top ${Math.min(TOP, rows.length)} by traffic`);
const top = rows.slice(0, TOP);

const extractAsin = (u) => {
  const m = (u || '').match(/\/dp\/([A-Z0-9]{10})/i) || (u || '').match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return m ? m[1].toUpperCase() : null;
};

let migrated = 0;
const csvRows = [['slug', 'product_name', 'asin', 'click_count', 'old_url', 'new_url']];
for (const p of top) {
  const asin = extractAsin(p.affiliate_url) || extractAsin(p.amazon_url) || (p.asin || '').toUpperCase();
  if (!asin) { console.log('SKIP (no ASIN):', p.slug); continue; }
  const newUrl = `https://www.amazon.com/dp/${asin}?tag=${TAG}&linkCode=ll2&language=en_US`;
  csvRows.push([p.slug, (p.product_name || '').slice(0, 60), asin, String(p.click_count || 0), p.affiliate_url, newUrl]);
  if (APPLY) {
    await c.query('UPDATE product_reviews SET affiliate_url = ? WHERE id = ?', [newUrl, p.id]);
    migrated++;
  }
}

if (!APPLY) {
  console.log('--- PREVIEW (run with --apply to write) ---');
  csvRows.slice(1, 16).forEach((r) => console.log(`${r[0].slice(0, 55)} | clicks=${r[3]} | ${r[5]}`));
  console.log(`... and ${csvRows.length - 16} more`);
} else {
  console.log(`Updated ${migrated} products to SiteStripe-format links.`);
}

fs.writeFileSync('site-stripe-migration.csv', csvRows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n'));
console.log(`CSV written: site-stripe-migration.csv (${csvRows.length - 1} products)`);
await c.end();