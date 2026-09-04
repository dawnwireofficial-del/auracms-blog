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

const DDL = `CREATE TABLE IF NOT EXISTS \`page_views\` (
  \`id\` VARCHAR(36) NULL,
  \`path\` MEDIUMTEXT NULL,
  \`referrer\` MEDIUMTEXT NULL,
  \`user_agent\` MEDIUMTEXT NULL,
  \`session_id\` MEDIUMTEXT NULL,
  \`ip\` VARCHAR(64) NULL,
  \`created_at\` VARCHAR(35) NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_page_views_created\` (\`created_at\`),
  KEY \`idx_page_views_path\` (\`path\`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

await c.query(DDL);
const [t] = await c.query("SHOW TABLES LIKE 'page_views'");
console.log('page_views table ready:', t.length > 0);
await c.end();