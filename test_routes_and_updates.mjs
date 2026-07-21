const BASE_URL = 'https://www.dawnwire.com';

async function runAuditTests() {
  console.log('====================================================');
  console.log('       DAWNWIRE AUTOMATED ROUTE & DATA AUDIT        ');
  console.log('====================================================');

  // Test 1: GET /products
  console.log('\n[Test 1] GET /products catalogue API endpoint');
  const resProducts = await fetch(`${BASE_URL}/api/public/product-reviews?limit=500`);
  console.log('Status:', resProducts.status);
  const productsData = await resProducts.json().catch(() => ({}));
  console.log('Total Products returned:', productsData.total || (Array.isArray(productsData) ? productsData.length : 0));

  // Test 2: GET /api/public/product-reviews/slug/:slug for Graco
  console.log('\n[Test 2] GET /api/public/product-reviews/slug/graco-slimfit...');
  const gracoSlug = 'graco-slimfit-3-in-1-convertible-car-seat-ultra-space-saving-design-silas-suitable-for-rear-and-forward-facing-highback-booster-seat-with-10-position-headrest';
  const resGraco = await fetch(`${BASE_URL}/api/public/product-reviews/slug/${encodeURIComponent(gracoSlug)}`);
  console.log('Graco Slug Review Status:', resGraco.status);
  if (resGraco.ok) {
    const gracoData = await resGraco.json();
    console.log('Found Graco Product:', {
      id: gracoData.id,
      name: gracoData.product_name,
      price: gracoData.price,
      brand: gracoData.brand,
      prosCount: Array.isArray(gracoData.pros) ? gracoData.pros.length : 0,
    });
  }

  // Test 3: GET /robots.txt
  console.log('\n[Test 3] GET /robots.txt');
  const resRobots = await fetch(`${BASE_URL}/robots.txt`);
  const robotsText = await resRobots.text();
  console.log('Robots.txt contains Allow: /', robotsText.includes('Allow: /'));
  console.log('Robots.txt blocks /review/:', robotsText.includes('Disallow: /review/'));

  // Test 4: Wishlist API GET & POST
  console.log('\n[Test 4] Wishlist API endpoints');
  const testSid = 'test_audit_session_' + Date.now();
  const resWishGet = await fetch(`${BASE_URL}/api/public/wishlist?sessionId=${testSid}`);
  console.log('Wishlist GET Status:', resWishGet.status);
  
  if (productsData.data && productsData.data.length > 0) {
    const targetId = productsData.data[0].id;
    const resWishPost = await fetch(`${BASE_URL}/api/public/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: targetId, sessionId: testSid }),
    });
    console.log('Wishlist POST Status:', resWishPost.status);
    const postBody = await resWishPost.json();
    console.log('Wishlist Item Saved ID:', postBody.id);

    // Verify GET wishlist returns joined product object
    const resWishVerify = await fetch(`${BASE_URL}/api/public/wishlist?sessionId=${testSid}`);
    const verifyItems = await resWishVerify.json();
    console.log('Saved Wishlist Joined Product Name:', verifyItems[0]?.product?.product_name || 'N/A');

    // Clean up test wishlist item
    if (postBody.id) {
      await fetch(`${BASE_URL}/api/public/wishlist/${postBody.id}`, { method: 'DELETE' });
      console.log('Cleaned up test wishlist item.');
    }
  }

  console.log('\n====================================================');
  console.log('                ALL AUDIT TESTS COMPLETED           ');
  console.log('====================================================');
}

runAuditTests().catch(console.error);
