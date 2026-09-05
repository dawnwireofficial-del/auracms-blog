(function () {
  if (window.__dawnwireInjected) return;
  window.__dawnwireInjected = true;

  const SITE = window.location.hostname.toLowerCase();

  function sendMessage(msg) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      return chrome.runtime.sendMessage(msg);
    }
    return fallbackImport(msg.data);
  }

  // Full product payload for a reimport — refreshes reviews, images, specs, ASIN,
  // price, rating etc. on the existing row instead of only patching a few fields.
  async function fullImportPayload(data) {
    const specs = {
      ...(data.specs || {}),
      asin: data.asin || '',
      source: data.source || (data.amazon_url && data.amazon_url.includes('amazon.') ? 'amazon' : 'other'),
    };
    if (data.gallery && data.gallery.length) specs.gallery = data.gallery;
    if (data.reviews && data.reviews.length) specs.reviews = data.reviews;
    if (data.reviewStats) specs.review_stats = data.reviewStats;
    if (data.ingredients) specs.ingredients = data.ingredients;
    if (data.unitSize) specs.unit_size = data.unitSize;
    if (data.unitPrice) specs.unit_price = data.unitPrice;
    if (data.bsrDetail && data.bsrDetail.length) specs.best_sellers_rank_detail = data.bsrDetail;
    if (data.reviewHighlights) specs.review_highlights = data.reviewHighlights;
    if (data.detailBullets && Object.keys(data.detailBullets).length) specs.detail_bullets = data.detailBullets;
    if (data.listPrice) specs.listPrice = data.listPrice;
    if (data.savings) specs.savings = data.savings;
    if (data.priceRange) specs.priceRange = data.priceRange;
    if (data.videoUrl) specs.video_url = data.videoUrl;
    // Commission-tracking params per store network (falls back to Amazon tag)
    const storeKey = data.source || (data.amazon_url && data.amazon_url.includes('amazon.') ? 'amazon' : 'other');
    let params = {};
    try {
      const stored = await chromeStorageGet();
      params = stored.affiliateParams || {};
    } catch (e) { /* ignore */ }
    // If a real SiteStripe deep link was captured on the page, keep it (it has
    // tag + linkCode/linkId/pd_rd_ tokens); otherwise mint from amazon_url.
    const affUrl = applyAffiliateParams(
      (data.affiliate_url && data.affiliate_url.includes('tag=')) ? data.affiliate_url : (data.amazon_url || null),
      storeKey,
      params
    );
    return {
      product_name: data.product_name || null,
      brand: data.brand || null,
      product_image: data.product_image || null,
      affiliate_url: affUrl,
      price: data.price || null,
      original_price: data.listPrice || null,
      rating: data.rating || 0,
      review_count: data.reviewCount || null,
      stock_status: data.stockStatus || 'in_stock',
      deal_badge: data.dealBadge || null,
      coupon_code: data.couponCode || null,
      best_for: data.bestFor || data.best_for || null,
      status: 'published',
      review_summary: data.review_summary || null,
      key_features: data.key_features || [],
      pros: data.pros || [],
      cons: data.cons || [],
      gallery: data.gallery || [],
      specs,
    };
  }

  async function fallbackImport(data) {
    const { apiUrl, apiToken } = await chromeStorageGet();
    if (!apiToken) return { success: false, error: 'API token not configured. Open extension popup to set it up.' };
    const baseUrl = (apiUrl || 'https://www.dawnwire.com').replace(/\/$/, '');
    try {
      // Check for duplicates first
      if (data.asin) {
        try {
          const dupRes = await fetch(baseUrl + '/api/admin/seo/product-reviews/check-duplicate?asin=' + encodeURIComponent(data.asin), { headers: { 'Authorization': 'Bearer ' + apiToken } });
          if (dupRes.ok) {
            const dupData = await dupRes.json();
            if (dupData && dupData.duplicate && dupData.id) {
              // Update existing product with the FULL fresh data (reviews, new
              // images/gallery, specs, ASIN, price...) so reimports stay current.
              const updRes = await fetch(baseUrl + '/api/admin/seo/product-reviews/' + dupData.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken },
                body: JSON.stringify(await fullImportPayload(data))
              });
              const updResult = await updRes.json();
              if (updRes.ok) {
                const updId = updResult.id || updResult.review?.id;
                if (updId && data.asin) { try { await fetch(baseUrl + '/api/admin/seo/product-reviews/fetch-video/' + updId, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken } }); } catch (e) { console.error('[DawnWire]', e); } }
                return { success: true, review: updResult, id: updId, updated: true };
              }
            }
          }
        } catch (e) { console.error('[DawnWire] duplicate check failed:', e); }
      }
      const res = await fetch(baseUrl + '/api/admin/seo/product-reviews/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken },
        body: JSON.stringify({ ...data })
      });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error || 'HTTP ' + res.status };
      const id = result.id || result.review?.id;
      let affiliateLink = null;
      const affLinkUrl = (data.affiliate_url && data.affiliate_url.includes('tag='))
        ? data.affiliate_url
        : (data.amazon_url || data.affiliate_url || '');
      if (id && affLinkUrl) {
        try {
          const slug = data.asin || result.slug || 'product-' + Date.now();
          const affRes = await fetch(baseUrl + '/api/admin/affiliate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken },
            body: JSON.stringify({ title: (data.product_name || '').substring(0, 100), affiliate_url: affLinkUrl, short_slug: slug, button_text: 'Check Price', status: 'active', no_follow: true, sponsored: true, open_in_new_tab: true })
          });
          if (affRes.ok) { const affData = await affRes.json(); affiliateLink = '/go/' + (affData.short_slug || affData.slug || slug); }
        } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
      }
      if (id && data.asin) { try { await fetch(baseUrl + '/api/admin/seo/product-reviews/fetch-video/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken } }); } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ } }
      if (id) { try { await fetch(baseUrl + '/api/admin/seo/auto-articles/generate/' + id, { method: 'POST', headers: { 'Authorization': 'Bearer ' + apiToken } }); } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ } }
      return { success: true, review: result, id, affiliateLink, generatedArticle: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async function chromeStorageGet() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        return await chrome.storage.sync.get(['apiUrl', 'apiToken', 'affiliateParams']);
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    try {
      const apiUrl = localStorage.getItem('dw_api_url') || '';
      const apiToken = localStorage.getItem('dw_api_token') || '';
      if (apiToken) return { apiUrl, apiToken };
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return { apiUrl: '', apiToken: '' };
  }

  // Shared affiliate-parameter logic (kept in sync with background.js)
  function applyAffiliateParams(rawUrl, source, params) {
    if (!rawUrl) return null;
    const cfg = (params && params[source]) || null;
    if (source === 'amazon' || /amazon\./.test(rawUrl)) {
      const tag = (cfg && cfg.tag) || 'dawnwire-20';
      if (rawUrl.includes('tag=')) return rawUrl.replace(/tag=[^&]+/, 'tag=' + encodeURIComponent(tag));
      return rawUrl + (rawUrl.includes('?') ? '&' : '?') + 'tag=' + encodeURIComponent(tag);
    }
    if (!cfg || !cfg.suffix) return rawUrl;
    return rawUrl + (rawUrl.includes('?') ? '&' : '?') + cfg.suffix;
  }

  // ─── SiteStripe affiliate URL capture ──────────────────────────────────────
  // When the user is logged into Amazon Associates, SiteStripe shows the
  // product's affiliate link in a toolbar / "Share affiliate link" popover.
  // Two layouts exist:
  //   • Classic: the link already sits in a textarea on the page (#stripeNav).
  //   • New T1 popover (id="amzn-ss-…"): radios for Short/Full Link + a
  //     "Copy affiliate link" button that GENERATES the URL on click (fills a
  //     textarea + writes the clipboard).
  // So we capture from (a) any textarea/input already holding a tagged URL,
  // (b) a clipboard hook that records what SiteStripe copies, and (c) an
  // active "prime" that selects Full Link + presses Copy when the popover is
  // open. The imported product then keeps the REAL deep link (tag + linkCode /
  // linkId / pd_rd_ tokens) instead of a bare ?tag= URL we mint ourselves.
  let _dwSsCache = '';
  let _dwSsHooksInstalled = false;

  function _isTaggedAmazonUrl(u, asinHint) {
    if (!/^https?:\/\//i.test(u || '')) return false;
    if (!/amazon\.[a-z.]+(\/|$)/i.test(u)) return false;
    const m = String(u).match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (!m) return false;
    if (!u.includes('tag=')) return false;
    if (asinHint && m[1].toUpperCase() !== String(asinHint).toUpperCase()) return false;
    return true;
  }
  function _isDeepAffiliateUrl(u) { return /(linkCode=|linkId=|pd_rd_|ref_=as_li)/.test(u || ''); }

  function _recordSiteStripeUrl(u) {
    const t = String(u || '').trim();
    if (!_isTaggedAmazonUrl(t, '')) return;
    // Keep the best candidate: a genuine deep (full) link beats a bare ?tag=
    // link; otherwise the newest capture wins (user may switch product).
    if (!_dwSsCache) { _dwSsCache = t; return; }
    const newDeep = _isDeepAffiliateUrl(t);
    const curDeep = _isDeepAffiliateUrl(_dwSsCache);
    if (newDeep && !curDeep) _dwSsCache = t;
    else if (newDeep === curDeep) _dwSsCache = t;
  }

  // Re-scan every tagged Amazon URL currently on the page into the cache.
  function _scanSiteStripeDom() {
    try {
      const els = document.querySelectorAll('textarea, input[type="text"], input[type="url"], input:not([type]), a[href*="tag="]');
      for (const el of els) {
        const v = el.value || el.textContent || el.getAttribute('href') || '';
        for (const raw of (String(v).match(/https?:\/\/[^\s"'<>]+/gi) || [])) {
          const u = raw.replace(/[),.;]+$/, '');
          if (_isTaggedAmazonUrl(u, '')) _recordSiteStripeUrl(u);
        }
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
  }

  function _installSiteStripeHooks() {
    if (_dwSsHooksInstalled) return;
    _dwSsHooksInstalled = true;
    try {
      // 1) Clipboard hook — the popover's "Copy affiliate link" writes the
      // exact generated URL through navigator.clipboard.writeText. Record it.
      if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
        navigator.clipboard.writeText = (text) => {
          try { _recordSiteStripeUrl(text); } catch (e) { console.error('[DawnWire]', e); /* toasts removed */ }
          return orig(text);
        };
      }
      // 2) After SiteStripe generates a link it drops a textarea/input into the
      // popover — re-scan briefly after any copy / format-selection click.
      document.addEventListener('click', (ev) => {
        const t = ev.target;
        const hit = t && t.closest && t.closest('#stripeNav, [class*="amzn-ss"], [class*="stripe"], [data-action*="amzn-ss"]');
        if (!hit) return;
        const started = Date.now();
        const poll = setInterval(() => {
          _scanSiteStripeDom();
          if (_dwSsCache || Date.now() - started > 2500) clearInterval(poll);
        }, 150);
      }, true);
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
  }

  // Actively ask the open SiteStripe popover for the FULL (deep) link: select
  // the "Full Link" radio and press "Copy affiliate link", then read whatever
  // Amazon drops into the page (textarea / clipboard hook). Resolves with the
  // deep link for this ASIN or '' when the popover isn't available.
  function primeSiteStripeFullLink(asinHint, maxWaitMs) {
    return new Promise((resolve) => {
      try {
        if (!isAmazon()) return resolve('');
        _installSiteStripeHooks();
        _scanSiteStripeDom();
        const fullRadio = document.querySelector('#amzn-ss-full-link-radio-button, [data-action="amzn-ss-get-link-fulllink"]');
        const copyBtn = document.querySelector('#amzn-ss-copy-affiliate-link-btn-announce, [data-action="amzn-ss-copy-affiliate-link"]');
        if (!fullRadio && !copyBtn) return resolve(captureSiteStripeUrl(asinHint));
        // Default radio is "Short Link" — switch to Full Link so the captured
        // URL carries linkCode/linkId/pd_rd_ tokens (the long link).
        if (fullRadio) {
          const radioInput = fullRadio.querySelector && fullRadio.querySelector('input[type="radio"]');
          const fullChecked = (fullRadio.getAttribute && fullRadio.getAttribute('aria-checked') === 'true')
            || (document.querySelector('#amzn-ss-full-link-radio-button[aria-checked="true"]'));
          try {
            if (radioInput) { if (!radioInput.checked) radioInput.click(); }
            else if (!fullChecked && fullRadio.click) fullRadio.click();
          } catch (e) { console.error('[DawnWire]', e); /* toasts removed */ }
        }
        // No link visible yet → pressing Copy makes Amazon generate + expose it.
        if (copyBtn && !captureSiteStripeUrl(asinHint)) {
          // Click the native button when present (bubbles to the
          // [data-action="amzn-ss-copy-affiliate-link"] handler); fall back to
          // clicking the data-action wrapper itself in other layouts.
          const btn = document.querySelector('#amzn-ss-copy-affiliate-link-btn-announce, [data-action="amzn-ss-copy-affiliate-link"]');
          try { if (btn && btn.click) btn.click(); } catch (e) { console.error('[DawnWire]', e); /* toasts removed */ }
        }
        const deadline = Date.now() + (maxWaitMs || 3000);
        const poll = setInterval(() => {
          const got = captureSiteStripeUrl(asinHint);
          if (got || Date.now() > deadline) { clearInterval(poll); resolve(got); }
        }, 150);
      } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ resolve(''); }
    });
  }

  function captureSiteStripeUrl(asinHint) {
    try {
      _installSiteStripeHooks();
      _scanSiteStripeDom();
      const tokens = [];
      const collect = (v) => {
        const s = (v || '').trim();
        if (s) tokens.push(s);
      };
      // SiteStripe link boxes (classic textarea + T1 popover) + any text/URL
      // input on the page.
      document.querySelectorAll('#amzn-ss-text-shortlink-textarea, #amzn-ss-text-fulllink-textarea, [class*="amzn-ss-text"], textarea, input[type="text"], input[type="url"], input:not([type])').forEach((el) => {
        collect(el.value || el.textContent);
      });
      // Anchors that already carry a tag (e.g. toolbar-generated links).
      document.querySelectorAll('a[href*="tag="]').forEach((a) => collect(a.getAttribute('href')));
      // Elements whose visible text is a URL (toolbar may render it in a div).
      document.querySelectorAll('[class*="amzn-ss"], [class*="stripe"], #stripeNav a, #stripeNav input').forEach((el) => {
        collect(el.value || el.textContent || el.getAttribute('href'));
      });
      // Anything SiteStripe copied/generated earlier in this page session.
      if (_dwSsCache) tokens.unshift(_dwSsCache);

      const urlTokenRe = /https?:\/\/[^\s"'<>]+/gi;
      const asinMatch = (u) => { const m = u.match(/(?:dp|gp\/product)\/([A-Z0-9]{10})/i); return m ? m[1] : ''; };
      let best = '';
      for (const raw of tokens) {
        for (const t of (raw.match(urlTokenRe) || [])) {
          const u = t.replace(/[),.;]+$/, '');
          if (!_isTaggedAmazonUrl(u, asinHint)) continue;
          // Only accept the CURRENT product's link (toolbar links for other
          // products on the page must not leak in).
          if (asinHint && asinMatch(u).toUpperCase() !== asinHint.toUpperCase()) continue;
          const isDeep = _isDeepAffiliateUrl(u);
          if (isDeep) return u; // genuine SiteStripe long link wins
          if (!best) best = u;
        }
      }
      return best;
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ return ''; }
  }

  // Expose the SiteStripe capture helpers (debugging + automated tests).
  try {
    if (!window.__dawnwireSs) window.__dawnwireSs = {};
    Object.assign(window.__dawnwireSs, {
      captureSiteStripeUrl,
      primeSiteStripeFullLink,
      _isTaggedAmazonUrl,
      _isDeepAffiliateUrl,
      _recordSiteStripeUrl,
      get cache() { return _dwSsCache; },
      clearCache() { _dwSsCache = ''; },
    });
  } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }

  function isAmazon() { return SITE.includes('amazon.'); }
  function isWalmart() { return SITE.includes('walmart.'); }
  function isBestBuy() { return SITE.includes('bestbuy.'); }
  function isAliExpress() { return SITE.includes('aliexpress.'); }
  function isEbay() { return SITE.includes('ebay.'); }

  function isProductPage() {
    if (isAmazon()) return !!document.getElementById('productTitle');
    if (isWalmart()) return !!document.querySelector('[data-testid="product-title"], .prod-title');
    if (isBestBuy()) return !!document.querySelector('.sku-title, [data-testid="product-title"]');
    if (isAliExpress()) return !!document.querySelector('.product-title, [data-pl="product-title"]');
    if (isEbay()) return !!document.querySelector('.it-ttl, [data-testid="x-item-title"]');
    return false;
  }

  function isSearchPage() {
    if (isAmazon()) return !!document.querySelector('[data-component-type="s-search-result"]');
    if (isWalmart()) return !!document.querySelector('[data-testid="item-grid"] [data-item-id], .search-result-item');
    if (isBestBuy()) return !!document.querySelector('.sku-item, [data-testid="product-card"]');
    if (isAliExpress()) return !!document.querySelector('[data-qa="search-result-item"], .item-content');
    if (isEbay()) return !!document.querySelector('.s-item, [data-testid="item-card"]');
    return false;
  }

  function isBrandStorePage() {
    if (isAmazon()) return !!document.querySelector('#storefront-root, #brandStore, #a-page[data-brand]');
    return false;
  }

  function isWishlistPage() {
    if (isAmazon()) return !!document.querySelector('#wl-list, #g-items, [data-list-id]');
    return false;
  }

  function extractStockStatus(doc) {
    doc = doc || document;
    try {
      if (isAmazon()) {
        const availability = doc.getElementById('availability');
        if (availability) {
          const text = availability.textContent.toLowerCase();
          if (text.includes('in stock')) return 'in_stock';
          if (text.includes('only')) return 'low_stock';
          if (text.includes('currently unavailable') || text.includes('out of stock')) return 'out_of_stock';
          if (text.includes('limited')) return 'limited';
        }
      }
      if (isWalmart()) {
        const el = doc.querySelector('[data-testid="fulfillment-add-to-cart"], .prod-ProductOffer-fulfillment');
        if (el) {
          const t = el.textContent.toLowerCase();
          if (t.includes('in stock') || t.includes('ships')) return 'in_stock';
          if (t.includes('out of stock')) return 'out_of_stock';
        }
      }
      if (isBestBuy()) {
        const el = doc.querySelector('.fulfillment-add-to-cart-button, [data-button-state]');
        if (el) {
          const state = el.getAttribute('data-button-state') || el.textContent.toLowerCase();
          if (state.includes('add to cart') || state.includes('addtocart')) return 'in_stock';
          if (state.includes('sold out') || state.includes('coming soon')) return 'out_of_stock';
        }
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return 'in_stock';
  }

  // BSR extraction (Amazon-specific)
  function extractBestSellersRank(doc) {
    doc = doc || document;
    try {
      const tables = doc.querySelectorAll('#productDetails_detailBullets_sections1 tr, #detailBullets_feature_div .a-list-item');
      for (const row of tables) {
        const label = row.querySelector('th, .a-text-bold')?.textContent || '';
        if (label.includes('Best Sellers Rank')) {
          return row.querySelector('td, span:not(.a-text-bold)')?.textContent?.trim().substring(0, 200) || '';
        }
      }
      const el = doc.querySelector('[class*="bestSeller"]');
      if (el) return el.textContent.trim().substring(0, 200);
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return '';
  }

  function extractCategory(doc) {
    doc = doc || document;
    try {
      if (isAmazon()) {
        const crumbs = doc.querySelectorAll('#wayfinding-breadcrumbs_feature_div ul.a-unordered-list li a, #breadcrumb ul li a, .a-breadcrumb li a');
        const categories = Array.from(crumbs).map(el => el.textContent.trim()).filter(Boolean);
        if (categories.length > 0) return categories[categories.length - 1];
        const dept = doc.querySelector('#departments span, .nav-b a[href*="node="]');
        if (dept) return dept.textContent.trim();
      }
      if (isWalmart()) {
        const crumbs = doc.querySelectorAll('.breadcrumb a, [data-testid="breadcrumb"] a');
        const cats = Array.from(crumbs).map(el => el.textContent.trim()).filter(Boolean);
        if (cats.length > 0) return cats[cats.length - 1];
      }
      if (isBestBuy()) {
        const crumbs = doc.querySelectorAll('.breadcrumb a, [data-testid="breadcrumb"] a');
        const cats = Array.from(crumbs).map(el => el.textContent.trim()).filter(Boolean);
        if (cats.length > 0) return cats[cats.length - 1];
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return '';
  }

  // Category -> best_for mapping
  function mapCategoryToBestFor(category) {
    const cat = (category || '').toLowerCase();
    const map = {
      'gaming': 'Gaming',
      'video game': 'Gaming',
      'electronics': 'Tech',
      'computer': 'Office & Tech',
      'laptop': 'Office & Tech',
      'software': 'Tech',
      'phone': 'Tech',
      'smartphone': 'Tech',
      'tablet': 'Tech',
      'headphone': 'Tech',
      'speaker': 'Tech',
      'audio': 'Tech',
      'fitness': 'Fitness',
      'exercise': 'Fitness',
      'sport': 'Sports & Outdoors',
      'outdoor': 'Sports & Outdoors',
      'kitchen': 'Home & Kitchen',
      'home': 'Home & Kitchen',
      'office': 'Office & Tech',
      'tool': 'Home & Kitchen',
      'automotive': 'Automotive',
      'car': 'Automotive',
      'baby': 'Baby Care',
      'toy': 'Toys & Games',
      'game': 'Toys & Games',
      'book': 'Books',
      'kindle': 'Books',
      'cloth': 'Clothing',
      'shoe': 'Shoes',
      'jewelry': 'Jewelry',
      'watch': 'Watches',
      'beauty': 'Beauty & Personal Care',
      'personal care': 'Beauty & Personal Care',
      'health': 'Health & Wellness',
      'pet': 'Pet Supplies',
      'grocery': 'Grocery',
      'food': 'Grocery',
      'music': 'Musical Instruments',
      'instrument': 'Musical Instruments',
      'camera': 'Camera & Photo',
      'photo': 'Camera & Photo',
    };
    for (const [keyword, bestFor] of Object.entries(map)) {
      if (cat.includes(keyword)) return bestFor;
    }
    return category || 'General';
  }

  function extractDealInfo(doc) {
    doc = doc || document;
    try {
      if (isAmazon()) {
        const badge = doc.querySelector('.savingsPercentage, .a-price-savings, .a-color-price, [class*="deal"]');
        if (badge) {
          const text = badge.textContent.trim();
          const pct = text.match(/(\d+)%/);
          if (pct) return pct[1] + '% OFF';
        }
        const coupon = doc.querySelector('#promoPriceBlockMessage, .couponBadge, [class*="coupon"]');
        if (coupon) {
          const text = coupon.textContent.trim();
          if (text.toLowerCase().includes('coupon') || text.toLowerCase().includes('clip')) return text.substring(0, 40);
        }
      }
      if (isWalmart()) {
        const el = doc.querySelector('[data-testid="price-badge"], .price-badge');
        if (el) return el.textContent.trim().substring(0, 30);
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return '';
  }

  function extractUnitInfo(doc) {
    doc = doc || document;
    try {
      if (isAmazon()) {
        // Unit size: often in the title in parens or in variation selection
        const title = doc.getElementById('productTitle')?.textContent?.trim() || '';
        const sizeMatch = title.match(/\(([^)]*(?:ounce|oz|count|pack|fl|lb|pound|gallon|liter|ml|g\b)[^)]*)\)/i);
        if (sizeMatch) return { unitSize: sizeMatch[1].trim() };
        // Try from #variation_size_name
        const sizeDim = doc.querySelector('#variation_size_name .a-button-selected .a-button-text, #variation_size_name .selection');
        if (sizeDim) return { unitSize: sizeDim.textContent.trim() };
        // Try from price-per-unit
        const unitEl = doc.querySelector('.a-price .a-color-secondary, [class*="unitPrice"], [class*="pricePerUnit"]');
        if (unitEl) {
          const t = unitEl.textContent.trim();
          const upMatch = t.match(/\$[\d.]+/);
          if (upMatch) return { unitPrice: upMatch[0].trim(), unitSize: t.replace(upMatch[0], '').replace(/[\/\\]/g, '/').trim() };
        }
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return {};
  }

  function extractIngredients(doc) {
    doc = doc || document;
    try {
      if (isAmazon()) {
        // Common selectors for ingredients
        const selectors = [
          '#important-information',
          '#productDescription .ingredients, .ingredients',
          '#safety-information',
          '[data-feature-name="safety"]',
        ];
        for (const sel of selectors) {
          const el = doc.querySelector(sel);
          if (el) {
            const text = el.textContent.trim();
            if (text.length > 20 && text.length < 5000) return text.substring(0, 3000);
          }
        }
        // detailBullets: find list-item whose text includes "Ingredients"
        const detailItems = doc.querySelectorAll('#detailBullets_feature_div .a-list-item');
        for (const item of detailItems) {
          if (item.textContent.toLowerCase().includes('ingredients')) {
            const text = item.textContent.trim().replace(/^[^:]*:\s*/i, '').substring(0, 3000);
            if (text.length > 20) return text;
          }
        }
        // productOverview: find td whose text includes "Ingredients", return next sibling text
        const overviewCells = doc.querySelectorAll('#productOverview_feature_div td');
        for (let i = 0; i < overviewCells.length; i++) {
          if (overviewCells[i].textContent.toLowerCase().includes('ingredients')) {
            const nextTd = overviewCells[i + 1];
            if (nextTd) {
              const text = nextTd.textContent.trim();
              if (text.length > 20) return text.substring(0, 3000);
            }
          }
        }
        // Fallback: scan all list items for "ingredients" keyword
        const items = doc.querySelectorAll('#feature-bullets .a-list-item, #important-information *');
        for (const item of items) {
          if (item.textContent.toLowerCase().includes('ingredients')) {
            const next = item.nextElementSibling || item.parentElement?.nextElementSibling;
            if (next) {
              const text = next.textContent.trim();
              if (text.length > 20) return text.substring(0, 3000);
            }
            return item.textContent.trim().replace(/^[^:]*:\s*/i, '').substring(0, 3000);
          }
        }
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return '';
  }

  function extractBSRDetail(doc) {
    doc = doc || document;
    try {
      if (isAmazon()) {
        const raw = extractBestSellersRank(doc);
        if (!raw) return [];
        const rankings = [];
        const lines = raw.split(/[,;]\s*/);
        for (const line of lines) {
          const m = line.match(/#(\d+(?:,\d+)?)\s+(?:in\s+)?(.+?)(?:\s*\([^)]*\))?$/i);
          if (m) {
            rankings.push({ rank: parseInt(m[1].replace(/,/g, '')), category: m[2].trim() });
          }
        }
        return rankings;
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return [];
  }

  function extractReviewHighlights(doc) {
    doc = doc || document;
    try {
      const cleanText = (el) => {
        const clone = el.cloneNode(true);
        clone.querySelectorAll('script, style').forEach(n => n.remove());
        return (clone.textContent || '').trim().substring(0, 1000);
      };
      if (isAmazon()) {
        const summaryEl = doc.querySelector('#cm-cr-dp-review-summary, [data-hook="cr-insights-widget"]');
        if (summaryEl) return cleanText(summaryEl);
        const highlights = doc.querySelectorAll('.cr-insights-widget, [class*="reviewHighlights"], [class*="cr-widget"]');
        for (const el of highlights) {
          const text = cleanText(el);
          if (text.length > 50 && (text.toLowerCase().includes('customer') || text.toLowerCase().includes('review'))) {
            return text;
          }
        }
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return '';
  }

  function extractReviewStats(doc) {
    doc = doc || document;
    try {
      const stats = { total: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
      if (isAmazon()) {
        // Total review count
        const countEl = doc.getElementById('acrCustomerReviewText');
        if (countEl) {
          const m = countEl.textContent?.match(/([\d,]+)/);
          if (m) stats.total = parseInt(m[1].replace(/,/g, ''));
        }
        // Average rating
        const ratingEl = doc.getElementById('acrPopover');
        if (ratingEl) {
          const m = (ratingEl.getAttribute('aria-label') || '').match(/([\d.]+)/);
          if (m) stats.average = parseFloat(m[1]);
        }
        // Star distribution from histogram
        const bars = doc.querySelectorAll('#histogramTable tr, [data-hook="rating-breakdown"] a, .a-star-rating');
        bars.forEach(bar => {
          const text = bar.textContent || '';
          const starM = text.match(/(\d+)\s*star/i);
          const pctM = text.match(/(\d+)%/);
          const countM = text.match(/([\d,]+)\s*(?:rating|customer|review)/i);
          if (starM && pctM) {
            const star = parseInt(starM[1]);
            if (star >= 1 && star <= 5 && stats.total > 0) {
              stats.distribution[star] = Math.round(stats.total * parseInt(pctM[1]) / 100);
            }
          }
        });
        // Fallback: try to get exact counts from histogram links
        if (stats.distribution[5] === 0) {
          doc.querySelectorAll('a[href*="filterByStar=one_star"], a[href*="filterByStar=two_star"], a[href*="filterByStar=three_star"], a[href*="filterByStar=four_star"], a[href*="filterByStar=five_star"]').forEach(a => {
            const href = a.getAttribute('href') || '';
            const text = a.textContent || '';
            const starMap = { one: 1, two: 2, three: 3, four: 4, five: 5 };
            for (const [key, val] of Object.entries(starMap)) {
              if (href.includes(key + '_star')) {
                const m = text.match(/([\d,]+)/);
                if (m) stats.distribution[val] = parseInt(m[1].replace(/,/g, ''));
              }
            }
          });
        }
      }
      return stats;
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return { total: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }

  function extractAmazonReviews(doc) {
    doc = doc || document;
    const reviews = [];
    try {
      // Amazon loads reviews dynamically — capture what's rendered on page
      const containers = doc.querySelectorAll('[data-hook="review"], div[data-hook="customer-review"]');
      containers.forEach(el => {
        const name = el.querySelector('.a-profile-name')?.textContent?.trim() || '';
        if (!name) return;
        const avatar = el.querySelector('.a-profile-avatar img')?.getAttribute('src') || '';
        const ratingEl = el.querySelector('i[data-hook="review-star-rating"]');
        let rating = 0;
        if (ratingEl) {
          const m = ratingEl.textContent?.match(/([\d.]+)/);
          if (m) rating = parseFloat(m[1]);
        }
        const title = el.querySelector('[data-hook="review-title"]')?.textContent?.trim() || '';
        const date = el.querySelector('[data-hook="review-date"]')?.textContent?.trim() || '';
        let body = el.querySelector('[data-hook="review-body"] span, [data-hook="review-body"]')?.textContent?.trim() || '';
        if (body.length > 2000) body = body.substring(0, 2000);
        const verified = !!el.querySelector('[data-hook="avp-badge"]');
        const images = [];
        el.querySelectorAll('[data-hook="review-image-tile"] img, [data-hook="review-image"] img').forEach(img => {
          const src = img.getAttribute('src') || '';
          if (src && !src.startsWith('data:') && images.length < 5) images.push(src);
        });
        reviews.push({ name: name.substring(0, 100), avatar: avatar.substring(0, 500), rating, title: title.substring(0, 200), date: date.substring(0, 100), body, verified, images });
      });
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return reviews.slice(0, 20);
  }

  function extractWalmartReviews(doc) {
    doc = doc || document;
    const reviews = [];
    try {
      const containers = doc.querySelectorAll('[data-testid="review-item"], .review-item, [class*="review"] [data-testid="review"]');
      containers.forEach(el => {
        const name = el.querySelector('[data-testid="reviewer-name"], .reviewer-name, .review-author')?.textContent?.trim() || '';
        if (!name) return;
        const avatar = el.querySelector('[data-testid="reviewer-avatar"] img, .reviewer-avatar img, .review-author-image img')?.getAttribute('src') || '';
        let rating = 0;
        const ratingEl = el.querySelector('[data-testid="review-rating"], [class*="star-rating"], [class*="stars"]');
        if (ratingEl) {
          const m = (ratingEl.getAttribute('aria-label') || ratingEl.textContent || '').match(/([\d.]+)/);
          if (m) rating = parseFloat(m[1]);
        }
        const date = el.querySelector('[data-testid="review-date"], .review-date, .review-time')?.textContent?.trim() || '';
        let body = el.querySelector('[data-testid="review-body"], .review-text, .review-content')?.textContent?.trim() || '';
        if (body.length > 2000) body = body.substring(0, 2000);
        const verified = !!el.querySelector('[data-testid="verified-badge"], .verified-purchase, [class*="verified"]');
        reviews.push({ name: name.substring(0, 100), avatar: avatar.substring(0, 500), rating, title: '', date: date.substring(0, 100), body, verified, images: [] });
      });
      // Also grab Walmart review stats
      if (!reviews.length) {
        const statsEl = doc.querySelector('[data-testid="rating-summary"], .rating-summary');
        if (statsEl) {
          const m = statsEl.textContent?.match(/([\d,]+)\s*(?:ratings|reviews)/i);
          if (m) reviews._stats = { total: parseInt(m[1].replace(/,/g, '')) };
        }
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return reviews.slice(0, 20);
  }

  function extractBestBuyReviews(doc) {
    doc = doc || document;
    const reviews = [];
    try {
      const containers = doc.querySelectorAll('.review-item, [data-testid="review"], .c-reviews .c-review');
      containers.forEach(el => {
        const name = el.querySelector('.reviewer-name, [data-testid="reviewer-name"], .c-review-author')?.textContent?.trim() || '';
        if (!name) return;
        const avatar = el.querySelector('.reviewer-avatar img, [data-testid="reviewer-avatar"] img')?.getAttribute('src') || '';
        let rating = 0;
        const ratingEl = el.querySelector('.c-review-rating, [data-testid="review-rating"], [class*="rating"]');
        if (ratingEl) {
          const m = (ratingEl.getAttribute('aria-label') || ratingEl.textContent || '').match(/([\d.]+)/);
          if (m) rating = parseFloat(m[1]);
        }
        const date = el.querySelector('.review-date, [data-testid="review-date"], .c-review-date')?.textContent?.trim() || '';
        let body = el.querySelector('.review-text, [data-testid="review-body"], .c-review-body')?.textContent?.trim() || '';
        if (body.length > 2000) body = body.substring(0, 2000);
        const title = el.querySelector('.review-title, [data-testid="review-title"]')?.textContent?.trim() || '';
        reviews.push({ name: name.substring(0, 100), avatar: avatar.substring(0, 500), rating, title: title.substring(0, 200), date: date.substring(0, 100), body, verified: false, images: [] });
      });
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return reviews.slice(0, 20);
  }

  function extractAliExpressReviews(doc) {
    doc = doc || document;
    const reviews = [];
    try {
      const containers = doc.querySelectorAll('[data-qa="feedback-item"], .feedback-item, .review-item, [class*="reviewContainer"]');
      containers.forEach(el => {
        const name = el.querySelector('.feedback-author, .review-author, [data-qa="feedback-author"]')?.textContent?.trim() || '';
        if (!name) return;
        const avatar = el.querySelector('img[src*="avatar"]')?.getAttribute('src') || '';
        let rating = 0;
        const ratingEl = el.querySelector('[class*="star"], [class*="rating"]');
        if (ratingEl) {
          const m = (ratingEl.getAttribute('aria-label') || ratingEl.textContent || '').match(/([\d.]+)/);
          if (m) rating = parseFloat(m[1]);
        }
        const date = el.querySelector('.feedback-date, .review-date, [data-qa="feedback-date"]')?.textContent?.trim() || '';
        let body = el.querySelector('.feedback-text, .review-text, [data-qa="feedback-text"]')?.textContent?.trim() || '';
        if (body.length > 2000) body = body.substring(0, 2000);
        reviews.push({ name: name.substring(0, 100), avatar: avatar.substring(0, 500), rating, title: '', date: date.substring(0, 100), body, verified: false, images: [] });
      });
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return reviews.slice(0, 20);
  }

  function extractEbayReviews(doc) {
    doc = doc || document;
    const reviews = [];
    try {
      const containers = doc.querySelectorAll('.review-item, [data-testid="review"], .ebay-review-card, .product-review');
      containers.forEach(el => {
        const name = el.querySelector('.review-author, [data-testid="review-author"], .ebay-review-author')?.textContent?.trim() || '';
        if (!name) return;
        const avatar = el.querySelector('img[class*="avatar"]')?.getAttribute('src') || '';
        let rating = 0;
        const ratingEl = el.querySelector('[class*="star"], [data-testid="review-rating"]');
        if (ratingEl) {
          const m = (ratingEl.getAttribute('aria-label') || ratingEl.textContent || '').match(/([\d.]+)/);
          if (m) rating = parseFloat(m[1]);
        }
        const date = el.querySelector('.review-date, [data-testid="review-date"]')?.textContent?.trim() || '';
        let body = el.querySelector('.review-text, [data-testid="review-body"], .ebay-review-text')?.textContent?.trim() || '';
        if (body.length > 2000) body = body.substring(0, 2000);
        reviews.push({ name: name.substring(0, 100), avatar: avatar.substring(0, 500), rating, title: '', date: date.substring(0, 100), body, verified: false, images: [] });
      });
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return reviews.slice(0, 20);
  }

  function extractReviews(doc) {
    doc = doc || document;
    const reviews = [];
    let reviewStats = { total: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    try {
      if (isAmazon()) {
        reviewStats = extractReviewStats(doc);
        return { reviews: extractAmazonReviews(doc), reviewStats };
      }
      if (isWalmart()) {
        const wmReviews = extractWalmartReviews(doc);
        if (wmReviews._stats) { reviewStats.total = wmReviews._stats.total; delete wmReviews._stats; }
        return { reviews: wmReviews, reviewStats };
      }
      if (isBestBuy()) return { reviews: extractBestBuyReviews(doc), reviewStats };
      if (isAliExpress()) return { reviews: extractAliExpressReviews(doc), reviewStats };
      if (isEbay()) return { reviews: extractEbayReviews(doc), reviewStats };
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return { reviews, reviewStats };
  }

  function extractSearchResults() {
    const results = [];
    try {
      const limit = 20;
      if (isAmazon()) {
        const items = document.querySelectorAll('[data-component-type="s-search-result"]');
        items.forEach((item, idx) => {
          if (idx >= limit) return;
          const titleEl = item.querySelector('h2 a, h2 span');
          const title = titleEl?.textContent?.trim() || '';
          if (!title) return;
          const link = item.querySelector('a.a-link-normal[href*="/dp/"]');
          const href = link?.getAttribute('href') || '';
          const asin = href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] || '';
          const img = item.querySelector('img.s-image')?.getAttribute('src') || '';
          const priceWhole = item.querySelector('.a-price-whole')?.textContent?.replace(/[^\d]/g, '') || '';
          const priceSymbol = item.querySelector('.a-price-symbol')?.textContent || '$';
          const price = priceWhole ? priceSymbol + priceWhole : '';
          const ratingEl = item.querySelector('.a-icon-alt');
          const rating = ratingEl ? parseFloat(ratingEl.textContent.match(/[\d.]+/)?.[0] || '0') : 0;
          results.push({ title, asin, url: 'https://www.amazon.com' + href, image: img, price, rating });
        });
      }
      if (isWalmart()) {
        const items = document.querySelectorAll('[data-testid="item-grid"] [data-item-id], .search-result-item');
        items.forEach((item, idx) => {
          if (idx >= limit) return;
          const titleEl = item.querySelector('[data-testid="product-title"], .prod-title, a[title]');
          const title = titleEl?.textContent?.trim() || titleEl?.getAttribute('title') || '';
          if (!title) return;
          const link = item.querySelector('a[href*="/ip/"]');
          const href = link?.getAttribute('href') || '';
          const img = item.querySelector('img[src*="walmart"]')?.getAttribute('src') || item.querySelector('img')?.getAttribute('src') || '';
          const priceEl = item.querySelector('[data-testid="price"], .price-main');
          const price = priceEl?.textContent?.trim() || '';
          results.push({ title, asin: '', url: href.startsWith('http') ? href : 'https://www.walmart.com' + href, image: img, price, rating: 0 });
        });
      }
      if (isBestBuy()) {
        const items = document.querySelectorAll('.sku-item, [data-testid="product-card"]');
        items.forEach((item, idx) => {
          if (idx >= limit) return;
          const titleEl = item.querySelector('.sku-title a, [data-testid="product-title"] a, h4 a');
          const title = titleEl?.textContent?.trim() || '';
          if (!title) return;
          const href = titleEl?.getAttribute('href') || '';
          const img = item.querySelector('img[src*="bbystatic"]')?.getAttribute('src') || '';
          const priceEl = item.querySelector('.priceView-customer-price, [data-testid="customer-price"]');
          const price = priceEl?.textContent?.trim() || '';
          results.push({ title, asin: '', url: href.startsWith('http') ? href : 'https://www.bestbuy.com' + href, image: img, price, rating: 0 });
        });
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return results;
  }

  function extractBrandStoreProducts() {
    const results = [];
    try {
      if (isAmazon()) {
        // Amazon brand store - get all product links
        const links = document.querySelectorAll('a[href*="/dp/"], a[href*="/gp/product/"]');
        const seen = new Set();
        links.forEach(link => {
          const href = link.getAttribute('href') || '';
          const asin = href.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/)?.[1];
          if (asin && !seen.has(asin)) {
            seen.add(asin);
            const title = link.getAttribute('title') || link.textContent?.trim() || '';
            const img = link.querySelector('img')?.getAttribute('src') || '';
            results.push({ title: title.substring(0, 100), asin, url: 'https://www.amazon.com/dp/' + asin, image: img, price: '', rating: 0 });
          }
        });
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return results.slice(0, 30);
  }

  function extractWishlistProducts() {
    const results = [];
    try {
      if (isAmazon()) {
        const items = document.querySelectorAll('#wl-list .g-item-sortable, #g-items .a-fixed-left-grid, [data-list-id] [data-itemid]');
        items.forEach(item => {
          const titleEl = item.querySelector('a[id*="itemName"], a[href*="/dp/"]');
          const title = titleEl?.textContent?.trim() || '';
          const href = titleEl?.getAttribute('href') || '';
          const asin = href.match(/\/dp\/([A-Z0-9]{10})/)?.[1] || '';
          if (asin) {
            const img = item.querySelector('img')?.getAttribute('src') || '';
            results.push({ title: title.substring(0, 100), asin, url: 'https://www.amazon.com/dp/' + asin, image: img, price: '', rating: 0 });
          }
        });
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return results.slice(0, 30);
  }

  function cleanPrice(str) {
    if (!str) return '';
    const cleaned = str.replace(/[^\d.,]/g, '').trim();
    const match = cleaned.match(/(\d+)[.,]?(\d{0,2})/);
    if (!match) return '$' + cleaned;
    return '$' + match[1] + (match[2] ? '.' + match[2].replace(/^0+/, '') : '');
  }

  function extractVariations(doc) {
    doc = doc || document;
    const variations = [];
    try {
      if (isAmazon()) {
        const dims = doc.querySelectorAll('[id^="variation_"]');
        const seen = new Set();
        dims.forEach(dim => {
          const dimId = dim.id;
          if (seen.has(dimId)) return;
          seen.add(dimId);
          const label = dim.querySelector('.a-form-label')?.textContent?.replace(/[:\s]+$/, '').trim() || dimId.replace('variation_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const options = [];
          const selected = dim.querySelector('.a-button-selected');
          let selectedValue = '';
          if (selected) {
            selectedValue = selected.getAttribute('title') || selected.querySelector('img')?.getAttribute('alt') || selected.textContent.trim();
          }
          dim.querySelectorAll('.a-button, .swatch-select, .image-swatch, .text-swatch, .twisterOption, [data-csa-c-type="widget"] > span').forEach(btn => {
            const title = btn.getAttribute('title') || '';
            const alt = btn.querySelector('img')?.getAttribute('alt') || '';
            const text = btn.textContent.trim().replace(/^\d+\s*/, '');
            const imgSrc = btn.querySelector('img')?.getAttribute('src') || '';
            const fullImg = imgSrc ? imgSrc.replace(/\._[^.]*_\./g, '.') : '';
            const val = title || alt || text;
            if (val && val.length < 100) {
              if (!options.find(o => o.value === val)) {
                options.push({ value: val, image: fullImg || undefined, price: parsePriceFromAttrs(btn) || undefined });
              }
            }
          });
          if (options.length > 0) {
            const prices = options.map(o => o.price).filter(Boolean);
            const priceRange = prices.length > 1 ? { low: prices[0], high: prices[prices.length - 1] } : undefined;
            variations.push({ name: label, selectedValue, options, priceRange });
          }
        });
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return variations;
  }

  function parsePriceFromAttrs(el) {
    try {
      const dp = el.getAttribute('data-a-dynamic-price');
      if (dp) {
        const p = JSON.parse(dp);
        const symbol = p['a-price-symbol'] || '$';
        const whole = p['a-price-whole'] || '';
        const fraction = (p['a-price-fraction'] || '').replace(/^0+/, '');
        if (whole) return symbol + whole + (fraction ? '.' + fraction : '');
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return '';
  }

  function extractDiscountInfo(doc) {
    doc = doc || document;
    try {
      let listPrice = '';
      let savings = '';
      if (isAmazon()) {
        // List price: try specific selectors IN ORDER of reliability
        // 1. #listPrice element (most reliable — Amazon's explicit list price)
        // 2. .basisPrice .a-offscreen (strikethrough price container)
        // 3. span[data-a-strike] .a-offscreen (struck-through price)
        // 4. .a-text-price .a-offscreen INSIDE #apex_offerDisplay_desktop (price block only)
        // Do NOT use broad .a-text-price.a-text-price-basis — it matches unit prices ($X.XX/fl oz)
        listPrice = doc.querySelector('#listPrice')?.textContent?.trim()
          || doc.querySelector('.basisPrice .a-offscreen')?.textContent?.trim()
          || doc.querySelector('span.a-price[data-a-strike] .a-offscreen')?.textContent?.trim()
          || doc.querySelector('#apex_offerDisplay_desktop .a-text-price .a-offscreen')?.textContent?.trim()
          || '';
        // Get current price for validation
        const currentPriceNum = parseFloat((doc.querySelector('.a-price:not([data-a-strike]) .a-offscreen')?.textContent || doc.querySelector('.a-price-whole')?.textContent || '').replace(/[^\d.]/g, ''));
        const listNum = parseFloat(listPrice.replace(/[^\d.]/g, ''));
        // Validate: list price must be HIGHER than current price (it's a strike-through/discount price)
        // If list < current, it's a unit price ($6.21/fl oz) or per-item price, not a real list price
        if (listNum && currentPriceNum && listNum <= currentPriceNum) {
          listPrice = ''; // Not a real list price — it's a unit/per-item price
        }
        const savingsEl = doc.querySelector('.a-price-savings, .a-color-price.a-text-price, [id*="savings"]');
        if (savingsEl) {
          savings = savingsEl.textContent.replace(/\s+/g, ' ').trim();
          if (!savings.toLowerCase().includes('save')) {
            const priceWhole = doc.querySelector('.a-price-whole')?.textContent?.replace(/[^\d]/g, '') || '';
            const listNum = listPrice.replace(/[^\d.]/g, '');
            if (listNum && priceWhole) {
              const diff = parseFloat(listNum) - parseFloat(priceWhole);
              const pct = Math.round((diff / parseFloat(listNum)) * 100);
              if (diff > 0) savings = `Save $${diff.toFixed(2)} (${pct}%)`;
            }
          }
        } else {
          const priceWhole = doc.querySelector('.a-price-whole')?.textContent?.replace(/[^\d]/g, '') || '';
          const listNum = listPrice.replace(/[^\d.]/g, '');
          if (listNum && priceWhole) {
            const diff = parseFloat(listNum) - parseFloat(priceWhole);
            if (diff > 0) {
              const pct = Math.round((diff / parseFloat(listNum)) * 100);
              savings = `Save $${diff.toFixed(2)} (${pct}%)`;
            }
          }
        }
      }
      return { listPrice, savings };
    } catch (e) { return { listPrice: '', savings: '' }; }
  }

  function extractDetailBullets(doc) {
    doc = doc || document;
    const details = {};
    try {
      if (isAmazon()) {
        const tables = doc.querySelectorAll('#productDetails_detailBullets_sections1 tr, #detailBullets_feature_div .a-list-item, #productDetails_techSpec_section_1 tr');
        tables.forEach(row => {
          const label = row.querySelector('th, .a-text-bold, [class*="label"]')?.textContent?.replace(/[:\s]+$/, '').trim();
          const value = row.querySelector('td, .a-text-bold + span, span:not(.a-text-bold)')?.textContent?.trim();
          if (label && value) details[label] = value;
        });
      }
      if (isWalmart()) {
        const specs = doc.querySelectorAll('.spec-detail, [data-testid="specifications"] tr');
        specs.forEach(row => {
          const label = row.querySelector('th, dt')?.textContent?.trim();
          const value = row.querySelector('td, dd')?.textContent?.trim();
          if (label && value) details[label] = value;
        });
      }
      if (isBestBuy()) {
        const specs = doc.querySelectorAll('.specs-table tr, .product-specs tr');
        specs.forEach(row => {
          const label = row.querySelector('td:first-child, th')?.textContent?.trim();
          const value = row.querySelector('td:last-child')?.textContent?.trim();
          if (label && value && label !== value) details[label] = value;
        });
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return details;
  }

  function extractVideoUrl(doc) {
    doc = doc || document;
    try {
      if (isAmazon()) {
        // Priority 0: YouTube iframes embedded on page
        const ytIframe = doc.querySelector('iframe[src*="youtube.com/embed"], iframe[src*="youtu.be"]');
        if (ytIframe) {
          const src = ytIframe.getAttribute('src') || '';
          if (src) return src.split('?')[0];
        }

        // Priority 1: <source> elements inside video (often have real CDN URL)
        const source = doc.querySelector('video source[src*="media-amazon"], video source[src*="m.media"]');
        if (source) { const src = source.getAttribute('src'); if (src && !src.startsWith('blob:')) return src; }

        // Priority 2: data attributes on video container with real CDN URL
        const containers = doc.querySelectorAll('#video, [data-media-type="video"], #mediaBlock_video, #a-page [data-video-url], .a-video');
        for (const el of containers) {
          for (const attr of ['data-video-url', 'data-media-url', 'data-url']) {
            const val = el.getAttribute(attr);
            if (val && !val.startsWith('blob:') && !val.startsWith('data:')) return val;
          }
        }

        // Priority 3: Any element with data-video-url that isn't blob
        const anyVideo = doc.querySelector('[data-video-url]:not([data-video-url*="blob"]), [data-media-url*="media"]');
        if (anyVideo) {
          const val = anyVideo.getAttribute('data-video-url') || anyVideo.getAttribute('data-media-url') || '';
          if (val && !val.startsWith('blob:')) return val;
        }

        // Priority 4: Search ALL script tags aggressively for any video URL
        const scripts = doc.querySelectorAll('script, script[type="application/json"], script[type="a-state"]');
        for (const script of scripts) {
          const text = script.textContent || '';
          // Prefer MP4/webm/mov over m3u8 — search concrete video formats first
          // Pattern: any https://m.media-amazon.com/...mp4 in script
          const m5 = text.match(/(https:\/\/m\.media-amazon\.com[^"'\s]+\.(mp4|webm|mov)[^"'\s]*)/i);
          if (m5) return m5[1];
          // Pattern: "videoUrl": "URL" (may be m3u8 — still useful)
          const m1 = text.match(/"videoUrl"\s*:\s*"(https?:[^"]+)"/i);
          if (m1 && !m1[1].startsWith('blob:') && !m1[1].startsWith('data:')) return m1[1];
          // Pattern: "url": "https://m.media-amazon.com/...mp4"
          const m2 = text.match(/"url"\s*:\s*"(https:\/\/m\.media-amazon\.com[^"]+\.(mp4|webm|mov)[^"]*)"/i);
          if (m2) return m2[1];
          // Pattern: "src": "https://m.media-amazon.com/...mp4"  
          const m3 = text.match(/"src"\s*:\s*"(https:\/\/m\.media-amazon\.com[^"]+\.(mp4|webm|mov)[^"]*)"/i);
          if (m3) return m3[1];
          // Pattern: "sourceUrl": "https://..."
          const m4 = text.match(/"sourceUrl"\s*:\s*"(https?:[^"]+\.(mp4|webm|mov)[^"]*)"/i);
          if (m4 && !m4[1].startsWith('blob:')) return m4[1];
          // Pattern: YouTube URL in script data
          const m6 = text.match(/"url"\s*:\s*"(https?:\/\/(?:www\.)?youtube\.com\/embed\/[^"]+)"/i);
          if (m6) return m6[1].split('?')[0];
        }

        // Priority 5: video[src] only if not blob
        const video = doc.querySelector('#video video, #mediaBlock_video video, .a-video video, #videoElement video, video[data-video-url]');
        if (video) {
          const src = video.getAttribute('src') || '';
          if (src && !src.startsWith('blob:') && !src.startsWith('data:')) return src;
        }

        // Priority 6: Video link elements
        const link = doc.querySelector('#video a[href*="video"], #video a[href*="medias"], [data-media-group*="video"] a');
        if (link) {
          const val = link.getAttribute('data-video-url') || link.getAttribute('data-url') || '';
          if (val && !val.startsWith('blob:')) return val;
        }

        // Priority 7: Try to fetch Amazon media API via background script (ASIN needed)
        // This is handled server-side by /api/admin/seo/product-reviews/fetch-video/:id
      }
    } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
    return '';
  }

  function extractCommonFields(doc, source) {
    doc = doc || document;
    let product_name = '';
    let product_image = '';
    let price = '';
    let rating = 0;
    let reviewCount = 0;
    let brand = '';
    let key_features = [];

    if (source === 'amazon') {
      const titleEl = doc.getElementById('productTitle');
      product_name = titleEl ? titleEl.textContent.trim() : '';

      let imgEl = doc.getElementById('landingImage');
      if (!imgEl) imgEl = doc.querySelector('img[data-old-hires]');
      if (!imgEl) imgEl = doc.querySelector('.a-dynamic-image');
      if (!imgEl) imgEl = doc.querySelector('#imgTagWrapperId img[src*="images-amazon"]');
      if (!imgEl) imgEl = doc.querySelector('#main-image img');
      if (!imgEl) imgEl = doc.querySelector('img[src*="images-amazon"][src*="images/I"]');
      if (imgEl) {
        product_image = imgEl.getAttribute('src') || imgEl.getAttribute('data-old-hires') || '';
        if (product_image) product_image = product_image.replace(/\._[^.]*_\./g, '.');
        if (!product_image) {
          try { const d = JSON.parse(imgEl.getAttribute('data-a-dynamic-image') || '{}'); product_image = Object.keys(d)[0] || ''; } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
        }
      }

      try {
        const symbol = (doc.querySelector('.a-price-symbol')?.textContent || '').trim() || '$';
        const whole = (doc.querySelector('.a-price-whole')?.textContent || '').replace(/[^\d]/g, '');
        const fraction = (doc.querySelector('.a-price-fraction')?.textContent || '').replace(/[^\d]/g, '');
        if (whole) price = symbol + whole + (fraction ? '.' + fraction : '');
        if (!price || price === '$') {
          const offscreen = doc.querySelector('.a-price.a-text-price .a-offscreen');
          if (offscreen) price = offscreen.textContent.trim();
        }
      } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }

      try {
        ['acrPopover', 'averageCustomerReviews', 'acrCustomerReviewText'].forEach(id => {
          const el = doc.getElementById(id);
          if (el) {
            const match = (el.getAttribute('aria-label') || el.textContent || '').match(/([\d.]+)\s*out\s*of\s*5/i);
            if (match) rating = parseFloat(match[1]);
            const countMatch = (el.textContent || '').match(/([\d,]+)\s*(?:ratings|customer reviews|ratings)/i);
            if (countMatch) reviewCount = parseInt(countMatch[1].replace(/,/g, ''));
          }
        });
      } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }

      const bylineDoc = doc.getElementById('bylineInfo');
      if (bylineDoc) {
        try {
          let t = bylineDoc.textContent.trim();
          const m = t.match(/(?:Brand:\s*|Visit the\s+)(.+?)(?:\s+Store)?$/i);
          brand = m ? m[1].trim() : t.replace(/^Brand:\s*/i, '');
        } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
      }

      const bulletItems = doc.querySelectorAll('#feature-bullets .a-list-item');
      key_features = Array.from(bulletItems).map(el => el.textContent.trim()).filter(Boolean);
    }

    return { product_name, product_image, price, rating, reviewCount, brand, key_features };
  }

  function extractProductData() {
    const source = isAmazon() ? 'amazon' : isWalmart() ? 'walmart' : isBestBuy() ? 'bestbuy' : isAliExpress() ? 'aliexpress' : isEbay() ? 'ebay' : 'other';
    const common = extractCommonFields(document, source);
    let { product_name, product_image, price, rating, reviewCount, brand, key_features } = common;
    let asin = '';
    let amazon_url = '';
    let review_summary = '';
    const gallery = [];
    let videoUrl = '';

    if (isAmazon()) {
      asin = (document.querySelector('input[name="ASIN"]')?.getAttribute('value')) || (window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/)?.[1]) || '';
      amazon_url = window.location.href.split('?')[0].split('#')[0];

      try {
        const desc = document.querySelector('#productDescription p, #productDescription, #aplus p, [data-feature-name="productDescription"] p, #productOverview_feature_div');
        if (desc) review_summary = desc.textContent.trim().substring(0, 3000);
        // If description is short, try to get more from A+ content
        if ((review_summary || '').length < 100) {
          const aplus = document.querySelector('#aplus p, #aplus .a-section p, [data-feature-name="aplus"] p');
          if (aplus) review_summary = aplus.textContent.trim().substring(0, 3000);
        }
      } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }

      const seen = new Set();
      document.querySelectorAll('#altImages img[src*="images"], #altImages img[src*="media"], #altImages .imageThumbnail img, #altImages .a-button-thumbnail img, .a-spacing-small img[src*="images"], [data-a-carousel-options] img[src*="media"], li[data-csa-c-type="thumb"] img, #imageBlockThumbs img[src*="images"], [data-csa-c-slot-id="thumbnail-slot"] img').forEach(img => {
        let src = img.getAttribute('src') || img.getAttribute('data-old-hires') || '';
        src = src.replace(/\._[^.]*_\./g, '.');
        if (src && !seen.has(src)) { seen.add(src); gallery.push(src); }
      });
      if (product_image && !gallery.includes(product_image)) gallery.unshift(product_image);
      videoUrl = extractVideoUrl();
    }

    let affiliate_url = '';
    if (isAmazon()) {
      // Prefer the REAL SiteStripe deep link shown by the Associates toolbar.
      affiliate_url = captureSiteStripeUrl(asin) || '';
    }

    if (isWalmart()) {
      const titleEl = document.querySelector('[data-testid="product-title"], .prod-title, h1');
      product_name = titleEl?.textContent?.trim() || '';
      const imgEl = document.querySelector('[data-testid="hero-image"] img, .prod-hero-image img, img[src*="walmart"][src*="/images/"]:not([data-testid])');
      if (imgEl) product_image = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '';
      const priceEl = document.querySelector('[data-testid="price"], .price-main, .price-now');
      if (priceEl) price = priceEl.textContent?.trim() || '';
      try {
        const ratingEl = document.querySelector('[data-testid="rating"], .stars-container');
        if (ratingEl) {
          const match = ratingEl.textContent.match(/([\d.]+)\s*out\s*of\s*5/i);
          if (match) rating = parseFloat(match[1]);
        }
      } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
      try {
        const brandEl = document.querySelector('[data-testid="brand"], .prod-brand, a[data-testid="brand-link"]');
        if (brandEl) brand = brandEl.textContent.trim();
      } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
      asin = window.location.pathname.match(/\/ip\/([A-Z0-9]+)/)?.[1] || '';
      amazon_url = window.location.href.split('?')[0];
      key_features = Array.from(document.querySelectorAll('[data-testid="key-features"] li, .key-features li, .specs-list li')).map(el => el.textContent.trim()).filter(Boolean);
    }

    if (isBestBuy()) {
      const titleEl = document.querySelector('.sku-title, [data-testid="product-title"], h1');
      product_name = titleEl?.textContent?.trim() || '';
      const imgEl = document.querySelector('.primary-image img, [data-testid="product-image"] img, img[src*="bbystatic"]');
      if (imgEl) product_image = imgEl.getAttribute('src') || '';
      const priceEl = document.querySelector('.priceView-customer-price, [data-testid="customer-price"], .price');
      if (priceEl) price = priceEl.textContent?.trim() || '';
      try {
        const ratingEl = document.querySelector('.rating-reviews, [data-testid="rating"]');
        if (ratingEl) {
          const match = ratingEl.textContent.match(/([\d.]+)\s*out\s*of\s*5/i);
          if (match) rating = parseFloat(match[1]);
        }
      } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
      const sku = document.querySelector('[data-sku-id], input[name="skuId"]')?.getAttribute('data-sku-id') || document.querySelector('[data-sku-id]')?.getAttribute('data-sku-id') || '';
      asin = sku;
      amazon_url = window.location.href.split('?')[0];
      brand = document.querySelector('.brand-name, [data-testid="brand"]')?.textContent?.trim() || '';
    }

    if (isAliExpress()) {
      const titleEl = document.querySelector('.product-title, [data-pl="product-title"], h1');
      product_name = titleEl?.textContent?.trim() || '';
      const imgEl = document.querySelector('.image-viewer img, .gallery-main img, img[src*="aliexpress"]');
      if (imgEl) product_image = imgEl.getAttribute('src') || '';
      const priceEl = document.querySelector('.product-price, .price-current, [data-pl="price"]');
      if (priceEl) price = priceEl.textContent?.trim() || '';
      asin = window.location.pathname.match(/\/(\d+)\.html/)?.[1] || '';
      amazon_url = window.location.href.split('?')[0];
    }

    const variations = extractVariations();
    const discount = extractDiscountInfo();
    const detailBullets = extractDetailBullets();
    const stockStatus = extractStockStatus();
    const dealBadge = extractDealInfo();
    const bestSellersRank = extractBestSellersRank();
    const category = extractCategory();
    const bestFor = mapCategoryToBestFor(category);

    // Enhanced extractions
    let ingredients = '';
    let unitSize = '';
    let unitPrice = '';
    let bsrDetail = [];
    let reviewHighlights = '';
    let reviews = [];
    let reviewStats = { total: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    if (isAmazon()) {
      ingredients = extractIngredients();
      const unitInfo = extractUnitInfo();
      unitSize = unitInfo.unitSize || '';
      unitPrice = unitInfo.unitPrice || '';
      bsrDetail = extractBSRDetail();
      reviewHighlights = extractReviewHighlights();
      if ((review_summary || '').length < 200 && reviewHighlights) {
        review_summary = (review_summary ? review_summary + ' | ' : '') + 'Customer insights: ' + reviewHighlights.substring(0, 500);
      }
    }
    // Extract reviews for all stores
    const reviewData = extractReviews();
    reviews = reviewData.reviews || [];
    reviewStats = reviewData.reviewStats || reviewStats;
    // Merge review stats into main reviewCount
    if (reviewStats.total > 0 && (!reviewCount || reviewCount === 0)) {
      reviewCount = reviewStats.total;
    }
    if (reviewStats.average > 0 && !rating) {
      rating = reviewStats.average;
    }

    let priceRange;
    if (variations.length > 0) {
      const allPrices = [];
      variations.forEach(dim => dim.options.forEach(o => { if (o.price) allPrices.push(o.price); }));
      if (allPrices.length > 1) {
        const toNum = (s) => parseFloat(s.replace(/[^0-9.]/g, ''));
        const sorted = [...allPrices].sort((a, b) => toNum(a) - toNum(b));
        priceRange = { low: sorted[0], high: sorted[sorted.length - 1] };
      }
    }

    const specs = {};
    const specMappings = {
      'Manufacturer': 'manufacturer', 'Unit Count': 'unitCount', 'Target Use Body Part': 'targetUse',
      'Special Features': 'specialFeatures', 'Target Audience': 'targetAudience', 'UPC': 'upc',
      'Model Number': 'modelNumber', 'Part Number': 'partNumber', 'Best Sellers Rank': 'bestSellersRank',
      'Item model number': 'modelNumber', 'Number of Items': 'unitCount', 'Package Dimensions': 'packageDimensions',
      'Item Weight': 'itemWeight',
    };
    Object.entries(detailBullets).forEach(([label, value]) => {
      const key = specMappings[label] || label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
      specs[key] = value;
    });
    if (bestSellersRank) specs.bestSellersRank = bestSellersRank;

    return {
      product_name, brand, product_image, price, rating, reviewCount, key_features, pros: [], cons: [],
      review_summary, amazon_url, asin, gallery, videoUrl, variations, listPrice: discount.listPrice,
      savings: discount.savings, priceRange, specs, detailBullets, stockStatus, dealBadge,
      bestSellersRank, category, bestFor, source,
      ingredients, unitSize, unitPrice, bsrDetail, reviewHighlights,
      reviews, reviewStats, affiliate_url,
    };
  }

  function createBanner() {
    const existing = document.getElementById('dw-import-banner');
    if (existing) existing.remove();

    let data = {};
    try { data = extractProductData(); } catch (e) { data = {}; }
    const title = data.product_name?.substring(0, 60)
      || document.getElementById('productTitle')?.textContent?.trim()?.substring(0, 60)
      || document.querySelector('[data-testid="product-title"]')?.textContent?.trim()?.substring(0, 60)
      || document.querySelector('.sku-title')?.textContent?.trim()?.substring(0, 60) || 'Product';

    function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    const priceDisplay = data.priceRange ? data.priceRange.low + ' - ' + data.priceRange.high : data.price;
    const savingsDisplay = data.savings ? data.savings : (data.listPrice ? 'Was ' + data.listPrice : '');
    const ratingDisplay = data.rating ? data.rating + '/5' : '';
    const variationsDisplay = data.variations.map(v => esc(v.selectedValue)).filter(Boolean);
    const featuresCount = data.key_features.length;
    const imagesCount = data.gallery.length;
    const sourceIcon = data.source === 'amazon' ? '🅰' : data.source === 'walmart' ? '🅆' : data.source === 'bestbuy' ? '🅱' : data.source === 'aliexpress' ? '🅰' : '🅴';
    const bsrTop = data.bsrDetail && data.bsrDetail.length > 0 ? data.bsrDetail[0] : null;

    const banner = document.createElement('div');
    banner.id = 'dw-import-banner';
    banner.className = 'dw-banner';
    banner.innerHTML = `
      <div class="dw-banner-content">
        <span class="dw-banner-icon">${sourceIcon}</span>
        <div class="dw-banner-preview">
          <span class="dw-banner-title">${esc(title)}</span>
          <div class="dw-banner-row">
            ${priceDisplay ? '<span class="dw-badge-price">' + esc(priceDisplay) + '</span>' : ''}
            ${savingsDisplay ? '<span class="dw-badge-savings">' + esc(savingsDisplay) + '</span>' : ''}
            ${ratingDisplay ? '<span class="dw-badge-rating">⭐ ' + esc(ratingDisplay) + '</span>' : ''}
            ${featuresCount ? '<span class="dw-badge-features">📋 ' + featuresCount + ' features</span>' : ''}
            ${imagesCount ? '<span class="dw-badge-features">🖼️ ' + imagesCount + ' images</span>' : ''}
            ${data.bestFor ? '<span class="dw-badge-variation">🏷️ ' + esc(data.bestFor) + '</span>' : ''}
            ${data.dealBadge ? '<span class="dw-badge-savings">🔥 ' + esc(data.dealBadge) + '</span>' : ''}
            ${data.stockStatus && data.stockStatus !== 'in_stock' ? '<span class="dw-badge-variation">⚠️ ' + esc(data.stockStatus.replace('_', ' ')) + '</span>' : ''}
            ${data.unitSize ? '<span class="dw-badge-variation">📦 ' + esc(data.unitSize) + '</span>' : ''}
            ${data.unitPrice ? '<span class="dw-badge-price">' + esc(data.unitPrice) + '</span>' : ''}
            ${bsrTop ? '<span class="dw-badge-variation">🏆 #' + bsrTop.rank + ' in ' + esc(bsrTop.category) + '</span>' : ''}
            ${data.ingredients ? '<span class="dw-badge-variation">🧪 Ingredients ✓</span>' : ''}
            ${data.reviewHighlights ? '<span class="dw-badge-variation">💬 Reviews ✓</span>' : ''}
            ${data.reviewStats?.total ? '<span class="dw-badge-variation">📝 ' + data.reviewStats.total.toLocaleString() + ' reviews</span>' : ''}
            ${data.reviews?.length ? '<span class="dw-badge-variation">👤 ' + data.reviews.length + ' loaded</span>' : ''}
            ${variationsDisplay.map(v => '<span class="dw-badge-variation">' + v + '</span>').join('')}
          </div>
          ${data.source === 'amazon' ? `
          <div class="dw-banner-row" style="margin-top:6px">
            <input id="dw-aff-url-field" type="url" placeholder="Amazon affiliate link (auto-detected from SiteStripe, or paste the long link here)" value="${esc(data.affiliate_url || '').replace(/"/g, '&quot;')}"
              style="flex:1;min-width:0;padding:7px 10px;border:1px solid #4b5563;border-radius:8px;background:#111827;color:#f9fafb;font-size:11px;font-family:monospace" />
          </div>
          <div class="dw-banner-row" style="font-size:10px;color:#8899bb;margin-top:2px">
            💡 Logged into Amazon Associates? If the SiteStripe <b>Share affiliate link</b> popup is open, Import grabs the <b>Full Link</b> automatically (or you can paste it here). Empty → auto-adds <b>tag=dawnwire-20</b>.
          </div>` : ''}
        </div>
        <div class="dw-btn-row">
          <button id="dw-import-btn" class="dw-btn dw-btn-primary">Import to DawnWire</button>
          <button id="dw-dismiss-btn" class="dw-btn dw-btn-outline">Skip</button>
        </div>
      </div>
    `;
    document.body.prepend(banner);

    // SiteStripe may hold or generate the long link after the banner shows
    // (popover open + copy click). Passively watch a few seconds and prefill
    // the field the moment a tagged deep link for THIS product appears.
    if (data.source === 'amazon' && data.asin) {
      const affWatch = setInterval(() => {
        const got = captureSiteStripeUrl(data.asin);
        if (!got) return;
        clearInterval(affWatch);
        const f = document.getElementById('dw-aff-url-field');
        if (f && !String(f.value || '').trim()) { f.value = got; }
      }, 400);
      setTimeout(() => clearInterval(affWatch), 10000);
    }

    document.getElementById('dw-import-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('dw-import-btn');
      if (btn) { btn.textContent = 'Importing...'; btn.disabled = true; }
      try {
        const d = extractProductData();
        // Honor the visible affiliate field (auto-detected or user-pasted).
        const affField = document.getElementById('dw-aff-url-field');
        let affValue = (affField?.value || '').trim();
        // Popover open but nothing captured yet? Ask SiteStripe for the Full
        // (deep) long link at import time so the product keeps the real URL.
        if (!affValue && d.source === 'amazon' && d.asin) {
          const primed = await primeSiteStripeFullLink(d.asin, 2500);
          if (primed) {
            affValue = primed;
            if (affField) affField.value = primed;
          }
        }
        if (affValue) d.affiliate_url = affValue;
        const result = await sendMessage({ type: 'IMPORT_PRODUCT', data: d });
        if (result?.success) {
          showToast(result.updated ? '🔄 Updated! Price/stats refreshed.' : '✅ Imported! Review created as draft.', 'success');
          if (result.affiliateLink) showToast('🔗 Cloaked link: ' + result.affiliateLink, 'success');
          if (result.generatedArticle) showToast('📝 Buying guide article generated!', 'success');
          banner.remove();
        } else {
          showToast('❌ Failed: ' + (result?.error || 'Unknown error'), 'error');
          if (btn) { btn.textContent = 'Import to DawnWire'; btn.disabled = false; }
        }
      } catch (err) {
        showToast('❌ Failed: ' + err.message, 'error');
        if (btn) { btn.textContent = 'Import to DawnWire'; btn.disabled = false; }
      }
    });

    document.getElementById('dw-dismiss-btn')?.addEventListener('click', () => banner.remove());
  }

  function showToast(message, type) {
    const existing = document.getElementById('dw-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'dw-toast';
    toast.className = 'dw-toast dw-toast-' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  // Affiliate link recheck banner — click-only. Detects the current product in
  // the DB (by ASIN) and shows its affiliate-link status + a paste box so the
  // user can update ONLY the affiliate_url manually. Never auto-writes.
  function createAffiliateBanner() {
    const existing = document.getElementById('dw-affiliate-banner');
    if (existing) existing.remove();

    let data = {};
    try { data = extractProductData(); } catch (e) { data = {}; }
    const asin = data.asin;
    const title = data.product_name?.substring(0, 60)
      || document.getElementById('productTitle')?.textContent?.trim()?.substring(0, 60) || 'Product';

    function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    async function init() {
      const { apiUrl, apiToken } = await chromeStorageGet();
      if (!apiToken) return;
      const baseUrl = (apiUrl || 'https://www.dawnwire.com').replace(/\/$/, '');
      const headers = { 'Authorization': 'Bearer ' + apiToken };

      let product = null;
      try {
        const dupRes = await fetch(baseUrl + '/api/admin/seo/product-reviews/check-duplicate?asin=' + encodeURIComponent(asin), { headers });
        const dupData = await dupRes.json();
        if (dupData && dupData.duplicate && dupData.id) {
          const hp = await fetch(baseUrl + '/api/admin/affiliate/product/' + dupData.id, { headers });
          if (hp.ok) product = await hp.json();
        }
      } catch (e) { console.error('[DawnWire] affiliate recheck failed:', e); }

      if (!product) return; // New product, not yet in DB — no recheck banner.

      const STATUS_LABEL = {
        healthy: '✅ Healthy (manual link with tag)',
        fixable: '⚠️ Needs fix (link missing or untagged)',
        system_generated: '🔵 System generated (no manual link)',
        broken: '🔴 Broken (no ASIN / invalid URL)',
        unavailable: '⚫ Unavailable',
        pending: '⚪ Not checked yet',
      };

      const banner = document.createElement('div');
      banner.id = 'dw-affiliate-banner';
      banner.className = 'dw-banner';
      banner.innerHTML = `
        <div class="dw-banner-content">
          <span class="dw-banner-icon">🔗</span>
          <div class="dw-banner-preview">
            <span class="dw-banner-title">${esc(title)}</span>
            <div class="dw-banner-row">
              <span class="dw-badge-variation">ASIN: ${esc(product.asin || '—')}</span>
              <span class="dw-badge-variation">${esc(STATUS_LABEL[product.validation_status] || product.validation_status)}</span>
              ${product.status === 'draft' ? '<span class="dw-badge-savings">📄 Draft until affiliate link is updated</span>' : ''}
            </div>
            ${product.generated_url ? '<div class="dw-banner-row"><span class="dw-badge-price" style="word-break:break-all;font-size:10px">' + esc(product.generated_url) + '</span></div>' : ''}
            <div class="dw-banner-row">
              <input id="dw-aff-url" type="url" placeholder="Paste your Amazon affiliate link (tag=...)…" value="${esc(product.affiliate_url || '')}"
                style="flex:1;min-width:200px;padding:8px 10px;border:1px solid #4b5563;border-radius:8px;background:#111827;color:#f9fafb;font-size:12px;font-family:monospace" />
            </div>
          </div>
          <div class="dw-btn-row">
            <button id="dw-aff-save" class="dw-btn dw-btn-primary">Update affiliate link only</button>
            <button id="dw-aff-dismiss" class="dw-btn dw-btn-outline">Dismiss</button>
          </div>
        </div>
      `;
      document.body.prepend(banner);

      document.getElementById('dw-aff-save')?.addEventListener('click', async () => {
        const input = document.getElementById('dw-aff-url');
        const url = (input?.value || '').trim();
        if (!url) { showToast('❌ Paste the affiliate URL first', 'error'); return; }
        const btn = document.getElementById('dw-aff-save');
        if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }
        try {
          const res = await fetch(baseUrl + '/api/admin/affiliate/link/' + product.id, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ affiliateUrl: url }),
          });
          const result = await res.json();
          if (res.ok) {
            showToast('✅ Affiliate link updated & product published', 'success');
            banner.remove();
          } else {
            showToast('❌ ' + (result.error || 'Update failed'), 'error');
            if (btn) { btn.textContent = 'Update affiliate link only'; btn.disabled = false; }
          }
        } catch (e) {
          showToast('❌ ' + e.message, 'error');
          if (btn) { btn.textContent = 'Update affiliate link only'; btn.disabled = false; }
        }
      });
      document.getElementById('dw-aff-dismiss')?.addEventListener('click', () => banner.remove());
    }
    if (asin) init();
  }

  // Bulk import: open each product in a background tab and extract with the SAME
  // live-DOM extractor single-product import uses (full data + video). Falls back
  // to fetch+DOMParser when chrome.runtime is unavailable (safe mode).
  async function importProductByUrl(url) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      const result = await chrome.runtime.sendMessage({ type: 'IMPORT_FROM_URL', url });
      return result || { success: false, error: 'No response' };
    }
    const resp = await fetch(url, {
      credentials: 'include',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': window.location.href,
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
      },
    });
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const data = extractProductDataFromDoc(doc);
    if (!data.product_name) return { success: false, error: 'No product data found' };
    return await fallbackImport(data);
  }

  // Live-DOM extraction on demand (used by background.js during bulk imports).
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg && msg.type === 'EXTRACT_PRODUCT_DATA') {
        try {
          const data = extractProductData();
          sendResponse(data || { success: false });
        } catch (e) { console.error('[DawnWire]', e); sendResponse({ success: false }); }
      }
      return false;
    });
  }

  function createSearchBanner() {
    const existing = document.getElementById('dw-import-banner');
    if (existing) existing.remove();

    const results = extractSearchResults();
    if (results.length === 0) return;

    function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    const banner = document.createElement('div');
    banner.id = 'dw-import-banner';
    banner.className = 'dw-banner';
    banner.innerHTML = `
      <div class="dw-banner-content">
        <span class="dw-banner-icon">&#9889;</span>
        <div class="dw-banner-preview">
          <span class="dw-banner-title">Found ${results.length} products on ${SITE}</span>
          <div class="dw-banner-row">
            ${results.slice(0, 5).map(r => '<span class="dw-badge-variation">' + esc(r.title.substring(0, 35)) + (r.price ? ' · ' + r.price : '') + '</span>').join('')}
            ${results.length > 5 ? '<span class="dw-badge-variation">+ ' + (results.length - 5) + ' more</span>' : ''}
          </div>
        </div>
        <div class="dw-btn-row">
          <button id="dw-import-search-btn" class="dw-btn dw-btn-primary">Import All (${results.length})</button>
          <button id="dw-dismiss-btn" class="dw-btn dw-btn-outline">Skip</button>
        </div>
      </div>
      <div id="dw-progress-bar" style="display:none;margin-top:10px;height:4px;background:#1a3366;border-radius:2px;overflow:hidden;">
        <div id="dw-progress-fill" style="height:100%;background:#246BFF;width:0%;transition:width 0.3s ease;"></div>
      </div>
      <div id="dw-progress-text" style="display:none;font-size:10px;color:#8899bb;margin-top:6px;text-align:center;"></div>
    `;
    document.body.prepend(banner);

    document.getElementById('dw-import-search-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('dw-import-search-btn');
      const progressBar = document.getElementById('dw-progress-bar');
      const progressFill = document.getElementById('dw-progress-fill');
      const progressText = document.getElementById('dw-progress-text');
      if (btn) { btn.textContent = 'Importing...'; btn.disabled = true; }
      if (progressBar) progressBar.style.display = 'block';
      if (progressText) progressText.style.display = 'block';

      // Process 3 products concurrently (same as background queue CONCURRENCY)
      const CONCURRENCY = 3;
      let success = 0;
      let failed = 0;
      let idx = 0;

      async function importNext() {
        while (idx < results.length) {
          const i = idx++;
          const r = results[i];
          if (progressText) progressText.textContent = `Importing ${i + 1}/${results.length}: ${r.title.substring(0, 40)}...`;
          if (progressFill) progressFill.style.width = ((i / results.length) * 100) + '%';
          try {
            const result = await importProductByUrl(r.url);
            if (result?.success) success++; else failed++;
          } catch (e) { console.error('[DawnWire]', e); failed++; }
        }
      }

      // Launch CONCURRENCY workers
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, results.length) }, () => importNext()));

      if (progressFill) progressFill.style.width = '100%';
      if (progressText) progressText.textContent = `Done: ${success} imported, ${failed} failed`;
      showToast(`✅ Imported ${success} products${failed ? ', ' + failed + ' failed' : ''}`, failed > 0 ? 'error' : 'success');
      if (btn) { btn.textContent = `Import All (${results.length})`; btn.disabled = false; }
      setTimeout(() => { if (progressBar) progressBar.style.display = 'none'; if (progressText) progressText.style.display = 'none'; }, 3000);
      if (success > 0) setTimeout(() => banner.remove(), 3000);
    });

    document.getElementById('dw-dismiss-btn')?.addEventListener('click', () => banner.remove());
  }

  function createBrandStoreBanner() {
    const existing = document.getElementById('dw-import-banner');
    if (existing) existing.remove();

    const products = extractBrandStoreProducts();
    if (products.length === 0) return;

    function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    const banner = document.createElement('div');
    banner.id = 'dw-import-banner';
    banner.className = 'dw-banner';
    banner.innerHTML = `
      <div class="dw-banner-content">
        <span class="dw-banner-icon">🏪</span>
        <div class="dw-banner-preview">
          <span class="dw-banner-title">Brand Store — ${products.length} products found</span>
          <div class="dw-banner-row">
            ${products.slice(0, 5).map(p => '<span class="dw-badge-variation">' + esc(p.title.substring(0, 35)) + '</span>').join('')}
            ${products.length > 5 ? '<span class="dw-badge-variation">+ ' + (products.length - 5) + ' more</span>' : ''}
          </div>
        </div>
        <div class="dw-btn-row">
          <button id="dw-import-store-btn" class="dw-btn dw-btn-primary">Import Store (${products.length})</button>
          <button id="dw-dismiss-btn" class="dw-btn dw-btn-outline">Skip</button>
        </div>
      </div>
    `;
    document.body.prepend(banner);

    document.getElementById('dw-import-store-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('dw-import-store-btn');
      if (btn) { btn.textContent = 'Importing...'; btn.disabled = true; }
      const CONCURRENCY = 3;
      let success = 0; let idx = 0;
      async function importNext() {
        while (idx < products.length) {
          const i = idx++;
          try {
            const result = await importProductByUrl(products[i].url);
            if (result?.success) success++;
          } catch (e) { console.error('[DawnWire]', e); }
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, products.length) }, () => importNext()));
      showToast(`✅ Imported ${success}/${products.length} products from store`, success > 0 ? 'success' : 'error');
      if (btn) { btn.textContent = 'Import Store (' + products.length + ')'; btn.disabled = false; }
      if (success > 0) banner.remove();
    });

    document.getElementById('dw-dismiss-btn')?.addEventListener('click', () => banner.remove());
  }

  function createWishlistBanner() {
    const existing = document.getElementById('dw-import-banner');
    if (existing) existing.remove();

    const products = extractWishlistProducts();
    if (products.length === 0) return;

    function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

    const banner = document.createElement('div');
    banner.id = 'dw-import-banner';
    banner.className = 'dw-banner';
    banner.innerHTML = `
      <div class="dw-banner-content">
        <span class="dw-banner-icon">💝</span>
        <div class="dw-banner-preview">
          <span class="dw-banner-title">Wishlist — ${products.length} items</span>
          <div class="dw-banner-row">
            ${products.slice(0, 5).map(p => '<span class="dw-badge-variation">' + esc(p.title.substring(0, 35)) + '</span>').join('')}
            ${products.length > 5 ? '<span class="dw-badge-variation">+ ' + (products.length - 5) + ' more</span>' : ''}
          </div>
        </div>
        <div class="dw-btn-row">
          <button id="dw-import-wishlist-btn" class="dw-btn dw-btn-primary">Import Wishlist (${products.length})</button>
          <button id="dw-dismiss-btn" class="dw-btn dw-btn-outline">Skip</button>
        </div>
      </div>
    `;
    document.body.prepend(banner);

    document.getElementById('dw-import-wishlist-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('dw-import-wishlist-btn');
      if (btn) { btn.textContent = 'Importing...'; btn.disabled = true; }
      const CONCURRENCY = 3;
      let success = 0; let idx = 0;
      async function importNext() {
        while (idx < products.length) {
          const i = idx++;
          try {
            const result = await importProductByUrl(products[i].url);
            if (result?.success) success++;
          } catch (e) { console.error('[DawnWire]', e); }
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, products.length) }, () => importNext()));
      showToast(`✅ Imported ${success}/${products.length} from wishlist`, success > 0 ? 'success' : 'error');
      if (btn) { btn.textContent = 'Import Wishlist (' + products.length + ')'; btn.disabled = false; }
      if (success > 0) banner.remove();
    });

    document.getElementById('dw-dismiss-btn')?.addEventListener('click', () => banner.remove());
  }

  function extractProductDataFromDoc(doc) {
    if (isAmazon()) {
      const common = extractCommonFields(doc, 'amazon');
      const { product_name, product_image, price, rating, reviewCount, brand, key_features } = common;

      const asin = (doc.querySelector('input[name="ASIN"]')?.getAttribute('value')) || '';
      const amazon_url = 'https://www.amazon.com/dp/' + asin;

      let review_summary = '';
      try {
        const desc = doc.querySelector('#productDescription p, #productDescription, #aplus p, [data-feature-name="productDescription"] p, #productOverview_feature_div');
        if (desc) review_summary = desc.textContent.trim().substring(0, 3000);
        if ((review_summary || '').length < 100) {
          const aplus = doc.querySelector('#aplus p, #aplus .a-section p, [data-feature-name="aplus"] p');
          if (aplus) review_summary = aplus.textContent.trim().substring(0, 3000);
        }
      } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }

      const gallery = [];
      const seen = new Set();
      doc.querySelectorAll('#altImages img[src*="images"], #altImages img[src*="media"], #altImages .imageThumbnail img, #altImages .a-button-thumbnail img, .a-spacing-small img[src*="images"], [data-a-carousel-options] img[src*="media"], li[data-csa-c-type="thumb"] img, #imageBlockThumbs img[src*="images"], [data-csa-c-slot-id="thumbnail-slot"] img').forEach(img => {
        let src = img.getAttribute('src') || img.getAttribute('data-old-hires') || '';
        src = src.replace(/\._[^.]*_\./g, '.');
        if (src && !seen.has(src)) { seen.add(src); gallery.push(src); }
      });
      if (product_image && !gallery.includes(product_image)) gallery.unshift(product_image);

      const variations = extractVariations(doc);
      const discount = extractDiscountInfo(doc);
      const detailBullets = extractDetailBullets(doc);
      const stockStatus = extractStockStatus(doc);
      const dealBadge = extractDealInfo(doc);
      const bestSellersRank = extractBestSellersRank(doc);
      const category = extractCategory(doc);
      const bestFor = mapCategoryToBestFor(category);
      const videoUrl = extractVideoUrl(doc);

      // Enhanced extractions (matching single-product import)
      let ingredients = '';
      let unitSize = '';
      let unitPrice = '';
      let bsrDetail = [];
      let reviewHighlights = '';
      if (isAmazon()) {
        ingredients = extractIngredients(doc);
        const unitInfo = extractUnitInfo(doc);
        unitSize = unitInfo.unitSize || '';
        unitPrice = unitInfo.unitPrice || '';
        bsrDetail = extractBSRDetail(doc);
        reviewHighlights = extractReviewHighlights(doc);
        if ((review_summary || '').length < 200 && reviewHighlights) {
          review_summary = (review_summary ? review_summary + ' | ' : '') + 'Customer insights: ' + reviewHighlights.substring(0, 500);
        }
      }

      let reviews = [];
      let reviewStats = { total: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
      try {
        const rd = extractReviews(doc);
        reviews = rd.reviews || [];
        reviewStats = rd.reviewStats || reviewStats;
      } catch (e) { console.error('[DawnWire]', e); /* toasts removed for cleaner UX */ }
      let rCount = reviewCount;
      let rRating = rating;
      if (reviewStats.total > 0 && (!rCount || rCount === 0)) {
        rCount = reviewStats.total;
      }
      if (reviewStats.average > 0 && !rRating) {
        rRating = reviewStats.average;
      }

      let priceRange;
      if (variations.length > 0) {
        const allPrices = [];
        variations.forEach(dim => dim.options.forEach(o => { if (o.price) allPrices.push(o.price); }));
        if (allPrices.length > 1) {
          const toNum = (s) => parseFloat(s.replace(/[^0-9.]/g, ''));
          const sorted = [...allPrices].sort((a, b) => toNum(a) - toNum(b));
          priceRange = { low: sorted[0], high: sorted[sorted.length - 1] };
        }
      }

      const specs = {};
      const specMappings = {
        'Manufacturer': 'manufacturer', 'Unit Count': 'unitCount', 'Target Use Body Part': 'targetUse',
        'Special Features': 'specialFeatures', 'Target Audience': 'targetAudience', 'UPC': 'upc',
        'Model Number': 'modelNumber', 'Part Number': 'partNumber', 'Best Sellers Rank': 'bestSellersRank',
        'Item model number': 'modelNumber', 'Number of Items': 'unitCount', 'Package Dimensions': 'packageDimensions',
        'Item Weight': 'itemWeight',
      };
      Object.entries(detailBullets).forEach(([label, value]) => {
        const key = specMappings[label] || label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_+$/, '');
        specs[key] = value;
      });
      if (bestSellersRank) specs.bestSellersRank = bestSellersRank;

      // The offline (fetch+DOMParser) path has no live SiteStripe toolbar, so no
    // affiliate capture — the server/background will mint a tagged URL instead.
    return { product_name, brand, product_image, price, rating: rRating, reviewCount: rCount, key_features, pros: [], cons: [], review_summary, amazon_url, asin, gallery, videoUrl, variations, listPrice: discount.listPrice, savings: discount.savings, priceRange, specs, detailBullets, stockStatus, dealBadge, bestSellersRank, category, bestFor, source: 'amazon', ingredients, unitSize, unitPrice, bsrDetail, reviewHighlights, reviews, reviewStats, affiliate_url: '' };
    }

    // Generic fallback for other stores — keep the canonical page URL so the
    // product can still carry commission tracking once a network is configured.
    const get = (sel) => doc.querySelector(sel);
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || window.location.href.split('?')[0].split('#')[0];
    return { product_name: get('h1')?.textContent?.trim() || get('[class*="title"]')?.textContent?.trim() || document.title.replace(/\s*[|\-–].*$/, '').trim() || '', brand: '', product_image: get('img[src]')?.getAttribute('src') || '', price: get('[class*="price"]')?.textContent?.trim() || '', rating: 0, reviewCount: 0, key_features: [], pros: [], cons: [], review_summary: '', amazon_url: canonical, asin: '', gallery: [], videoUrl: '', variations: [], listPrice: '', savings: '', priceRange: undefined, specs: {}, detailBullets: {}, stockStatus: 'in_stock', dealBadge: '', bestSellersRank: '', category: '', bestFor: '', source: 'other', ingredients: '', unitSize: '', unitPrice: '', bsrDetail: [], reviewHighlights: '', reviews: [], reviewStats: { total: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } };
  }

  if (isProductPage()) {
    const waitForInterstitial = setInterval(() => {
      if (isAmazon() && !document.getElementById('productTitle')) return;
      if (isWalmart() && !document.querySelector('[data-testid="product-title"], .prod-title')) return;
      if (isBestBuy() && !document.querySelector('.sku-title')) return;
      clearInterval(waitForInterstitial);
      setTimeout(createBanner, 1500);
      setTimeout(createAffiliateBanner, 2200);
    }, 500);
    setTimeout(() => clearInterval(waitForInterstitial), 15000);
  } else if (isBrandStorePage()) {
    setTimeout(createBrandStoreBanner, 2000);
  } else if (isWishlistPage()) {
    setTimeout(createWishlistBanner, 2000);
  } else if (isSearchPage()) {
    setTimeout(createSearchBanner, 2000);
  }
})();
