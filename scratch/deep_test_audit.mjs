import http from 'https';

const BASE_URL = 'https://www.dawnwire.com';

const endpointsToTest = [
  { path: '/', expectedStatus: 200 },
  { path: '/products', expectedStatus: 200 },
  { path: '/products/graco-slimfit-3-in-1-convertible-car-seat-ultra-space-saving-design-silas-suitable-for-rear-and-forward-facing-highback-booster-seat-with-10-position-headrest', expectedStatus: 200 },
  { path: '/categories', expectedStatus: 200 },
  { path: '/categories/baby-kids', expectedStatus: 200 },
  { path: '/deals', expectedStatus: 200 },
  { path: '/compare', expectedStatus: 200 },
  { path: '/reviews', expectedStatus: 301, expectedLocation: '/products' },
  { path: '/guides', expectedStatus: 200 },
  { path: '/wishlist', expectedStatus: 200 },
  { path: '/account', expectedStatus: 200 },
  { path: '/admin', expectedStatus: 200 },
  
  // 301 Permanent Redirect tests
  { path: '/review', expectedStatus: 301, expectedLocation: '/products' },
  { path: '/review/', expectedStatus: 301, expectedLocation: '/products' },
  { path: '/product', expectedStatus: 301, expectedLocation: '/products' },
  { path: '/product/', expectedStatus: 301, expectedLocation: '/products' },
  { path: '/review/graco-slimfit-3-in-1', expectedStatus: 301, expectedLocation: '/products/graco-slimfit-3-in-1' },

  // API endpoints
  { path: '/api/public/categories', expectedStatus: 200 },
  { path: '/api/public/brands', expectedStatus: 200 },
  { path: '/api/deals/trending', expectedStatus: 200 },
  { path: '/api/public/product-reviews?limit=10', expectedStatus: 200 },
];

function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = BASE_URL + endpoint.path;
    const req = http.get(url, (res) => {
      const { statusCode, headers } = res;
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let pass = statusCode === endpoint.expectedStatus;
        let details = `HTTP ${statusCode}`;

        if (endpoint.expectedLocation) {
          const loc = headers.location || '';
          if (!loc.includes(endpoint.expectedLocation)) {
            pass = false;
            details += ` (Location: '${loc}', expected to include '${endpoint.expectedLocation}')`;
          } else {
            details += ` -> Redirected to ${loc}`;
          }
        }

        if (pass && statusCode === 200 && endpoint.path === '/products') {
          if (body.includes('<title>') || body.includes('id="root"')) {
            details += ' [HTML root rendered]';
          }
        }

        resolve({ path: endpoint.path, pass, statusCode, details, bodyLength: body.length });
      });
    });

    req.on('error', (err) => {
      resolve({ path: endpoint.path, pass: false, statusCode: 0, details: err.message, bodyLength: 0 });
    });
  });
}

async function runAudit() {
  console.log(`====================================================`);
  console.log(`     DEEP WEBSITE AUDIT: ${BASE_URL}`);
  console.log(`====================================================\n`);

  let totalPassed = 0;
  let totalFailed = 0;

  for (const ep of endpointsToTest) {
    const res = await checkEndpoint(ep);
    const mark = res.pass ? '✓ PASS' : '✗ FAIL';
    if (res.pass) totalPassed++; else totalFailed++;

    console.log(`${mark.padEnd(8)} ${ep.path.padEnd(60)} | ${res.details}`);
  }

  console.log(`\n====================================================`);
  console.log(`Results: ${totalPassed} Passed, ${totalFailed} Failed out of ${endpointsToTest.length} tests`);
  console.log(`====================================================\n`);
}

runAudit();
