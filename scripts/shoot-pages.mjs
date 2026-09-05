// Screenshot sweep — desktop + mobile PNGs of key routes into qa-shots/audit/.
// Same CDP mechanics as audit-pages.mjs (mkdtemp profile, /json/list, ws).
// Usage: node scripts/shoot-pages.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'https://www.dawnwire.com';
const OUT = 'qa-shots/audit';
fs.mkdirSync(OUT, { recursive: true });

const PORT = 9900 + Math.floor(Math.random() * 40);
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + fs.mkdtempSync('dw-shots-'), '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let msgId = 0; const pending = new Map(); let ws;
async function cdp(method, params = {}) {
  const id = ++msgId; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error(method + ' timeout')), 25000); pending.set(id, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); }); });
}

let list = null;
for (let i = 0; i < 15 && !list; i++) { await sleep(1000); list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).catch(() => null); }
if (!list) { console.error('chrome did not start'); chrome.kill(); process.exit(1); }
ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && pending.has(j.id)) { pending.get(j.id)(j); pending.delete(j.id); } };
await cdp('Page.enable');

async function shot(route, label, mobile) {
  try {
    await cdp('Emulation.setDeviceMetricsOverride', mobile
      ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
      : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp('Page.navigate', { url: BASE + route });
    await sleep(mobile ? 6000 : 5000);
    const vp = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(`${OUT}/${label}.png`, Buffer.from(vp.data, 'base64'));
    const fp = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync(`${OUT}/${label}-full.png`, Buffer.from(fp.data, 'base64'));
    console.log('OK  ' + label);
  } catch (e) { console.log('FAIL ' + label + ' ' + e.message); }
}

const pages = [
  ['/', 'home'],
  ['/products', 'products'],
  ['/deals', 'deals'],
  ['/reviews', 'reviews'],
  ['/buying-guides', 'buying-guides'],
  ['/brands', 'brands'],
  ['/categories/beauty-personal-care', 'category-beauty'],
  ['/products/makeup-organizer-with-led-mirror-cosmetic-display-cases-off-white', 'product-detail'],
  ['/post/best-insulated-water-bottles-2026', 'post'],
  ['/admin', 'admin'],
];
for (const [route, label] of pages) await shot(route, 'desktop-' + label, false);
await shot('/', 'mobile-home', true);
await shot('/products/makeup-organizer-with-led-mirror-cosmetic-display-cases-off-white', 'mobile-product', true);
await shot('/deals', 'mobile-deals', true);

try { ws.close(); } catch { }
chrome.kill();
console.log('screenshots -> ' + OUT);
