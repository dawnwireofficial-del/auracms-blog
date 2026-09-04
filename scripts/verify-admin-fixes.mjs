const BASE = 'https://www.dawnwire.com';
async function main() {
  // login
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@aura.com', password: 'Dw9ZM6LFY8O4Qe!9' }),
  });
  const lj = await login.json();
  const token = lj.token;
  if (!token) { console.log('LOGIN FAIL', login.status, JSON.stringify(lj).slice(0, 200)); process.exit(1); }
  console.log('login OK');
  for (const path of ['/api/admin/pages', '/api/admin/topic-clusters', '/api/admin/media', '/api/admin/logs', '/api/admin/messages']) {
    const r = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    const t = await r.text();
    const isArr = t.trim().startsWith('[');
    console.log(path, r.status, isArr ? `array ${t.length} chars` : t.slice(0, 160));
  }
}
main();
