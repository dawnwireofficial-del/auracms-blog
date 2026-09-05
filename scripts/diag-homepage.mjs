// Loads the live homepage in headless Chrome and reports what actually renders:
// console errors, failed HTTP requests, section markers, broken images.
// Usage: node scripts/diag-homepage.mjs [url]
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9840 + Math.floor(Math.random() * 100);
const url = process.argv[2] || 'https://www.dawnwire.com/';

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + fs.mkdtempSync('dw-diag-'), '--window-size=1440,900', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let msgId = 0; const pending = new Map(); let ws;
async function cdp(method, params = {}) {
  const id = ++msgId; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(method + ' timeout')), 25000); pending.set(id, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
  });
}
const errors = []; const httpFail = [];
let list = null;
for (let i = 0; i < 12 && !list; i++) { await sleep(1000); list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).catch(() => null); }
if (!list) { console.error('chrome did not start'); process.exit(1); }
ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && pending.has(j.id)) { pending.get(j.id)(j); pending.delete(j.id); } else if (j.method === 'Runtime.exceptionThrown') { errors.push('EXC: ' + (j.params.exceptionDetails?.exception?.description || j.params.exceptionDetails?.text || '').slice(0, 300)); } else if (j.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(j.params.type)) { errors.push(j.params.type.toUpperCase() + ': ' + j.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 300)); } else if (j.method === 'Network.loadingFailed') { httpFail.push('FAIL ' + j.params.errorText + ' ' + (j.params?.requestId || '')); } else if (j.method === 'Network.responseReceived') { const r = j.params.response; if (r.status >= 400 && !/\.(png|webp|jpg|jpeg|svg|ico|woff2?|css)(\?|$)/i.test(r.url)) httpFail.push(r.status + ' ' + r.url.slice(0, 140)); } };
await cdp('Runtime.enable'); await cdp('Page.enable'); await cdp('Network.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await cdp('Page.navigate', { url });
await sleep(12000);

const probe = `(() => {
  const txt = document.body ? document.body.innerText : '';
  const markers = ['Independently Reviewed','Live Price Checks','Shop by Category','Hot Deals','Trending:','Buying Guides','Comparison','editor score','Top Rated','Best Sellers','Deals of the Day'];
  const found = {};
  for (const m of markers) found[m] = txt.includes(m);
  const imgs = Array.from(document.querySelectorAll('img'));
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.getAttribute('src') || '').slice(0, 120));
  const secs = Array.from(document.querySelectorAll('section h2, section h3')).slice(0, 25).map((h) => h.textContent.trim().slice(0, 50));
  const rootLen = (document.getElementById('root')?.innerHTML || '').length;
  return JSON.stringify({
    rootLen, bodyTextLen: txt.length,
    headings: secs, brokenImgs: broken.slice(0, 12), brokenCount: broken.length, imgCount: imgs.length,
    markers: found,
    bodyStart: document.body ? txt.slice(0, 300) : ''
  });
})()`;
const stats = JSON.parse(await (await cdp('Runtime.evaluate', { expression: probe, returnByValue: true })).result.value);
console.log('URL:', url);
console.log('root innerHTML len:', stats.rootLen, '| body text len:', stats.bodyTextLen);
console.log('HEADINGS:', JSON.stringify(stats.headings, null, 0));
console.log('BROKEN IMGS (' + stats.brokenCount + '/' + stats.imgCount + '):'); stats.brokenImgs.forEach((s) => console.log('   ', s));
console.log('MARKERS:', JSON.stringify(stats.markers));
console.log('BODY START:', JSON.stringify(stats.bodyStart));
console.log('CONSOLE ERRORS (' + errors.length + '):'); errors.slice(0, 14).forEach((e) => console.log('  ', e));
console.log('HTTP FAILURES (' + httpFail.length + '):'); httpFail.slice(0, 14).forEach((e) => console.log('  ', e));
chrome.kill(); process.exit(0);
