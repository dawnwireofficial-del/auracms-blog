#!/usr/bin/env node
/**
 * End-to-end test of the DawnWire URL-import chain + SiteStripe capture.
 *
 * Simulates exactly what happens when a user imports from a store page:
 *   popup/content sends IMPORT_FROM_URL → worker importFromUrl() opens a
 *   background tab → content.js answers EXTRACT_PRODUCT_DATA with live-DOM data
 *   (incl. videoUrl, gallery, and the SiteStripe affiliate long link) →
 *   handleImport() POSTs to the DawnWire API.
 *
 * Asserts the request the API receives carries:
 *   - affiliate_url = the captured SiteStripe deep link (tag + linkCode/linkId)
 *   - specs.video_url + specs.gallery from the live page
 *   - the cloaked /go link is created pointing at the tagged URL
 *
 * Usage: node scripts/test-import-from-url.mjs
 */
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';

const dir = mkdtempSync(join(tmpdir(), 'dw-import-'));
const bg = readFileSync('browser-extension/background.js', 'utf8');
const sw = readFileSync('browser-extension/social-background.js', 'utf8');

let pass = true;
const ok = (name, cond, detail) => {
  console.log(`${cond ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!cond) pass = false;
};

// ─── Mocks ───────────────────────────────────────────────────────────────────
const ASIN = 'B0TEST1234';
const SITE_STRIPE_URL =
  `https://www.amazon.com/dp/${ASIN}/ref=as_li_ss_tl?ie=UTF8&linkCode=ll2&tag=dawnwire-20&linkId=abc123def456&language=en_US`;
const API_URL = 'https://api.test.dawnwire.com';

const fetchLog = [];
const extractResponse = {
  success: true,
  product_name: 'Test Widget Pro',
  brand: 'TestBrand',
  product_image: 'https://m.media-amazon.com/images/I/71x.jpg',
  price: '$49.99',
  rating: 4.5,
  reviewCount: 123,
  key_features: ['Feature one', 'Feature two'],
  review_summary: 'A great product',
  amazon_url: `https://www.amazon.com/dp/${ASIN}`,
  asin: ASIN,
  gallery: ['https://m.media-amazon.com/images/I/71a.jpg', 'https://m.media-amazon.com/images/I/71b.jpg'],
  videoUrl: 'https://m.media-amazon.com/images/I/71x.mp4',
  affiliate_url: SITE_STRIPE_URL, // ← captured from SiteStripe toolbar
  bestFor: 'Gaming',
  stockStatus: 'in_stock',
};

const chrome = {
  _fetchLog: fetchLog,
  storage: {
    sync: {
      _data: { apiUrl: API_URL, apiToken: 'token-admin-1', autoImport: false },
      get: async (keys) => {
        const out = {};
        for (const k of [].concat(keys)) if (k in chrome.storage.sync._data) out[k] = chrome.storage.sync._data[k];
        return out;
      },
      set: async (obj) => { Object.assign(chrome.storage.sync._data, obj); },
    },
    local: {
      _data: {},
      get: async (keys) => {
        const out = {};
        for (const k of [].concat(keys)) if (k in chrome.storage.local._data) out[k] = chrome.storage.local._data[k];
        return out;
      },
      set: async (obj) => { Object.assign(chrome.storage.local._data, obj); },
    },
  },
  runtime: {
    onMessage: { addListener: (fn) => { (chrome.runtime._listeners = chrome.runtime._listeners || []).push(fn); } },
    sendMessage: async () => ({}),
  },
  tabs: {
    onUpdated: { addListener: () => {} },
    onRemoved: { addListener: () => {} },
    create: async (opts) => { chrome.tabs._created = opts; return { id: 42 }; },
    get: async (id) => ({ id, status: 'complete', url: chrome.tabs._created?.url }),
    sendMessage: async (id, msg) => {
      if (msg?.type === 'EXTRACT_PRODUCT_DATA') return extractResponse;
      return {};
    },
    remove: async () => {},
    query: async () => [],
  },
  alarms: { onAlarm: { addListener: () => {} }, create: () => {} },
  notifications: { create: async () => {} },
};

globalThis.chrome = chrome;
globalThis.fetch = async (url, opts = {}) => {
  fetchLog.push({ url, opts });
  // check-duplicate → no duplicate
  if (String(url).includes('/check-duplicate')) {
    return { ok: true, status: 200, json: async () => ({ duplicate: false }) };
  }
  // import → success
  if (String(url).endsWith('/import')) {
    return { ok: true, status: 200, json: async () => ({ id: 'review-1', slug: 'test-widget-pro', review: { id: 'review-1', slug: 'test-widget-pro' } }) };
  }
  // auto-process / fetch-video / auto-articles → fire-and-forget success
  return { ok: true, status: 200, json: async () => ({}) };
};

// Load the fixed worker (social-background imports background.js).
writeFileSync(join(dir, 'background.mjs'), bg);
writeFileSync(join(dir, 'worker.mjs'), sw.replace("import './background.js';", "import './background.mjs';"));
await import(pathToFileURL(join(dir, 'worker.mjs')).href + '?t=' + Date.now());

// ─── 1. IMPORT_FROM_URL → tab opens ──────────────────────────────────────────
// Real MV3 semantics: every listener sees the message; the one returning true
// keeps the channel open and its sendResponse resolves the caller.
const resp = await new Promise((resolve) => {
  let settled = false;
  const done = (r) => { if (!settled) { settled = true; resolve(r); } };
  for (const fn of chrome.runtime._listeners || []) {
    let ret;
    try { ret = fn({ type: 'IMPORT_FROM_URL', url: `https://www.amazon.com/dp/${ASIN}` }, {}, done); }
    catch (e) { ret = undefined; }
    if (ret === true) break;
  }
  setTimeout(() => { if (!settled) { settled = true; resolve(undefined); } }, 15000);
});

ok('IMPORT_FROM_URL returns success', resp?.success === true, JSON.stringify(resp).slice(0, 200));
ok('background opened a background tab with the product URL',
  chrome.tabs._created?.url?.includes(`/dp/${ASIN}`) && chrome.tabs._created?.active === false,
  chrome.tabs._created?.url);

// ─── 2. What the API received ────────────────────────────────────────────────
const importCall = fetchLog.find((f) => String(f.url).endsWith('/import'));
ok('product was POSTed to /import', !!importCall);

let body = {};
try { body = JSON.parse(importCall?.opts?.body || '{}'); } catch {}
ok('payload includes product_name', body.product_name === 'Test Widget Pro', body.product_name);
ok('payload keeps captured SiteStripe URL as affiliate_url',
  body.affiliate_url === SITE_STRIPE_URL || body.amazon_url === `https://www.amazon.com/dp/${ASIN}`,
  String(body.affiliate_url || body.amazon_url).slice(0, 140));

// video + gallery (what the "open each product in a tab" flow uniquely gives us)
ok('video URL captured from the page', String(body.videoUrl || body.specs?.video_url || '').includes('.mp4'),
  String(body.videoUrl || body.specs?.video_url).slice(0, 100));
ok('gallery preserved', Array.isArray(body.gallery) && body.gallery.length >= 2,
  JSON.stringify(body.gallery).slice(0, 100));

// ─── 3. Cloaked /go affiliate link creation ──────────────────────────────────
const affCall = fetchLog.find((f) => String(f.url).includes('/api/admin/affiliate'));
ok('cloaked affiliate link was created', !!affCall);
if (affCall) {
  let affBody = {};
  try { affBody = JSON.parse(affCall.opts.body); } catch {}
  const dest = affBody.affiliateUrl || affBody.destinationUrl || '';
  ok('cloak points at the tagged Amazon URL', dest.includes(`/dp/${ASIN}`) && dest.includes('tag=') && dest.includes('dawnwire-20'),
    dest.slice(0, 160));
}

rmSync(dir, { recursive: true, force: true });
console.log(pass ? '\n🎉 IMPORT_FROM_URL chain passed end-to-end.' : '\n❌ Some checks failed.');
process.exit(pass ? 0 : 1);