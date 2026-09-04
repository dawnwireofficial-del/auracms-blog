// Idempotent MySQL schema repairs:
//  1. Add created_at / updated_at to tables that lack them (code orders by
//     created_at on several → those queries 500 with "Unknown column").
//  2. Create the missing topic_clusters table.
// Usage: node scripts/fix-mysql-schema.mjs
import fs from 'fs';
import mysql from 'mysql2/promise';

const env = {};
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m) env[m[1]] = m[2];
}
const c = await mysql.createConnection({
  host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT),
  user: env.MYSQL_USER, password: env.MYSQL_PASSWORD, database: env.MYSQL_DATABASE,
});

const FIXED = ['affiliate_link_log', 'amazon_api_usage', 'auto_article_settings', 'brands', 'error_404_logs', 'pages', 'recently_viewed', 'settings', 'tags', 'user_passwords', 'wishlist'];
for (const t of FIXED) {
  const [cols] = await c.query('SHOW COLUMNS FROM `' + t + '`');
  const names = cols.map((x) => x.Field);
  if (!names.includes('created_at')) await c.query('ALTER TABLE `' + t + '` ADD COLUMN created_at VARCHAR(35) NULL');
  if (!names.includes('updated_at') && !names.includes('updatedAt')) await c.query('ALTER TABLE `' + t + '` ADD COLUMN updated_at VARCHAR(35) NULL');
  console.log('repaired timestamps:', t);
}

const TC = `CREATE TABLE IF NOT EXISTS \`topic_clusters\` (
  \`id\` VARCHAR(36) NULL,
  \`name\` MEDIUMTEXT NULL,
  \`slug\` MEDIUMTEXT NULL,
  \`description\` MEDIUMTEXT NULL,
  \`pillar_page_id\` VARCHAR(36) NULL,
  \`pillar_page_slug\` MEDIUMTEXT NULL,
  \`pillar_page_title\` MEDIUMTEXT NULL,
  \`cluster_post_ids\` MEDIUMTEXT NULL,
  \`status\` MEDIUMTEXT NULL,
  \`created_at\` VARCHAR(35) NULL,
  \`updated_at\` VARCHAR(35) NULL,
PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
await c.query(TC);
const [tc] = await c.query("SHOW TABLES LIKE 'topic_clusters'");
console.log('topic_clusters table ready:', tc.length > 0);
await c.end();