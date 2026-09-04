// Replicates the browser-extension import flow against the live API:
// create (via /import) -> duplicate check -> auto-process -> fetch-video ->
// public visibility -> cleanup. Uses a throwaway ASIN/slug.
const BASE = 'https://www.dawnwire.com';
const TS = Date.now().toString(36);
const ASIN = 'B0DWE2E' + TS.slice(-3).toUpperCase();
const NAME = `DW Ext E2E Test ${TS}`;
const SLUG = `dw-ext-e2e-test-${TS}`;

async function main() {
  const login = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@aura.com', password: 'Dw9ZM6LFY8O4Qe!9' }) });
  const lj = await login.json();
  const H = { Authorization: 'Bearer ' + lj.token, 'Content-Type': 'application/json' };
  if (!lj.token) { console.log('LOGIN FAIL', login.status); process.exit(1); }

  // 1. check-duplicate before (expect none)
  const preDup = await (await fetch(`${BASE}/api/admin/seo/product-reviews/check-duplicate?asin=${ASIN}`, { headers: H })).json();
  console.log('1. pre duplicate check:', JSON.stringify(preDup));

  // 2. import create — deliberately UNTAGGED amazon URL to test tag enforcement
  const payload = {
    product_name: NAME,
    asin: ASIN,
    brand: 'DawnWireQA',
    price: '19.99',
    rating: 4.3,
    review_count: 12,
    best_for: 'Testing',
    product_image: 'https://m.media-amazon.com/images/I/61QTEST.jpg',
    affiliate_url: `https://www.amazon.com/dp/${ASIN}?th=1`,
    amazon_url: `https://www.amazon.com/dp/${ASIN}`,
    review_summary: 'Automated extension-contract test product.',
    specs: { asin: ASIN, source: 'browser-extension' },
  };
  const imp = await fetch(`${BASE}/api/admin/seo/product-reviews/import`, { method: 'POST', headers: H, body: JSON.stringify(payload) });
  const impJ = await imp.json();
  const id = impJ.id || impJ.review?.id;
  const affUrl = impJ.affiliate_url || impJ.review?.affiliate_url || '(none)';
  console.log('2. import status:', imp.status, 'id:', id);
  console.log('   affiliate_url:', affUrl);
  console.log('   tag enforced:', /tag=dawnwire-20/.test(affUrl) ? 'YES' : 'NO ' + affUrl);
  if (!id) { console.log('CREATE FAILED:', JSON.stringify(impJ).slice(0, 300)); process.exit(1); }

  // 3. duplicate check now (expect duplicate:true)
  const dup = await (await fetch(`${BASE}/api/admin/seo/product-reviews/check-duplicate?asin=${ASIN}`, { headers: H })).json();
  console.log('3. post duplicate check:', JSON.stringify(dup));

  // 4. auto-process (fills brand/category/SEO if missing — may be best-effort)
  try {
    const ap = await fetch(`${BASE}/api/admin/seo/product-reviews/auto-process/${id}`, { method: 'POST', headers: H });
    const apJ = await ap.json();
    console.log('4. auto-process:', ap.status, JSON.stringify(apJ).slice(0, 200));
  } catch (e) { console.log('4. auto-process threw', e.message); }

  // 5. fetch-video (best-effort)
  try {
    const fv = await fetch(`${BASE}/api/admin/seo/product-reviews/fetch-video/${id}`, { method: 'POST', headers: H });
    const fvJ = await fv.json();
    console.log('5. fetch-video:', fv.status, JSON.stringify(fvJ).slice(0, 150));
  } catch (e) { console.log('5. fetch-video threw', e.message); }

  // 6. public visibility by slug
  const pub = await fetch(`${BASE}/api/public/product-reviews/slug/${SLUG}`);
  console.log('6. public slug:', pub.status);
  const pubJ = await pub.json().catch(() => null);
  if (pubJ?.product_name) console.log('   live name:', pubJ.product_name, '| score:', pubJ.editor_score, '| url:', (pubJ.affiliate_url || '').slice(0, 60));

  // 7. cleanup
  const del = await fetch(`${BASE}/api/admin/seo/product-reviews/${id}`, { method: 'DELETE', headers: H });
  console.log('7. cleanup delete:', del.status);
}
main().catch(e => { console.error('E2E FAIL', e.message); process.exit(1); });
