// End-to-end admin CRUD persistence test against the LIVE API + MySQL.
// Verifies every write really lands (no silently-dropped writes / dummy state).
// Usage: node scripts/test-admin-crud.mjs
import fs from 'fs';
import mysql from 'mysql2/promise';

const BASE = 'https://www.dawnwire.com';
const TOKEN = 'token-a0000000-0000-0000-0000-000000000001';
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// MySQL direct check
const env = {};
for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
  if (m) env[m[1]] = m[2];
}
const db = await mysql.createConnection({
  host: env.MYSQL_HOST, port: Number(env.MYSQL_PORT),
  user: env.MYSQL_USER, password: env.MYSQL_PASSWORD, database: env.MYSQL_DATABASE,
});
const q = async (sql, p) => { try { const [r] = await db.query(sql, p); return r || []; } catch (e) { return [{ __err: e.message }]; } };

let pass = 0, fail = 0;
const stamp = Date.now();
function ok(cond, label, extra) {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label} ${extra ? JSON.stringify(extra) : ''}`); }
}

async function api(method, path, body) {
  const r = await fetch(BASE + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, text: t.slice(0, 200) }; }
}

console.log('\n1) CATEGORY');
{
  const name = `QA Test Cat ${stamp}`;
  const c = await api('POST', '/api/admin/categories', { name, slug: `qa-test-cat-${stamp}`, description: 'qa', status: 'active', parentId: undefined });
  const id = c.json?.id;
  ok(c.status === 200 && id, 'create returns id', c);
  if (id) {
    const [row] = await q('SELECT id,name,status FROM categories WHERE id=?', [id]);
    ok(row && row.name === name, 'row persisted in MySQL', row);
    const u = await api('PUT', `/api/admin/categories/${id}`, { name: name + ' v2' });
    const [row2] = await q('SELECT name FROM categories WHERE id=?', [id]);
    ok(u.status === 200 && row2 && row2.name === name + ' v2', 'update persisted', row2);
    const d = await api('DELETE', `/api/admin/categories/${id}`);
    const gone = await q('SELECT id FROM categories WHERE id=?', [id]);
    ok(d.status === 200 && gone.length === 0, 'delete removed row');
  }
}

console.log('\n2) BRAND');
{
  const b = await api('POST', '/api/admin/brands', { name: `QA Brand ${stamp}` });
  const id = b.json?.id || b.json?.data?.id;
  ok(b.status === 200 && id, 'create returns id', b);
  if (id) {
    const [row] = await q('SELECT id,name FROM brands WHERE id=?', [id]);
    ok(row && row.name === `QA Brand ${stamp}`, 'brand persisted', row);
    const d = await api('DELETE', `/api/admin/brands/${id}`);
    const gone = await q('SELECT id FROM brands WHERE id=?', [id]);
    ok(d.status === 200 && gone.length === 0, 'brand deleted');
  }
}

console.log('\n3) DEAL');
{
  const d = await api('POST', '/api/admin/deals', { title: `QA Deal ${stamp}`, productId: null, regularPrice: 100, salePrice: 50, discountPercentage: 50, dealType: 'daily', status: 'active' });
  const id = d.json?.id;
  ok(d.status === 200 && id, 'deal create returns id', d);
  if (id) {
    const [row] = await q('SELECT id,title FROM deals WHERE id=?', [id]);
    ok(row && row.title === `QA Deal ${stamp}`, 'deal persisted', row);
    await api('DELETE', `/api/admin/deals/${id}`);
    const gone = await q('SELECT id FROM deals WHERE id=?', [id]);
    ok(gone.length === 0, 'deal deleted');
  }
}

console.log('\n4) HOMEPAGE HERO SLIDE');
{
  const h = await api('POST', '/api/admin/homepage-hero', { heading: `QA Slide ${stamp}`, description: 'qa', ctaText: 'x', ctaLink: '/products', sortOrder: 999, isActive: true, altText: 'qa' });
  const id = h.json?.id;
  ok(h.status === 200 && id, 'hero slide create returns id', h);
  if (id) {
    const [row] = await q('SELECT id,heading FROM homepage_hero_slides WHERE id=?', [id]);
    ok(row && row.heading === `QA Slide ${stamp}`, 'slide persisted', row);
    await api('DELETE', `/api/admin/homepage-hero/${id}`);
    const gone = await q('SELECT id FROM homepage_hero_slides WHERE id=?', [id]);
    ok(gone.length === 0, 'slide deleted');
  }
}

console.log('\n5) PAGE (create/update/delete)');
{
  const p = await api('POST', '/api/admin/pages', { title: `QA Page ${stamp}`, slug: `qa-page-${stamp}`, content: 'hello', status: 'draft' });
  const id = p.json?.id || p.json?.data?.id;
  ok(p.status === 200 && id, 'page create', p);
  if (id) {
    const [row] = await q('SELECT id,title FROM pages WHERE id=?', [id]);
    ok(row && row.title === `QA Page ${stamp}`, 'page persisted');
    const u = await api('PUT', `/api/admin/pages/${id}`, { title: `QA Page ${stamp} v2`, status: 'published' });
    const [row2] = await q('SELECT title,status FROM pages WHERE id=?', [id]);
    ok(u.status === 200 && row2 && row2.title.endsWith('v2') && row2.status === 'published', 'page update persisted', row2);
    await api('DELETE', `/api/admin/pages/${id}`);
    const gone = await q('SELECT id FROM pages WHERE id=?', [id]);
    ok(gone.length === 0, 'page deleted');
  }
}

console.log('\n6) SETTINGS (real update, no dummy)');
{
  const before = await api('GET', '/api/admin/settings');
  const key = 'qa_audit_timestamp';
  const payload = before.json || {};
  payload[key] = String(Date.now());
  const s = await api('PUT', '/api/admin/settings', payload);
  const [row] = await q("SELECT value FROM settings WHERE `key`=?", [key]);
  ok(s.status === 200 && row && row.value === payload[key], 'settings write persisted real value', row);
  if (row) await q('DELETE FROM settings WHERE `key`=?', [key]);
}

console.log(`\n==== RESULT: ${pass} passed, ${fail} failed ====`);
await db.end();
process.exit(fail ? 1 : 0);