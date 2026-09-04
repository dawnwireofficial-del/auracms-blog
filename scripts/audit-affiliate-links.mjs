// Audit affiliate links for all products in the DawnWire Supabase DB.
// Usage: node scripts/audit-affiliate-links.mjs
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env (supports "KEY=value" lines).
import fs from 'fs';

function loadEnv() {
  const env = {};
  try {
    const raw = fs.readFileSync('.env', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (!m) continue;
      env[m[1]] = m[2].replace(/^"|"$/g, '');
    }
  } catch {}
  return env;
}

const env = loadEnv();
const URL = env.SUPABASE_URL.replace(/\/$/, '');
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const qs = 'select=id,slug,product_name,affiliate_url,amazon_url,asin,status,click_count&limit=1000';
const res = await fetch(`${URL}/rest/v1/product_reviews?${qs}`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
});
if (!res.ok) {
  console.error('DB fetch failed:', res.status, await res.text());
  process.exit(1);
}
const arr = await res.json();
const tag = 'dawnwire-20';

const statuses = {};
arr.forEach((p) => { statuses[p.status] = (statuses[p.status] || 0) + 1; });
console.log('Total:', arr.length, '| Statuses:', JSON.stringify(statuses));

const cats = { healthyManual: 0, taggedSysGen: 0, untagged: 0, wrongTag: 0, nonAmazon: 0, noUrl: 0 };
const problems = [];
const hasTag = (u) => new RegExp(`[?&]tag=${tag}(&|$)`).test(u || '');
const isAmz = (u) => (u || '').toLowerCase().includes('amazon');
const isManual = (au) => /linkCode=/.test(au) || /[?&]ref=/.test(au) || /[?&]ref_=/.test(au) || /\/[A-Za-z0-9][A-Za-z0-9-]{1,80}\/dp\/([A-Z0-9]{10})/i.test(au);

arr.forEach((p) => {
  const au = p.affiliate_url || '';
  const amz = p.amazon_url || '';
  const rec = { slug: p.slug, name: (p.product_name || '').slice(0, 45), status: p.status, clicks: p.click_count || 0 };
  if (!au && !amz) { cats.noUrl++; problems.push({ ...rec, issue: 'NO URL' }); return; }
  if (isAmz(au) || isAmz(amz)) {
    const tagged = hasTag(au) || hasTag(amz);
    if (tagged) {
      if (isManual(au)) cats.healthyManual++;
      else cats.taggedSysGen++;
    } else if ([au, amz].some((u) => /[?&]tag=/.test(u))) {
      cats.wrongTag++;
      problems.push({ ...rec, issue: 'WRONG TAG', au: au.slice(0, 75), amz: amz.slice(0, 60) });
    } else {
      cats.untagged++;
      problems.push({ ...rec, issue: 'UNTAGGED', au: au.slice(0, 75), amz: amz.slice(0, 60) });
    }
  } else {
    cats.nonAmazon++;
    problems.push({ ...rec, issue: 'NON-AMAZON', au: au.slice(0, 60), amz: (amz || '').slice(0, 50) });
  }
});

console.log('\n=== AFFILIATE AUDIT ===');
console.log(JSON.stringify(cats, null, 1));
console.log(`\n=== PROBLEM PRODUCTS (${problems.length}) ===`);
problems.forEach((p) => console.log(JSON.stringify(p)));

const totalClicks = arr.reduce((s, p) => s + (p.click_count || 0), 0);
console.log('\nTotal tracked clicks across all products:', totalClicks);