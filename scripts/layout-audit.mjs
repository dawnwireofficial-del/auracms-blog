// Headless-Chrome layout audit over raw CDP (no puppeteer needed).
// Usage: node scripts/layout-audit.mjs <url> [mobile]
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const url = process.argv[2] || 'https://www.dawnwire.com/';
const mobile = process.argv[3] === 'mobile';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333 + Math.floor(Math.random() * 500);

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=' + fs.mkdtempSync('dw-audit-'),
  '--window-size=1440,900', '--force-device-scale-factor=1', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let ws;
let msgId = 0;
const pending = new Map();
const consoleMsgs = [];
let screenshotIdx = 0;

async function cdp(method, params = {}, timeoutMs = 15000) {
  const id = ++msgId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => { pending.delete(id); reject(new Error(method + ' timeout')); }, timeoutMs);
    pending.set(id, (m) => { clearTimeout(t); if (m.error) reject(new Error(m.error.message)); else resolve(m.result); });
  });
}

async function evalJs(expr) {
  const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails).slice(0, 300));
  return r.result?.value;
}

async function main() {
  for (let i = 0; i < 40; i++) { await sleep(250); }
  const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  const page = list.find(t => t.type === 'page');
  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleMsgs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 220));
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      consoleMsgs.push(m.params.entry.text.slice(0, 220));
    }
  };
  await cdp('Runtime.enable'); await cdp('Log.enable');
  await cdp('Page.enable');
  if (mobile) {
    await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  } else {
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  }
  await cdp('Page.navigate', { url });
  await sleep(mobile ? 12000 : 9000); // let SPA render + fonts + images
  await evalJs('document.fonts ? document.fonts.ready.then(()=>1) : 1');
  await sleep(3000);

  const audit = await evalJs(`(() => {
    const out = { url: location.href, title: document.title, vw: innerWidth, vh: innerHeight, issues: [], overflow: 0, brokenImages: [], h1s: [], sections: [] };
    out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    // Zero-size or clipped elements containing text
    document.querySelectorAll('h1,h2,h3,h4,p,span,a,button').forEach(el => {
      const r = el.getBoundingClientRect();
      const t = (el.textContent || '').trim();
      if (t && t.length > 1) {
        if (r.width < 2 && r.height < 2) out.issues.push('invisible text: ' + el.tagName + ' "' + t.slice(0,50) + '"');
        if (r.width > out.vw - 4) out.issues.push('full-bleed: ' + el.tagName + ' "' + t.slice(0,40) + '" w=' + Math.round(r.width));
      }
      if (r.right > out.vw + 2 || r.left < -2) out.issues.push('h-overflow: ' + el.tagName + ' "' + t.slice(0,40) + '" left=' + Math.round(r.left) + ' right=' + Math.round(r.right));
    });
    document.querySelectorAll('img').forEach(im => {
      if (im.complete && im.naturalWidth === 0 && im.src && !im.src.startsWith('data:')) {
        out.brokenImages.push(im.src.slice(0, 120));
      }
    });
    document.querySelectorAll('h1').forEach(h => out.h1s.push((h.textContent||'').trim().slice(0,60)));
    // Section geometry: main direct children and header/footer
    const roots = [document.querySelector('header'), document.querySelector('main'), document.querySelector('footer')].filter(Boolean);
    roots.forEach(root => {
      if (!root) return;
      const r = root.getBoundingClientRect();
      out.sections.push({ tag: root.tagName.toLowerCase(), y: Math.round(r.top + scrollY), h: Math.round(r.height) });
    });
    // catch any element taller than viewport that overlaps next sibling horizontally
    return out;
  })()`);

  // Full-page screenshot
  await cdp('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: 900, deviceScaleFactor: mobile ? 2 : 1, mobile, screenWidth: mobile ? 390 : 1440, screenHeight: 900 });
  const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const name = `scripts/shot-${mobile ? 'm' : 'd'}-${Date.now()}.png`;
  fs.writeFileSync(name, Buffer.from(shot.data, 'base64'));
  console.log('screenshot:', name);

  audit.sections.forEach(s => console.log('section', JSON.stringify(s)));
  console.log('H1s:', JSON.stringify(audit.h1s));
  console.log('horizontal overflow px:', audit.overflow);
  console.log('console errors:', consoleMsgs.length);
  consoleMsgs.slice(0, 15).forEach(m => console.log('  !', m));
  console.log('broken images:', audit.brokenImages.length);
  audit.brokenImages.slice(0, 8).forEach(m => console.log('  x', m));
  console.log('issues:', audit.issues.length);
  audit.issues.slice(0, 20).forEach(i => console.log('  -', i));
  process.exit(0);
}

main().catch(e => { console.error('AUDIT FAIL', e.message); chrome.kill(); process.exit(1); });
process.on('exit', () => { try { chrome.kill(); } catch {} });
