#!/usr/bin/env node
/**
 * MV3 service-worker message harness — proves the import regression and its fix.
 *
 * Loads browser-extension/social-background.js (the registered MV3 worker) and
 * browser-extension/background.js (import-queue handlers) as ES modules inside a
 * mocked `chrome` runtime, then dispatches real extension messages:
 *
 *   - scenario B (current code, "broken"): ONLY social-background.js is loaded,
 *     like the manifest today → IMPORT_PRODUCT must NOT be handled (this is the
 *     regression content.js hits on store pages).
 *   - scenario A (fixed): social-background.js ALSO imports ./background.js →
 *     IMPORT_PRODUCT / IMPORT_BATCH / GET_QUEUE_STATUS must be handled, while
 *     AUTO_PIN_PRODUCT keeps working.
 *
 * Usage: node scripts/test-extension-worker.mjs
 */
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const extDir = join(__dirname, '..', 'browser-extension');

// ─── Mock chrome ────────────────────────────────────────────────────────────
function makeChromeMock() {
  const listeners = [];
  const storageMap = new Map(); // sync + local share a store for simplicity

  const storage = {
    get: async (keys) => {
      const out = {};
      const arr = Array.isArray(keys) ? keys : [keys];
      for (const k of arr) if (storageMap.has(k)) out[k] = storageMap.get(k);
      return out;
    },
    set: async (obj) => { for (const [k, v] of Object.entries(obj)) storageMap.set(k, v); },
  };

  const mock = {
    _listeners: listeners,
    storage: { sync: storage, local: storage },
    runtime: {
      onMessage: { addListener: (fn) => listeners.push(fn) },
      sendMessage: async (msg) => {
        // Notify the popup/content-script side; used by notifyQueueStatus.
        const resp = dispatch(msg, { id: 'tab-1' });
        return resp !== undefined ? resp : {};
      },
    },
    tabs: {
      onUpdated: { addListener: () => {} },
      onRemoved: { addListener: () => {} },
      sendMessage: async () => ({}),
      create: async (opts) => ({ id: 999, ...opts }),
      remove: async () => {},
      get: async (id) => ({ id, status: 'complete', url: 'https://www.amazon.com/dp/B0TEST' }),
      query: async () => [],
    },
    alarms: {
      onAlarm: { addListener: () => {} },
      create: () => {},
    },
    notifications: { create: async () => 'n1' },
  };

  // Real MV3 semantics: listeners are invoked in registration order; the channel
  // stays open for the first listener that returns true, and its sendResponse
  // (sync or async) resolves the caller's promise. We approximate that: try each
  // listener until one returns true or calls sendResponse synchronously, then
  // wait for its async response.
  function dispatch(message, sender, timeoutMs = 8000) {
    return new Promise((resolve) => {
      let settled = false;
      const sendResponse = (resp) => { if (!settled) { settled = true; resolve(resp); } };
      for (const fn of [...listeners]) {
        let ret;
        try { ret = fn(message, sender || {}, sendResponse); } catch (e) { ret = undefined; }
        if (ret === true) {
          // Async response expected via sendResponse; fall through to timeout.
          break;
        }
        if (settled) return; // sync sendResponse happened
      }
      // No listener returned true → MV3 rejects with "message port closed".
      setTimeout(() => {
        if (!settled) { settled = true; resolve(undefined); }
      }, timeoutMs);
    });
  }
  mock._dispatch = dispatch;
  return mock;
}

// ─── Load a JS file as an ES module (copy to a .mjs temp file) ──────────────
async function loadAsModule(srcPath, rewrite) {
  const dir = mkdtempSync(join(tmpdir(), 'dw-ext-'));
  const dest = join(dir, 'worker.mjs');
  let code = readFileSync(srcPath, 'utf8');
  if (rewrite) code = rewrite(code);
  writeFileSync(dest, code);
  const mod = await import(pathToFileURL(dest).href + '?t=' + Date.now());
  rmSync(dir, { recursive: true, force: true });
  return mod;
}

const bgCode = readFileSync(join(extDir, 'background.js'), 'utf8');
const swCode = readFileSync(join(extDir, 'social-background.js'), 'utf8');

