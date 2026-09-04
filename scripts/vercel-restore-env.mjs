// Restore env vars on the DawnWire Vercel project from local .env values.
// Existing (empty) vars are PATCHed in place; missing vars are POSTed.
// Usage: VERCEL_TOKEN=<token> node scripts/vercel-restore-env.mjs
import fs from 'fs';

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'prj_NQ5l926gtx1ENEkhtn5ruymlZXw4';
const API = 'https://api.vercel.com';

if (!TOKEN) {
  console.error('VERCEL_TOKEN required');
  process.exit(1);
}

function loadEnv() {
  const env = {};
  const raw = fs.readFileSync('.env', 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
  return env;
}

// Extra keys that aren't in .env but the app needs on Vercel.
const EXTRA = {
  AMAZON_PARTNER_TAG: 'dawnwire-20',
  ALLOWED_ORIGINS: 'https://www.dawnwire.com,https://dawnwire.com',
};

const local = loadEnv();
const all = { ...local, ...EXTRA };

// Existing env map
const res = await fetch(`${API}/v9/projects/${PROJECT_ID}/env`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});
const existing = {};
if (res.ok) {
  const j = await res.json();
  (j.envs || []).forEach((e) => { existing[e.key] = e.id; });
}

let patched = 0, created = 0, failed = [];
for (const [key, value] of Object.entries(all)) {
  if (!value) continue;
  const id = existing[key];
  const url = id
    ? `${API}/v9/projects/${PROJECT_ID}/env/${id}`
    : `${API}/v9/projects/${PROJECT_ID}/env`;
  const method = id ? 'PATCH' : 'POST';
  const body = id
    ? { value, target: ['production'], type: 'sensitive' }
    : { key, value, target: ['production'], type: 'sensitive' };
  try {
    const r = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (r.ok) { id ? patched++ : created++; console.log(`${method} ${key} OK`); }
    else { failed.push(`${key}: ${r.status} ${(await r.text()).slice(0, 120)}`); }
  } catch (e) { failed.push(`${key}: ${e.message}`); }
}

console.log(`\nPatched: ${patched} | Created: ${created} | Failed: ${failed.length}`);
failed.forEach((f) => console.log('  FAIL', f));