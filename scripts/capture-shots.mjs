// QA screenshots: desktop full-page (segmented) + viewport shots at scroll positions.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9820 + Math.floor(Math.random() * 100);
const url = process.argv[2] || 'https://www.dawnwire.com/';
const outDir = 'qa-shots';
fs.mkdirSync(outDir, { recursive: true });
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=' + PORT, '--user-data-dir=' + fs.mkdtempSync('dw-qa-'), '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let msgId = 0; const pending = new Map(); let ws;
async function cdp(method, params = {}) {
  const id = ++msgId; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error(method + ' timeout')), 20000); pending.set(id, m => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); }); });
}
async function ev(expr) { const r = await cdp('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result?.value; }
let list = null;
for (let i = 0; i < 10 && !list; i++) {
  await sleep(1200);
  list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json()).catch(() => null);
}
if (!list) { console.error('chrome did not start'); process.exit(1); }
ws = new WebSocket(list.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id && pending.has(j.id)) { pending.get(j.id)(j); pending.delete(j.id); } };
await cdp('Runtime.enable'); await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await cdp('Page.navigate', { url });
await sleep(11000);
const tag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const save = async (shot, name) => { const f = `${outDir}/${name}-${tag}.png`; fs.writeFileSync(f, Buffer.from(shot.data, 'base64')); console.log('saved', f); };
// Desktop viewport shots at scroll positions
for (const [y, name] of [[0, 'desktop-0'], [2200, 'desktop-2'], [4800, 'desktop-4']]) {
  await ev(`window.scrollTo(0, ${y})`);
  await sleep(2200);
  await save(await cdp('Page.captureScreenshot', { format: 'png' }), name);
}
// Desktop full-page via segmented stitched capture: emulate tall viewport in chunks
const dh = await ev('document.documentElement.scrollHeight');
await ev('window.scrollTo(0, 0)'); await sleep(800);
const segs = Math.ceil(dh / 900);
for (let i = 0; i < segs; i++) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await ev(`window.scrollTo(0, ${i * 900})`); await sleep(1400);
  await cdp('Page.captureScreenshot', { format: 'png' }).then(async (s) => {
    // move the captured region up by stitching later is complex; store per-segment
    const f = `${outDir}/desktop-seg-${i}-${tag}.png`;
    fs.writeFileSync(f, Buffer.from(s.data, 'base64'));
  }).catch(() => {});
}
console.log('desktop segments saved:', segs);
// Mobile viewport shots at scroll positions
await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await cdp('Page.reload'); await sleep(9000);
const mh = await ev('document.documentElement.scrollHeight');
for (const [y, name] of [[0, 'mobile-0'], [1500, 'mobile-1'], [3200, 'mobile-2']]) {
  await ev(`window.scrollTo(0, ${y})`); await sleep(1800);
  await save(await cdp('Page.captureScreenshot', { format: 'png' }), name);
}
console.log('PAGE:', JSON.stringify(await ev(`({ dw: document.documentElement.scrollWidth, dh: ${dh}, mh: ${mh} })`)));
process.exit(0);
