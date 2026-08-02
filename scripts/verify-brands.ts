const base = 'https://www.dawnwire.com';
const p1 = await fetch(base + '/api/public/brands?limit=24&offset=0');
const j1 = await p1.json();
const p2 = await fetch(base + '/api/public/brands?limit=24&offset=24');
const j2 = await p2.json();
console.log('page1:', j1.data.length, '/ total:', j1.total, '| first:', j1.data[0]?.name, '| page2 first:', j2.data[0]?.name, '| no overlap:', j1.data.every((b: any) => b.id !== j2.data[0]?.id));
const home = await fetch(base + '/api/public/brands?limit=12');
const jh = await home.json();
console.log('homepage subset:', (jh.data || []).length);
