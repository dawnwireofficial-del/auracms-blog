const base = 'https://www.dawnwire.com';
const a = await fetch(base + '/api/public/product-reviews?limit=500&light=1');
const b = await fetch(base + '/api/public/product-reviews?limit=500');
const ja = await a.text();
const jb = await b.text();
console.log('PROD light:', (ja.length / 1024).toFixed(0) + 'KB | full:', (jb.length / 1024).toFixed(0) + 'KB | ratio:', (jb.length / ja.length).toFixed(1) + 'x');
