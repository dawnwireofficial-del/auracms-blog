const base = 'https://www.dawnwire.com';

async function main() {
  const res = await fetch(base + '/api/public/product-reviews?limit=1000', { headers: { 'accept': 'application/json' } });
  const json = await res.json();
  console.log('status', res.status, 'total', json.total, 'data', json.data.length);
  const names = ['Bose', 'Ninja', 'Coleman', 'Vitamix', 'Spalding', 'Nanit', 'JBL', 'Sony SRS', 'Corsair', 'Monopoly'];
  const hits = json.data.filter((p) => names.some((n) => p.product_name.includes(n)));
  for (const h of hits.slice(0, 12)) {
    console.log('  -', h.product_name.slice(0, 55), '|', h.category_id ? 'cat' : 'NO-CAT', '|', h.price || 'no-price');
  }
  // verify one full product page renders
  const slug = hits[0]?.slug;
  if (slug) {
    const page = await fetch(base + '/products/' + slug, { redirect: 'follow' });
    console.log('product page', page.status, slug.slice(0, 40));
  }
}
main().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
