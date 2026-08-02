const base = 'https://www.dawnwire.com';
const slug = 'bose-soundlink-flex-bluetooth-speaker-2nd-gen---portable-outdoor-speaker-with-hi-fi-audio-waterproof-and-dustproof-usb-c-up-to-12-hours-battery-life-black';
const r = await fetch(`${base}/api/public/product-reviews/slug/${slug}`);
const j = await r.json().catch(() => null);
console.log('status', r.status);
console.log('ok:', !!j);
if (j) console.log('name:', j.product_name || j.productName, '| price:', j.price, '| seo:', j.seo_title ? 'yes' : 'no');
