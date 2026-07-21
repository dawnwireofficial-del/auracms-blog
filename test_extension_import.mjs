const BASE_URL = 'https://www.dawnwire.com';

async function testImport() {
  const token = 'token-00000000-0000-4000-a000-000000000001';

  console.log('--- Step 1: Testing Connection (/api/auth/me) ---');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Connection Test Status:', meRes.status);
  const meData = await meRes.json().catch(() => ({}));
  console.log('User Details:', meData);

  console.log('\n--- Step 2: Importing Product via Chrome Extension Payload ---');
  const testProduct = {
    product_name: 'Graco Tranzitions 3 in 1 Harness Booster Car Seat Live Test',
    brand: 'Graco',
    price: '$129.99',
    listPrice: '$149.99',
    rating: 4.8,
    asin: 'B0DQLRHG1N',
    amazon_url: 'https://www.amazon.com/Graco-Tranzitions-Harness-Highback-Backless/dp/B0DQLRHG1N',
    product_image: 'https://m.media-amazon.com/images/I/81HNSfcKuZL._AC_SL1500_.jpg',
    key_features: ['3-in-1 harness booster', 'Lightweight portable design', 'One-hand 8-position headrest'],
    pros: ['Easy to install', 'Comfy padding', 'Dual cup holders'],
    cons: ['Slightly wide base'],
    review_summary: 'The Graco Tranzitions 3-in-1 Harness Booster Car Seat is designed to grow with your child from toddler to youth.',
    stockStatus: 'in_stock',
    dealBadge: '13% OFF',
    source: 'amazon'
  };

  const importRes = await fetch(`${BASE_URL}/api/admin/seo/product-reviews/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(testProduct)
  });

  console.log('Import HTTP Status:', importRes.status);
  const importResult = await importRes.json();
  console.log('Import Response Body:', JSON.stringify(importResult, null, 2));

  if (importRes.ok && (importResult.id || importResult.slug)) {
    console.log('\n✅ TEST PASSED SUCCESSFUL! Product imported successfully into DawnWire! ID:', importResult.id || importResult.slug);
  } else {
    console.error('\n❌ TEST FAILED:', importResult);
  }
}

testImport().catch(console.error);
