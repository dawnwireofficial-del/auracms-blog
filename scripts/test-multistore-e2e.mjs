// Phase 4 E2E: prove a non-Amazon product (Walmart URL) imports with its own
// affiliate tracking suffix and /go/product/:slug redirects to the store URL
// (not hard-coded Amazon). Then cleans up.
import mysql from 'mysql2/promise';

const BASE = 'https://www.dawnwire.com';
const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST || 'srv1932.hstgr.io',
  port: +(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'u916810702_dawnwire',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'u916810702_dawnwire',
});

const random = Math.random().toString(36).slice(2, 8);
const PRODUCT_NAME = `DW Multi-Store E2E ${random}`;
const STORE_URL = 'https://www.walmart.com/ip/DWMultiStoreTest/999888777' + random;
const AFF_SUFFIX = 'wmlspartner=wmpi&wl0=e2etest';

// Login as admin
const loginRes = await fetch(BASE + '/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@aura.com', password: 'Dw9ZM6LFY8O4Qe!9' }),
});
const loginJson = await loginRes.json();
const token = loginJson.token;
if (!token) { console.log('LOGIN FAILED', loginRes.status, JSON.stringify(loginJson).slice(0, 200)); process.exit(1); }
const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

// Simulate the extension's new payload (store source + suffixed affiliate_url)
const payload = {
  product_name: PRODUCT_NAME,
  brand: 'DWQA',
  product_image: 'https://i.ibb.co/x7V4xVt/placeholder.jpg',
  affiliate_url: STORE_URL + '?' + AFF_SUFFIX,
  price: '19.99',
  rating: 4.2,
  review_count: 10,
  stock_status: 'in_stock',
  status: 'published',
  specs: { asin: '', source: 'walmart' },
};
const createRes = await fetch(BASE + '/api/admin/products', { method: 'POST', headers, body: JSON.stringify(payload) });
const created = await createRes.json();
const id = created.id;
if (!id) { console.log('CREATE FAILED', createRes.status, JSON.stringify(created).slice(0, 300)); process.exit(1); }
console.log('created id:', id);

// Find slug
const [rows] = await db.query(`SELECT slug, affiliate_url FROM product_reviews WHERE id = ?`, [id]);
const slug = rows[0].slug;
console.log('slug:', slug);
console.log('stored affiliate_url:', rows[0].affiliate_url);

// /go/product/:slug must 302 to the Walmart URL (not 404/Amazon)
const goRes = await fetch(BASE + '/api/public/go/product/' + slug, { redirect: 'manual' });
console.log('go status:', goRes.status);
console.log('go location:', goRes.headers.get('location'));
const locationOk = goRes.status === 302 && goRes.headers.get('location')?.includes('walmart.com');
console.log('MULTI-STORE REDIRECT OK:', locationOk ? 'PASS' : 'FAIL');

// Also verify an Amazon product still tag-forces
const [amz] = await db.query(`SELECT slug, affiliate_url FROM product_reviews WHERE affiliate_url LIKE '%amazon.com%' AND status='published' LIMIT 1`);
if (amz[0]) {
  const amzRes = await fetch(BASE + '/api/public/go/product/' + amz[0].slug, { redirect: 'manual' });
  console.log('amazon go status:', amzRes.status, '| tag present:', amzRes.headers.get('location')?.includes('tag=dawnwire-20') ? 'PASS' : 'FAIL');
}

// Cleanup
await db.query(`DELETE FROM product_reviews WHERE id = ?`, [id]);
await db.query(`DELETE FROM affiliate_clicks WHERE product_id = ?`, [id]);
console.log('cleaned up');
await db.end();