function results(name, ok, detail) {
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  return ok;
}

let allPass = true;

// ─── Scenario B: today's manifest (social-background.js ONLY) ────────────────
{
  console.log('\n=== Scenario B: registered worker WITHOUT background.js (pre-fix) ===');
  const chrome = makeChromeMock();
  globalThis.chrome = chrome;
  globalThis.fetch = async () => { throw new Error('should not fetch (no apiToken)'); };
  const swNoImport = swCode.replace(/import\s+'\.\/background\.js';\s*\n/, '');
  await loadAsModule(join(extDir, 'social-background.js'), () => swNoImport);

  const importResp = await chrome._dispatch({ type: 'IMPORT_PRODUCT', data: { product_name: 'Test' } }, {});
  allPass = results(
    'IMPORT_PRODUCT handled',
    importResp !== undefined,
    importResp ? JSON.stringify(importResp).slice(0, 80) : 'no listener responded (regression confirmed)',
  );
}

// ─── Scenario A: fixed worker (social-background.js + imported background.js) ─
{
  console.log('\n=== Scenario A: fixed worker WITH background.js import ===');
  const chrome = makeChromeMock();
  globalThis.chrome = chrome;
  globalThis.fetch = async () => { throw new Error('should not fetch (no apiToken)'); };
  // Write both into one temp dir so the relative import resolves.
  const dir = mkdtempSync(join(tmpdir(), 'dw-ext-'));
  writeFileSync(join(dir, 'background.mjs'), bgCode);
  const swFixed = swCode.replace("import './background.js';", "import './background.mjs';");
  writeFileSync(join(dir, 'worker.mjs'), swFixed);
  const modUrl = pathToFileURL(join(dir, 'worker.mjs')).href;
  await import(modUrl + '?t=' + Date.now());

  // 1. IMPORT_PRODUCT → background.js handleImport → no apiToken → error object.
  const importResp = await chrome._dispatch({ type: 'IMPORT_PRODUCT', data: { product_name: 'Test', asin: 'B0TEST' } }, {});
  allPass = results(
    'IMPORT_PRODUCT handled',
    importResp !== undefined && importResp.success === false && /token/i.test(importResp.error || ''),
    JSON.stringify(importResp).slice(0, 100),
  );

  // 2. IMPORT_BATCH → addToQueue → queued count.
  const batchResp = await chrome._dispatch({ type: 'IMPORT_BATCH', products: [{ product_name: 'A' }, { product_name: 'B' }] }, { id: 'tab-1' });
  allPass = results('IMPORT_BATCH handled', batchResp && batchResp.queued === 2, JSON.stringify(batchResp));

  // 3. GET_QUEUE_STATUS → shape check.
  const statusResp = await chrome._dispatch({ type: 'GET_QUEUE_STATUS' }, {});
  allPass = results(
    'GET_QUEUE_STATUS handled',
    statusResp && typeof statusResp.queueLength === 'number' && Array.isArray(statusResp.items),
    JSON.stringify(statusResp && { queueLength: statusResp.queueLength, pending: statusResp.pending }),
  );

  // 4. AUTO_PIN_PRODUCT (social worker) still works without creds.
  const pinResp = await chrome._dispatch({ type: 'AUTO_PIN_PRODUCT', data: { title: 'Test Product', product_name: 'Test' } }, {});
  allPass = results(
    'AUTO_PIN_PRODUCT still handled',
    pinResp !== undefined && pinResp.success === false && /Pinterest credentials/i.test(pinResp.error || ''),
    JSON.stringify(pinResp).slice(0, 100),
  );

  // 5. TEST_CONNECTION handled (no token → error object).
  const testResp = await chrome._dispatch({ type: 'TEST_CONNECTION' }, {});
  allPass = results('TEST_CONNECTION handled', testResp !== undefined, JSON.stringify(testResp).slice(0, 100));

  rmSync(dir, { recursive: true, force: true });
}

console.log(allPass ? '\n🎉 All worker message checks passed.' : '\n❌ Some checks failed.');
process.exit(allPass ? 0 : 1);