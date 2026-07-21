const BASE_URL = 'https://www.dawnwire.com';

async function testPublicProducts() {
  console.log('--- Testing /api/public/product-reviews?limit=500 ---');
  const res = await fetch(`${BASE_URL}/api/public/product-reviews?limit=500`);
  console.log('HTTP Status:', res.status);
  const data = await res.json().catch(() => ({}));
  console.log('Response Keys:', Object.keys(data));
  console.log('Products Count:', Array.isArray(data.data) ? data.data.length : Array.isArray(data) ? data.length : 0);
  if (data.data && data.data.length > 0) {
    console.log('Sample Product:', { id: data.data[0].id, name: data.data[0].product_name, status: data.data[0].status });
  } else {
    console.log('Full Raw Response:', JSON.stringify(data, null, 2));
  }
}

testPublicProducts().catch(console.error);
