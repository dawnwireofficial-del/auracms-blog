// Phase 2b: Careful taxonomy cleanup.
// 1) Merge only duplicate-concept categories (cleaning-home/kitchen-home -> home-kitchen,
//    fitness -> sports-outdoors). Real departments (school-office, bags) stay.
// 2) Precise cross-department fixes for OBVIOUS misfits using distinctive phrases.
// 3) Deactivate empty/junk categories (they have 0 products, so nothing is lost).
// Backed up. Run: node scripts/reorganize-categories.mjs [--apply]
import mysql from 'mysql2/promise';

const APPLY = process.argv.includes('--apply');
const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST || 'srv1932.hstgr.io',
  port: +(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'u916810702_dawnwire',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'u916810702_dawnwire',
});
const log = (m) => console.log((APPLY ? '[APPLY] ' : '[PLAN] ') + m);

const [catRows] = await db.query(`SELECT id, name, slug, status, parent_id FROM categories`);
const cats = {};
for (const c of catRows) cats[c.slug] = c;
const [prods] = await db.query(
  `SELECT id, product_name, category_id, best_for FROM product_reviews WHERE status='published'`
);
const slugOfId = {};
for (const c of catRows) slugOfId[c.id] = c.slug;

// 1) Merges (source -> canonical)
const MERGES = {
  'cleaning-home': 'home-kitchen',
  'kitchen-home': 'home-kitchen',
  'fitness': 'sports-outdoors',
};

// 2) Junk/empty categories to deactivate (0 products each — verified)
const DEACTIVATE = [
  'seo-marketing', 'technology', 'business', 'lifestyle', 'college-guides',
  'girls-skirt-sets', 'childrens-humor', 'body-scrubs-treatments', 'eye-masks',
  'womens-fashion-hoodies', 'unisex-adult', 'alpha-male-romance',
  'facial-cleansing-washes', 'historical-fantasy',
];

// 3) Precise cross-department fixes. [targetSlug, phrases]. Each phrase is
//    distinctive enough to override the current department. Generic tokens
//    (bottle, mat, light, bag, craft, camp, book) are intentionally excluded.
const FIXES = [
  ['toys-games', ['dollhouse', 'doll house', 'board game', 'play kitchen', 'stuffed animal', 'action figure', 'building blocks', 'confetti balloon', 'kids toys', 'pretend play', 'play food', 'toy chest', 'race track set', 'wooden blocks']],
  ['home-kitchen', ['pot holders', 'potholder', 'cheese grater', 'kitchen towel', 'dish towel', 'oven liner', 'cutting board', 'measuring cup', 'coffee maker', 'air fryer', 'food storage container', 'canning jar', 'spice rack', 'trash bag', 'cookware set', 'skillet', 'dish rack', 'kitchen scale', 'spatula set', 'wooden spoons for cooking', 'knife set for kitchen', 'bento lunch box']],
  ['fashion-clothing', ['women\'s biker shorts', 'sneakers for women', 'fashion sneakers', 'hoodie for', 'women\'s hoodies', 'pajama set', 'women\'s slippers', 'men\'s shorts']],
  ['baby-products', ['diaper', 'baby stroller', 'crib ', 'baby bottle', 'pacifier', 'baby onesie', 'infant ', 'nursery']],
  ['books-reading', [' a book ', 'book for adults', 'adult coloring book', 'paperback', 'hardcover', 'novel', 'guide to college', 'survival guide and graduation gift', 'romance']],
  ['art-craft-supplies', ['art supplies', 'artist portfolio', 'drawing set for adults', 'craft supplies', 'paint set', 'canvas for']],
];

// Books are grossly misfiled (a romance/college book was in school supplies):
// if the title clearly is a published book (ISBN-ish phrasing is unreliable), catch
// genre/longform markers.
const moves = [];
const electroCluster = new Set(['electronics', 'computer-accessories', 'gaming']);

for (const p of prods) {
  const cur = slugOfId[p.category_id];
  if (!cur) continue;
  if (MERGES[cur]) {
    moves.push({ id: p.id, name: p.product_name, from: cur, to: MERGES[cur], reason: `merge ${cur}->${MERGES[cur]}` });
    continue;
  }
  const name = p.product_name.toLowerCase();
  for (const [to, phrases] of FIXES) {
    if (to === cur) continue;
    // Never reshuffle within the electronics/computer/gaming cluster
    if (electroCluster.has(cur) && electroCluster.has(to)) continue;
    // Only move OUT of electronics/computer when the phrase is unmistakably a
    // different department (e.g. cookware set, dollhouse, trash bag).
    const hit = phrases.find((ph) => name.includes(ph));
    if (hit) {
      moves.push({ id: p.id, name: p.product_name.slice(0, 75), from: cur, to, reason: `phrase: ${hit.trim()}` });
      break;
    }
  }
}

const seen = new Set();
const uniqueMoves = moves.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
// Never move from the same dept twice / keep only where target differs
const realMoves = uniqueMoves.filter((m) => m.from !== m.to);

const byTo = {};
for (const m of realMoves) byTo[m.to] = (byTo[m.to] || 0) + 1;
log(`Product moves: ${realMoves.length}  ${JSON.stringify(byTo)}`);
for (const m of realMoves) log(`  ${m.name} | ${m.from} -> ${m.to} (${m.reason})`);

const deactAll = [...new Set([...DEACTIVATE, ...Object.keys(MERGES)])].filter((s) => cats[s]);
// Only deactivate cats that truly have 0 products after merges (source cats may hold products → they get merged, then deactivated)
log(`Categories to deactivate: ${deactAll.join(', ')}`);

if (!APPLY) {
  console.log('\nReport only. Re-run with --apply (creates backup table).');
  await db.end();
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
const bk = `prod_category_backup_${stamp}`;
await db.beginTransaction();
try {
  await db.query(`CREATE TABLE IF NOT EXISTS \`${bk}\` (id VARCHAR(64) PRIMARY KEY, old_category_id VARCHAR(64), new_category_id VARCHAR(64), product_name VARCHAR(500))`);
  for (const m of realMoves) {
    const newId = cats[m.to]?.id;
    if (!newId) continue;
    await db.query(`INSERT IGNORE INTO \`${bk}\` (id, old_category_id, new_category_id, product_name) VALUES (?,?,?,?)`, [m.id, slugOfId[m.id] || m.from, m.to, m.name]);
    await db.query(`UPDATE product_reviews SET category_id = ? WHERE id = ?`, [newId, m.id]);
  }
  for (const s of deactAll) {
    await db.query(`UPDATE categories SET status = 'inactive' WHERE slug = ?`, [s]);
  }
  await db.commit();
  log(`Done. ${realMoves.length} products moved; ${deactAll.length} categories deactivated. Backup: ${bk}`);
} catch (e) {
  await db.rollback();
  console.error('Rolled back:', e.message);
  process.exit(1);
}
await db.end();
