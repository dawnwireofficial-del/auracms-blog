// Deep page audit: loads a set of routes in headless Chrome and reports
// console errors, HTTP >=400 failures, broken images, and content markers.
// Saves screenshots of the first N routes into qa-shots/audit/.
// Usage: node scripts/audit-pages.mjs [route,route,...]
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'https://www.dawnwire.com';
const routes = (process.argv[2] || '').split(',').filter(Boolean).length
  ? process.argv[2].split(',').filter(Boolean)
  : ['/', '/products', '/categories/beauty-personal-care', '/deals', '/buying-guides', '/brands', '/post/best-insulated-water-bottles-2026', '/products/makeup-organizer-with-led-mirror-cosmetic-display-cases-off-white', '/admin', '/contact'];

const PORT = 9860 + Math.floor(Math.random() * 50);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + fs.mkdtempSync('dw-audit-'), '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let msgId = 0; const pending = new Map(); let ws;
async function cdp(method, params = {}) {
  const id = ++msgId; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error(method + ' timeout')), 25000); pending.set(id, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); }); });
}
let list = null;
for (let i = 0; i < 12 && !list; i++) { await sleep(1000); list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).catch(() => null); }
if (!list) { console.error('chrome did not start'); process.exit(1); }
ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let errors = []; let httpFail = [];
ws.onmessage = (m) => {
  const j = JSON.parse(m.data);
  if (j.id && pending.has(j.id)) { pending.get(j.id)(j); pending.delete(j.id); return; }
  if (j.method === 'Runtime.exceptionThrown') errors.push('EXC: ' + (j.params.exceptionDetails?.exception?.description || j.params.exceptionDetails?.text || '').slice(0, 220));
  else if (j.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(j.params.type)) errors.push(j.params.type.toUpperCase() + ': ' + j.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 220));
  else if (j.method === 'Network.responseReceived' && j.params.response.status >= 400) httpFail.push(j.params.response.status + ' ' + j.params.response.url.slice(0, 110));
};
await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Network.enable');

fs.mkdirSync('qa-shots/audit', { recursive: true });
const results = [];
for (const route of routes) {
  errors = []; httpFail = [];
  const t0 = Date.now();
  await cdp('Page.navigate', { url: BASE + route });
  await sleep(9000);
  const probe = `(() => {
    const txt = document.body ? document.body.innerText : '';
    const imgs = Array.from(document.querySelectorAll('img'));
    const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0);
    return JSON.stringify({
      h1: document.querySelector('h1') ? document.querySelector('h1').textContent.trim().slice(0, 90) : null,
      title: document.title.slice(0, 90),
      textLen: txt.length,
      rootLen: (document.getElementById('root') ? document.getElementById('root').innerHTML.length : 0),
      brokenCount: broken.length,
      imgCount: imgs.length,
      hasNav: !!document.querySelector('header, nav'),
      hasFooter: !!document.querySelector('footer'),
    });
  })()`;
  let stats = {};
  try { stats = JSON.parse((await (await cdp('Runtime.evaluate', { expression: probe, returnByValue: true })).result.value)); } catch {}
  // screenshot
  try { const shot = await cdp('Page.captureScreenshot', { format: 'png' }); const name = route.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'home'; fs.writeFileSync(`qa-shots/audit/${name}.png`, Buffer.from(shot.data, 'base64')); } catch {}
  const ms = Date.now() - t0;
  const uniqFail = [...new Set(httpFail)];
  results.push({ route, ms, ...stats, errors: errors.slice(0, 4), httpFail: uniqFail.slice(0, 5) });
  console.log('── ' + route + ` (${ms}ms)`);
  console.log('   h1:', stats.h1 || '(none)');
  console.log('   title:', stats.title || '(none)');
  console.log('   textLen:', stats.textLen, '| imgs:', stats.imgCount, '| broken:', stats.brokenCount, '| nav:', stats.hasNav, '| footer:', stats.hasFooter);
  if (stats.brokenCount) console.log('   BROKEN IMG SRCs:', brokenSrcs && brokenSrcs.length);
  if (errors.length) console.log('   CONSOLE:', errors.slice(0, 3).map((e) => e.slice(0, 140)));
  if (uniqFail.length) console.log('   HTTP FAILS:', uniqFail.slice(0, 4));
}
chrome.kill();
console.log('\n=== SUMMARY ===');
const bad = results.filter((r) => r.errors.length || r.httpFail.length || r.brokenCount > 0);
console.log('routes checked:', results.length, '| with issues:', bad.length);
bad.forEach((r) => console.log(' ✗', r.route, r.errors.length ? '(console)' : '', r.httpFail.length ? '(http)' : '', r.brokenCount ? '(broken imgs)' : ''));
process.exit(0);