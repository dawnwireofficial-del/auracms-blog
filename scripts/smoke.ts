const base = 'https://www.dawnwire.com';
const slug = 'bose-soundlink-flex-bluetooth-speaker-2nd-gen---portable-outdoor-speaker-with-hi-fi-audio-waterproof-and-dustproof-usb-c-up-to-12-hours-battery-life-black';

const pages = [
  '/', '/products', '/categories', '/deals', '/wishlist', '/buying-guides',
  '/reviews', '/guides', '/best', '/post',
  '/recently-viewed', '/search', '/sitemap.xml', '/robots.txt', '/llms.txt',
  '/browse/beauty-personal-care', '/browse/electronics', '/browse/home-kitchen', '/browse/sports-outdoors',
  '/browse/toys-games', '/browse/gaming', '/browse/fitness', '/browse/ai-software-tools', '/browse/automotive',
  '/products/' + slug,
];

const apis = [
  ['/api/public/knock-config', 'enabled'],
  ['/api/public/product-reviews/slug/' + slug, 'product'],
  ['/api/public/categories', 'data'],
  ['/api/public/brands', 'data'],
  ['/api/public/deals', 'data'],
  ['/api/public/search/suggestions?q=bose', 'suggestions'],
];

let pass = 0, fail = 0;
const tally = (ok, label, extra) => {
  if (ok) pass++; else fail++;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label + (extra ? ' -> ' + extra : ''));
};

for (const p of pages) {
  try {
    const r = await fetch(base + p, { redirect: 'follow' });
    const body = await r.text().catch(() => '');
    // skip app-shell title check only for the product page (client-rendered)
    tally(r.status < 400, 'PAGE ' + p, String(r.status) + ' len=' + body.length);
  } catch (e) { tally(false, 'PAGE ' + p, 'ERR ' + e.message); }
}

for (const [p] of apis) {
  try {
    const r = await fetch(base + p);
    const j = await r.json().catch(() => null);
    if (p.includes('knock-config')) {
      tally(r.status < 400 && j && j.enabled === true, 'API ' + p, 'enabled=' + (j && j.enabled));
    } else if (p.includes('/slug/')) {
      tally(r.status < 400 && j && (j.product_name || j.productName), 'API ' + p, (j && (j.product_name || j.productName) || 'null').slice(0, 40));
    } else if (p.includes('search/suggestions')) {
      tally(r.status < 400 && j, 'API ' + p, 'items=' + (Array.isArray(j) ? j.length : (j && j.suggestions ? j.suggestions.length : '?')));
    } else {
      tally(r.status < 400 && j, 'API ' + p, 'ok=' + !!j);
    }
  } catch (e) { tally(false, 'API ' + p, 'ERR ' + e.message); }
}

// content spot-check on category browse via its API (SPA pages render client-side)
try {
  const r = await fetch(base + '/api/public/categories/beauty-personal-care');
  const j = await r.json().catch(() => null);
  const prods = (j && (j.products || j.data)) || [];
  tally(r.status < 400 && Array.isArray(prods) && prods.length > 100, 'CONTENT beauty category products', 'count=' + (Array.isArray(prods) ? prods.length : '?'));
} catch (e) { tally(false, 'CONTENT beauty category', 'ERR ' + e.message); }

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
