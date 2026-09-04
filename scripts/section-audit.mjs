// Section-by-section audit of the live homepage
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9600 + Math.floor(Math.random() * 150);
const url = process.argv[2] || 'https://www.dawnwire.com/';

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
async function getTargets(port) { return (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); }

async function run() {
  const chrome = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--window-size=1440,3000', '--hide-scrollbars', `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + fs.mkdtempSync('chrome-sec-'), 'about:blank'
  ], { stdio: 'ignore' });
  try {
    let targets = [];
    for (let i = 0; i < 40; i++) { try { targets = await getTargets(PORT); if (targets.length) break; } catch {} await wait(500); }
    const page = targets.find(t => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    const pending = new Map(); let mid = 0;
    ws.onmessage = (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
    await new Promise(r => ws.onopen = r);
    const send = (method, params = {}) => new Promise((res, rej) => { const id = ++mid; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url }); await wait(10000);
    const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
    for (let i = 0; i < 20; i++) { const n = await evalJs(`document.querySelectorAll('a[href^="/products/"]').length`); if (n > 5) break; await wait(1500); }

    const report = await evalJs(`(() => {
      const out = [];
      const txt = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70);
      // Every h2 with the product-card count inside its closest <section>
      const h2s = [...document.querySelectorAll('h2')];
      h2s.forEach(h => {
        const sec = h.closest('section') || h.parentElement;
        const cards = sec ? sec.querySelectorAll('a[href^="/products/"]').length : 0;
        const imgs = sec ? sec.querySelectorAll('img').length : 0;
        out.push({ H2: txt(h), productLinksInSection: cards, imgs });
      });
      out.push({ CHECK: 'brand tiles (/products?brand=)', count: document.querySelectorAll('a[href^="/products?brand="], a[href*="brand="]').length });
      out.push({ CHECK: 'category tiles', count: document.querySelectorAll('a[href^="/categories/"], a[href^="/browse/"]').length });
      out.push({ CHECK: 'buying-guide links', count: document.querySelectorAll('a[href^="/buyers-guide/"], a[href^="/buying-guides/"], a[href^="/post/"], a[href^="/best/"]').length });
      out.push({ CHECK: 'compare links', count: document.querySelectorAll('a[href*="compare"], a[href^="/comparison"]').length });
      out.push({ CHECK: 'countdown visible', count: document.querySelectorAll('[aria-label="Deals countdown"], [class*="countdown"]').length });
      out.push({ CHECK: 'trust strip', count: [...document.querySelectorAll('div')].filter(d => /Free Shipping|Price Drop Alerts|Expert Verified|Secure Checkout/.test(d.textContent) && d.children.length < 6).length });
      out.push({ CHECK: 'hero slides', count: document.querySelectorAll('[class*="hero"] [class*="slide"], section[data-reveal] > div > div > a[href*="amazon"]').length });
      out.push({ CHECK: 'newsletter form', count: document.querySelectorAll('form input[type="email"], form input[name="email"]').length });
      return JSON.stringify(out, null, 1);
    })()`);
    console.log(report);
    ws.close();
  } finally { chrome.kill(); }
}
run().catch(e => { console.error('FAIL', e.message); process.exit(1); });
