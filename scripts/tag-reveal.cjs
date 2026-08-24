const fs = require('fs');
const p = 'src/pages/HomePage.tsx';
let t = fs.readFileSync(p, 'utf8');
const count = (t.match(/<section className/g) || []).length;
// Tag all homepage sections for scroll-reveal
t = t.split('<section className="').join('<section data-reveal className="');
fs.writeFileSync(p, t);
console.log('tagged sections:', count);