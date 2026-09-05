// Tests the SiteStripe affiliate-URL capture in browser-extension/content.js
// against the REAL Amazon "Share affiliate link" popover DOM (T1 enhanced
// flow): Short/Full Link radios + Store/Tracking dropdowns + a "Copy affiliate
// link" button that GENERATES the URL on click.
//
// Run with:  node scripts/test-sitestripe-capture.mjs
// (jsdom must be resolvable — e.g. `npm install --no-save --no-package-lock jsdom`.)

import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

const contentJs = readFileSync(new URL('../browser-extension/content.js', import.meta.url), 'utf8');

const ASIN = 'B0C7XM9W2T'; // arbitrary test ASIN
const DEEP_URL = `https://www.amazon.com/dp/${ASIN}?tag=dawnwire-20&linkCode=ll2&linkId=abc123&language=en_US&ref_=as_li_ss_tl`;
const BARE_URL = `https://www.amazon.com/dp/${ASIN}?tag=dawnwire-20`;
const OTHER_ASIN_URL = `https://www.amazon.com/dp/B0OTHERRRRR?tag=dawnwire-20&linkCode=ll2&ref_=as_li_ss_tl`;

let pass = 0;
let fail = 0;
function assert(name, cond, extra) {
  if (cond) { pass++; console.log('  \u2714', name); }
  else { fail++; console.log('  \u2718 FAIL', name, extra !== undefined ? '-> ' + extra : ''); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Real markup lifted from the SiteStripe "Share affiliate link" popover
// (a-popover-content).  Short Link radio is checked by default; the full URL
// only materialises after the user presses "Copy affiliate link".
function t1PopoverHtml() {
  return `
  <div class="a-popover-inner"><div class="a-popover-content" id="a-popover-content-6">
    <h4>Share affiliate link</h4>
    <div id="amzn-ss-popover-text-preload-content-container">
      <div class="amzn-ss-popupbox aok-clearfix">
        <div class="amzn-ss-store-tag-row">
          <span class="amzn-ss-store-tag-label">Store ID</span>
          <select id="amzn-ss-store-id-dropdown-text"><option value="dawnwire-20">dawnwire-20</option></select>
          <span class="amzn-ss-store-tag-label">Tracking ID</span>
          <select id="amzn-ss-tracking-id-dropdown-text"><option value="dawnwire-20">dawnwire-20</option></select>
        </div>
      </div>
      <div class="amzn-ss-link-format-container">
        <fieldset class="amzn-ss-link-format-fieldset">
          <span class="a-declarative" data-action="amzn-ss-get-link-shortlink" data-amzn-ss-get-link-shortlink="{}">
            <div id="amzn-ss-short-link-radio-button" data-a-input-name="link-type" class="a-radio a-radio-fancy amzn-ss-text-radio-button" aria-checked="true">
              <label><input type="radio" name="link-type" value="" checked="checked" aria-label="Copy the short link">
                <span class="a-label a-radio-label">Short Link</span></label>
            </div>
          </span>
          <span class="a-declarative" data-action="amzn-ss-get-link-fulllink" data-amzn-ss-get-link-fulllink="{}">
            <div id="amzn-ss-full-link-radio-button" data-a-input-name="link-type" class="a-radio a-radio-fancy amzn-ss-text-radio-button" aria-checked="false">
              <label><input type="radio" name="link-type" value="" aria-label="Copy the full link">
                <span class="a-label a-radio-label">Full Link</span></label>
            </div>
          </span>
        </fieldset>
      </div>
      <div class="amzn-ss-copy-affiliate-link-container">
        <span class="a-declarative" data-action="amzn-ss-copy-affiliate-link" data-amzn-ss-copy-affiliate-link="{&quot;popoverContent&quot;:&quot;text&quot;}">
          <span id="amzn-ss-copy-affiliate-link-btn" class="a-button a-button-primary amzn-ss-copy-affiliate-link-btn">
            <span class="a-button-inner"><button id="amzn-ss-copy-affiliate-link-btn-announce" class="a-button-text" type="button">Copy affiliate link</button></span>
          </span>
        </span>
      </div>
      <div id="amzn-ss-copy-toast" style="display:none"><strong>Copied to clipboard</strong></div>
    </div>
  </div></div>`;
}

function makeDom(bodyExtraHtml) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><body><div id="a-page"><input type="hidden" name="ASIN" value="${ASIN}"></div></body></html>${bodyExtraHtml || ''}`,
    { url: `https://www.amazon.com/dp/${ASIN}`, runScripts: 'outside-only', pretendToBeVisual: true }
  );
  const { window } = dom;
  // Minimal chrome mock so content.js's guarded listeners can register.
  window.chrome = { runtime: { onMessage: { addListener() {} } } };
  window.eval(contentJs);
  if (!window.__dawnwireSs) throw new Error('content.js did not expose __dawnwireSs');
  return dom;
}

