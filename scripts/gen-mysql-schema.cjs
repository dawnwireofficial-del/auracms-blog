/**
 * Generates MariaDB DDL from the dumped Postgres schema (pg-schema.json +
 * pg-keys.json) so the Hostinger database mirrors Supabase table-for-table,
 * column-for-column (same snake_case names — required by the query adapter).
 *
 * Type mapping:
 *   uuid -> VARCHAR(36) | bool -> TINYINT(1) | int -> INT | int8 -> BIGINT
 *   numeric/float -> DOUBLE | timestamptz/timestamp/date -> VARCHAR(35) (ISO
 *   strings sort chronologically) | json/jsonb/arrays -> LONGTEXT (JSON)
 */
const fs = require('fs');

function loadJsonLoose(p) {
  let raw = fs.readFileSync(p, 'utf8').replace(/^HTTP \d+\s*/, '').trim();
  return JSON.parse(raw);
}

const schema = loadJsonLoose('C:/Users/atifn/AppData/Local/Temp/opencode/pg-schema.json');
const keys = JSON.parse(fs.readFileSync('C:/Users/atifn/AppData/Local/Temp/opencode/pg-keys.json', 'utf8'));

function mapType(udt) {
  switch (udt) {
    case 'uuid': return 'VARCHAR(36)';
    case 'bool': return 'TINYINT(1)';
    case 'int2': case 'int4': return 'INT';
    case 'int8': return 'BIGINT';
    case 'float4': case 'float8': case 'numeric': return 'DOUBLE';
    case 'timestamptz': case 'timestamp': return 'VARCHAR(35)';
    case 'date': return 'VARCHAR(12)';
    case 'json': case 'jsonb': return 'LONGTEXT';
    default:
      if (udt.startsWith('_')) return 'LONGTEXT'; // postgres arrays stored as JSON
      return 'MEDIUMTEXT';
  }
}

function isJsonCol(udt) { return udt === 'json' || udt === 'jsonb' || udt.startsWith('_'); }

// group columns by table
const tables = new Map();
for (const c of schema) {
  if (!tables.has(c.table_name)) tables.set(c.table_name, []);
  tables.get(c.table_name).push(c);
}
const colType = new Map(); // `${table}.${col}` -> mapped type
for (const [t, cols] of tables) for (const c of cols) colType.set(`${t}.${c.column_name}`, mapType(c.udt_name));

function keyColSpec(t, col) {
  const type = colType.get(`${t}.${col}`) || 'MEDIUMTEXT';
  if (type.startsWith('LONGTEXT') || type === 'MEDIUMTEXT') {
    return `\`${col}\`(64)`;
  }
  return `\`${col}\``;
}
const pks = new Map(); const uniq = new Map();
for (const k of keys) {
  if (k.constraint_type === 'PRIMARY KEY') pks.set(k.table_name, k.column_name);
  else if (k.constraint_type === 'UNIQUE') {
    if (!uniq.has(k.table_name)) uniq.set(k.table_name, new Set());
    uniq.get(k.table_name).add(k.column_name);
  }
}

// Extra performance indexes for hot paths
const EXTRA_INDEXES = {
  product_reviews: ['idx_pr_slug (slug)', 'idx_pr_status_cat (status, category_id)', 'idx_pr_score (editor_score)'],
  posts: ['idx_posts_slug (slug)', 'idx_posts_status (status)'],
  categories: ['idx_cat_slug (slug)'],
  homepage_hero_slides: ['idx_hhs_placement (placement, is_active)'],
  shopping_events: ['idx_se_active (is_active, sort_order)'],
  event_products: ['idx_ep_event (event_id)'],
};

let out = `-- DawnWire MariaDB schema (generated ${new Date().toISOString()})\n-- Mirrors Supabase public schema 1:1\nSET NAMES utf8mb4;\n\n`;

for (const [t, cols] of [...tables.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
const pk = pks.get(t) || 'id';
  const lines = [];
  const seen = new Set();
  for (const c of cols) {
    if (seen.has(c.column_name)) continue;
    seen.add(c.column_name);
    const base = mapType(c.udt_name);
    lines.push(`  \`${c.column_name}\` ${base} NULL`);
  }
  if (!seen.has(pk)) lines.push(`  \`${pk}\` VARCHAR(36) NOT NULL`);
  let ddl = `CREATE TABLE IF NOT EXISTS \`${t}\` (\n${lines.join(',\n')}`;
  const parts = [`PRIMARY KEY (${keyColSpec(t, pk)})`];
  for (const u of uniq.get(t) || []) if (u !== pk) parts.push(`UNIQUE KEY \`u_${u}\` (${keyColSpec(t, u)})`);
  for (const idx of EXTRA_INDEXES[t] || []) {
    const name = idx.split(' ')[0];
    const defRaw = idx.substring(idx.indexOf('(') + 1).slice(0, -1);
    const cols = defRaw.split(',').map(c => c.trim()).map(c => keyColSpec(t, c));
    parts.push(`INDEX \`${name}\` (${cols.join(', ')})`);
  }
  out += `${ddl},\n${parts.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
}

fs.writeFileSync('scripts/mysql-schema.sql', out);
console.log(`written scripts/mysql-schema.sql — ${tables.size} tables`);
