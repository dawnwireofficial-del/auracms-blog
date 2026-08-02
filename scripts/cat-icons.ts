const r = await fetch('https://www.dawnwire.com/api/public/categories');
const j = await r.json();
const list = Array.isArray(j) ? j : (j.data || j.categories || []);
for (const c of list) console.log(c.slug, '| icon:', c.icon, '| name:', c.name);
