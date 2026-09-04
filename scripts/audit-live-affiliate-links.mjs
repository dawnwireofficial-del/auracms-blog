// Audit affiliate links of all products via the LIVE DawnWire public API.
// Usage: node scripts/audit-live-affiliate-links.mjs
const BASE = 'https://www.dawnwire.com';
const tag = 'dawnwire-20';

const res = await fetch(`${BASE}/api/public/product-reviews?limit=1000`);
if (!res.ok) {
  console.error('API fetch failed:', res.status, await res.text());
  process.exit(1);
}
const j = await res.json();
const arr = j.data || [];
console.log('Total products:', arr.length);

const statuses = {};
arr.forEach((p) => { statuses[p.status] = (statuses[p.status] || 0) + 1; });
console.log('Statuses:', JSON.stringify(statuses));

const cats = { healthyManual: 0, taggedSysGen: 0, untagged: 0, wrongTag: 0, nonAmazon: 0, noUrl: 0 };
const problems = [];
const hasTag = (u) => new RegExp(`[?&]tag=${tag}(&|$)`).test(u || '');
const isAmz = (u) => (u || '').toLowerCase().includes('amazon');
const isManual = (au) => /linkCode=/.test(au) || /[?&]ref=/.test(au) || /[?&]ref_=/.test(au) || /\/[A-Za-z0-9][A-Za-z0-9-]{1,80}\/dp\/([A-Z0-9]{10})/i.test(au);

arr.forEach((p) => {
  const au = p.affiliate_url || p.affiliateUrl || '';
  const amz = p.amazon_url || p.amazonUrl || '';
  const rec = { slug: p.slug, name: (p.product_name || p.title || '').slice(0, 45) };
  if (!au && !amz) { cats.noUrl++; problems.push({ ...rec, issue: 'NO URL' }); return; }
  if (isAmz(au) || isAmz(amz)) {
    const tagged = hasTag(au) || hasTag(amz);
    if (tagged) {
      if (isManual(au)) cats.healthyManual++;
      else cats.taggedSysGen++;
    } else if ([au, amz].some((u) => /[?&]tag=/.test(u))) {
      cats.wrongTag++;
      problems.push({ ...rec, issue: 'WRONG TAG', au: au.slice(0, 75) });
    } else {
      cats.untagged++;
      problems.push({ ...rec, issue: 'UNTAGGED', au: au.slice(0, 75) });
    }
  } else {
    cats.nonAmazon++;
    problems.push({ ...rec, issue: 'NON-AMAZON', au: au.slice(0, 60) });
  }
});

console.log('\n=== AFFILIATE AUDIT ===');
console.log(JSON.stringify(cats, null, 1));
console.log(`\n=== PROBLEM PRODUCTS (${problems.length}) ===`);
problems.forEach((p) => console.log(JSON.stringify(p)));
const totalClicks = arr.reduce((s, p) => s + (p.click_count || 0), 0);
console.log('\nTotal tracked clicks across all products:', totalClicks);