// Simulate Amazon's generator: clicking the copy button drops the generated
// long URL into a textarea (real SiteStripe also writes it to the clipboard).
function emulateSiteStripeGeneration(window, generatedUrl, state) {
  window.document.addEventListener('click', (e) => {
    const t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    if (t.closest('#amzn-ss-full-link-radio-button input[type="radio"]')) state.fullRadioClicked = true;
    if (t.closest('#amzn-ss-short-link-radio-button input[type="radio"]')) state.shortRadioClicked = true;
    if (t.closest('[data-action="amzn-ss-copy-affiliate-link"], #amzn-ss-copy-affiliate-link-btn-announce')) {
      state.copyClicked = true;
      const ta = window.document.createElement('textarea');
      ta.id = 'amzn-ss-text-fulllink-textarea';
      ta.value = generatedUrl;
      window.document.querySelector('#a-page').appendChild(ta);
    }
  }, true);
}

async function main() {
  const ss = (dom) => dom.window.__dawnwireSs;
  const w = (dom) => dom.window;

  console.log('SiteStripe capture tests (content.js in jsdom)');
  console.log('ASIN:', ASIN);

  // ── 1. Classic toolbar: deep long URL already sitting in a textarea ────────
  {
    console.log('\n[1] Classic toolbar textarea');
    const dom = makeDom(`<textarea class="amzn-ss-text" id="amzn-ss-text-shortlink-textarea">${BARE_URL}</textarea>
      <textarea class="amzn-ss-text" id="amzn-ss-text-fulllink-textarea">${DEEP_URL}</textarea>`);
    const got = ss(dom).captureSiteStripeUrl(ASIN);
    assert('deep (Full Link) URL wins over bare short-link textarea', got === DEEP_URL, got);
    assert('ASIN-independent call also finds it', ss(dom).captureSiteStripeUrl('') === DEEP_URL);
  }

  // ── 2. Bare ?tag= link only → fallback accepted ────────────────────────────
  {
    console.log('\n[2] Bare tagged link fallback');
    const dom = makeDom(`<textarea id="amzn-ss-text-shortlink-textarea">${BARE_URL}</textarea>`);
    assert('bare ?tag= URL captured as fallback', ss(dom).captureSiteStripeUrl(ASIN) === BARE_URL);
  }

  // ── 3. ASIN guard: another product's toolbar link must not leak in ─────────
  {
    console.log('\n[3] ASIN mismatch rejected');
    const dom = makeDom(`<textarea class="amzn-ss-text">${OTHER_ASIN_URL}</textarea>`);
    assert('different-ASIN deep link ignored for this product', ss(dom).captureSiteStripeUrl(ASIN) === '');
    assert('without hint the other link is still found', ss(dom).captureSiteStripeUrl('') === OTHER_ASIN_URL);
  }

  // ── 4. Untagged / non-Amazon URLs rejected ─────────────────────────────────
  {
    console.log('\n[4] Invalid URLs rejected');
    const dom = makeDom(``);
    const { _isTaggedAmazonUrl, _recordSiteStripeUrl, clearCache } = ss(dom);
    assert('no tag → rejected', _isTaggedAmazonUrl(`https://www.amazon.com/dp/${ASIN}`, ASIN) === false);
    assert('non-amazon host → rejected', _isTaggedAmazonUrl('https://example.com/dp/' + ASIN + '?tag=dawnwire-20', ASIN) === false);
    assert('gp/product path accepted', _isTaggedAmazonUrl(`https://www.amazon.com/gp/product/${ASIN}?tag=dawnwire-20`, ASIN) === true);
    assert('wrong ASIN vs hint → rejected', _isTaggedAmazonUrl(OTHER_ASIN_URL, ASIN) === false);
    _recordSiteStripeUrl(`https://evil.example.com/dp/${ASIN}?tag=dawnwire-20`);
    assert('non-Amazon URL never cached', ss(dom).cache === '');
    clearCache();
  }

  // ── 5. Clipboard hook / cache records what SiteStripe copies ───────────────
  {
    console.log('\n[5] Clipboard/cache capture');
    const dom = makeDom(``);
    ss(dom)._recordSiteStripeUrl(DEEP_URL);
    assert('recorded deep URL is returned by capture', ss(dom).captureSiteStripeUrl(ASIN) === DEEP_URL);
    // A later bare link must not downgrade the cached deep link.
    ss(dom)._recordSiteStripeUrl(BARE_URL);
    assert('deep cache beats later bare link', ss(dom).captureSiteStripeUrl(ASIN) === DEEP_URL);
  }

  // ── 6. T1 popover prime: Full Link selected + Copy pressed → deep URL ─────
  {
    console.log('\n[6] Open popover prime (Full Link → Copy)');
    const dom = makeDom(t1PopoverHtml());
    const state = { fullRadioClicked: false, shortRadioClicked: false, copyClicked: false };
    emulateSiteStripeGeneration(w(dom), DEEP_URL, state);
    const fullInput = w(dom).document.querySelector('#amzn-ss-full-link-radio-button input');
    assert('popover starts on Short Link', fullInput.checked === false);
    const started = Date.now();
    const got = await ss(dom).primeSiteStripeFullLink(ASIN, 2500);
    const elapsed = Date.now() - started;
    assert('prime resolves with the deep long link', got === DEEP_URL, got || '(empty)');
    assert('Full Link radio was selected first', state.fullRadioClicked === true);
    assert('Copy affiliate link was pressed', state.copyClicked === true);
    assert('native radio state switched to Full Link', fullInput.checked === true);
    assert('resolved within the 2.5s budget', elapsed < 2500, elapsed + 'ms');
  }

  // ── 7. No popover on page → prime resolves fast with '' ────────────────────
  {
    console.log('\n[7] Popover closed');
    const dom = makeDom(``);
    const started = Date.now();
    const got = await ss(dom).primeSiteStripeFullLink(ASIN, 2500);
    assert('no popover → empty result quickly', got === '' && (Date.now() - started) < 800, got || '(empty)');
  }

  // ── 8. Full-link radio already selected → prime only presses Copy ──────────
  {
    console.log('\n[8] Full Link pre-selected');
    const dom = makeDom(t1PopoverHtml().replace('aria-checked="false"', 'aria-checked="true"'));
    const w8 = w(dom);
    const state = { fullRadioClicked: false, copyClicked: false };
    emulateSiteStripeGeneration(w8, DEEP_URL, state);
    const fullInput = w8.document.querySelector('#amzn-ss-full-link-radio-button input');
    fullInput.checked = true; // user already chose Full Link
    const got = await ss(dom).primeSiteStripeFullLink(ASIN, 2500);
    assert('still resolves with deep URL', got === DEEP_URL, got || '(empty)');
    assert('Copy pressed without re-clicking radio', state.copyClicked === true && state.fullRadioClicked === false);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
