// Adds human-vs-bot columns and backfills the known automated/test click
// bursts (bulk-import era + E2E test days) as is_bot=1 so the dashboards show
// real human numbers going forward. Idempotent — safe to re-run.
import fs from 'fs';
import mysql from 'mysql2/promise';

const env = {};
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m) env[m[1]] = m[2];
}

const db = await mysql.createConnection({
  host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT),
  user: env.MYSQL_USER, password: env.MYSQL_PASSWORD, database: env.MYSQL_DATABASE,
});

const hasCol = async (table, col) => {
  const [c] = await db.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, col]);
  return c.length > 0;
};

const addCol = async (table, col, ddl) => {
  if (await hasCol(table, col)) { console.log(`exists: ${table}.${col}`); return; }
  await db.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  console.log(`added:  ${table}.${col}`);
};

await addCol('page_views', 'is_bot', '`is_bot` TINYINT(1) NOT NULL DEFAULT 0');
await addCol('affiliate_clicks', 'is_bot', '`is_bot` TINYINT(1) NOT NULL DEFAULT 0');
await addCol('affiliate_clicks', 'user_agent', '`user_agent` MEDIUMTEXT NULL');

// Backfill: known automated/test bursts (bulk-import era Aug 10-31, E2E tests
// Sep 1-3). Rows from today onward are classified live by UA at write time.
const [r1] = await db.query(
  `UPDATE affiliate_clicks SET is_bot = 1
   WHERE (created_at >= '2026-08-10T00:00:00' AND created_at < '2026-09-04T00:00:00')`);
console.log('backfilled affiliate_clicks -> bot:', r1.affectedRows);

const [[state]] = await db.query(
  `SELECT
     SUM(is_bot = 1) AS bots,
     SUM(is_bot = 0) AS humans,
     COUNT(*) AS total
   FROM affiliate_clicks`);
console.log('affiliate_clicks now:', state);

const [[pv]] = await db.query(
  `SELECT SUM(is_bot = 1) AS bots, SUM(is_bot = 0) AS humans, COUNT(*) AS total FROM page_views`);
console.log('page_views now:', pv);

await db.end();
