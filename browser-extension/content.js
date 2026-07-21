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

  async function fallbackImport(data) {
    const { apiUrl, apiToken } = await chromeStorageGet();
    if (!apiToken) return { success: false, error: 'API token not configured. Open extension popup to set it up.' };
    const baseUrl = (apiUrl || 'https://www.dawnwire.com').replace(/\/$/, '');
    try {
      const res = await fetch(baseUrl + '/api/admin/seo/product-reviews/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error || 'HTTP ' + res.status };
      const id = result.id || result.review?.id;
      let affiliateLink = null;
      if (id && data.amazon_url) {
        try {
          const slug = data.asin || result.slug || 'product-' + Date.now();
          const affRes = await fetch(baseUrl + '/api/admin/affiliate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken },
            body: JSON.stringify({ title: (data.product_name || '').substring(0, 100), affiliate_url: data.amazon_url, short_slug: slug, button_text: 'Buy Now', status: 'active', no_follow: true, sponsored: true, open_in_new_tab: true })
          });
          if (affRes.ok) { const affData = await affRes.json(); affiliateLink = '/go/' + (affData.short_slug || affData.slug || slug); }
        } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
      }
      if (id && data.asin) { try { await fetch(baseUrl + '/api/admin/seo/product-reviews/fetch-video/' + id, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiToken } }); } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); } }
      if (id) { try { await fetch(baseUrl + '/api/admin/seo/product-reviews/generate-article/' + id, { method: 'POST', headers: { 'Authorization': 'Bearer ' + apiToken } }); } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); } }
      return { success: true, review: result, id, affiliateLink, generatedArticle: true };
    } catch (e) { return { success: false, error: e.message }; }
  }

  async function chromeStorageGet() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        return await chrome.storage.sync.get(['apiUrl', 'apiToken']);
      }
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
    try {
      const apiUrl = localStorage.getItem('dw_api_url') || '';
      const apiToken = localStorage.getItem('dw_api_token') || '';
      if (apiToken) return { apiUrl, apiToken };
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
    return { apiUrl: '', apiToken: '' };
  }

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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
    return '';
  }

  // Category -> best_for mapping
  function mapCategoryToBestFor(category) {
    const cat = (category || '').toLowerCase();
    const map = {
      'gaming': 'Gaming',
      'video game': 'Gaming',
      'electronics': 'Electronics',
      'computer': 'Computers',
      'laptop': 'Computers',
      'software': 'Software',
      'phone': 'Mobile',
      'smartphone': 'Mobile',
      'tablet': 'Mobile',
      'headphone': 'Audio',
      'speaker': 'Audio',
      'audio': 'Audio',
      'fitness': 'Fitness',
      'exercise': 'Fitness',
      'sport': 'Sports & Outdoors',
      'outdoor': 'Sports & Outdoors',
      'kitchen': 'Home & Kitchen',
      'home': 'Home & Kitchen',
      'office': 'Office',
      'tool': 'Tools',
      'automotive': 'Automotive',
      'car': 'Automotive',
      'baby': 'Baby',
      'toy': 'Toys & Games',
      'game': 'Toys & Games',
      'book': 'Books',
      'kindle': 'Books',
      'cloth': 'Clothing',
      'shoe': 'Shoes',
      'jewelry': 'Jewelry',
      'watch': 'Watches',
      'beauty': 'Beauty',
      'personal care': 'Personal Care',
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
    return '';
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
    return results.slice(0, 30);
  }

  function cleanPrice(str) {
    if (!str) return '';
    const cleaned = str.replace(/[^\d.,]/g, '').trim();
    const match = cleaned.match(/(\d+)[.,]?(\d{0,2})/);
    if (!match) return '$' + cleaned;
    return '$' + match[1] + (match[2] ? '.' + match[2].replace(/^0+/, '') : '');
  }

  function extractVariations() {
    const variations = [];
    try {
      if (isAmazon()) {
        const dims = document.querySelectorAll('[id^="variation_"]');
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
    return '';
  }

  function extractDiscountInfo() {
    try {
      let listPrice = '';
      let savings = '';
      if (isAmazon()) {
        listPrice = document.querySelector('.a-text-price.a-text-price-basis .a-offscreen')?.textContent?.trim()
          || document.querySelector('#listPrice')?.textContent?.trim()
          || document.querySelector('.a-text-price .a-offscreen')?.textContent?.trim()
          || '';
        const savingsEl = document.querySelector('.a-price-savings, .a-color-price.a-text-price, [id*="savings"]');
        if (savingsEl) {
          savings = savingsEl.textContent.replace(/\s+/g, ' ').trim();
          if (!savings.toLowerCase().includes('save')) {
            const priceWhole = document.querySelector('.a-price-whole')?.textContent?.replace(/[^\d]/g, '') || '';
            const listNum = listPrice.replace(/[^\d.]/g, '');
            if (listNum && priceWhole) {
              const diff = parseFloat(listNum) - parseFloat(priceWhole);
              const pct = Math.round((diff / parseFloat(listNum)) * 100);
              if (diff > 0) savings = `Save $${diff.toFixed(2)} (${pct}%)`;
            }
          }
        } else {
          const priceWhole = document.querySelector('.a-price-whole')?.textContent?.replace(/[^\d]/g, '') || '';
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
    } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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

      const imgEl = doc.getElementById('landingImage');
      if (imgEl) {
        product_image = imgEl.getAttribute('src') || imgEl.getAttribute('data-old-hires') || '';
        if (!product_image) {
          try { const d = JSON.parse(imgEl.getAttribute('data-a-dynamic-image') || '{}'); product_image = Object.keys(d)[0] || ''; } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
      } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }

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
      } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }

      const bylineDoc = doc.getElementById('bylineInfo');
      if (bylineDoc) {
        try {
          let t = bylineDoc.textContent.trim();
          const m = t.match(/(?:Brand:\s*|Visit the\s+)(.+?)(?:\s+Store)?$/i);
          brand = m ? m[1].trim() : t.replace(/^Brand:\s*/i, '');
        } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
        const desc = document.querySelector('#productDescription, #productDescription p, #aplus p, [data-feature-name="productDescription"] p, #productOverview_feature_div');
        if (desc) review_summary = desc.textContent.trim().substring(0, 500);
      } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }

      const seen = new Set();
      document.querySelectorAll('#altImages img[src*="images"], #altImages img[src*="media"]').forEach(img => {
        let src = img.getAttribute('src') || img.getAttribute('data-old-hires') || '';
        src = src.replace(/\._[^.]*_\./g, '.');
        if (src && !seen.has(src)) { seen.add(src); gallery.push(src); }
      });
      if (product_image && !gallery.includes(product_image)) gallery.unshift(product_image);
      videoUrl = extractVideoUrl();
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
      } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
      try {
        const brandEl = document.querySelector('[data-testid="brand"], .prod-brand, a[data-testid="brand-link"]');
        if (brandEl) brand = brandEl.textContent.trim();
      } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
      } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
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
            ${variationsDisplay.map(v => '<span class="dw-badge-variation">' + v + '</span>').join('')}
          </div>
        </div>
        <div class="dw-btn-row">
          <button id="dw-import-btn" class="dw-btn dw-btn-primary">Import to DawnWire</button>
          <button id="dw-dismiss-btn" class="dw-btn dw-btn-outline">Skip</button>
        </div>
      </div>
    `;
    document.body.prepend(banner);

    document.getElementById('dw-import-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('dw-import-btn');
      if (btn) { btn.textContent = 'Importing...'; btn.disabled = true; }
      try {
        const d = extractProductData();
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

      let success = 0;
      let failed = 0;
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (progressText) progressText.textContent = `Importing ${i + 1}/${results.length}: ${r.title.substring(0, 40)}...`;
        if (progressFill) progressFill.style.width = ((i / results.length) * 100) + '%';
        try {
          const resp = await fetch(r.url);
          const html = await resp.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const data = extractProductDataFromDoc(doc);
          if (data.product_name) {
            const result = await sendMessage({ type: 'IMPORT_PRODUCT', data });
            if (result?.success) success++;
            else failed++;
          } else { failed++; }
        } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); failed++; }
      }
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
      let success = 0;
      for (const p of products) {
        try {
          const resp = await fetch(p.url);
          const html = await resp.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const data = extractProductDataFromDoc(doc);
          if (data.product_name) {
            await sendMessage({ type: 'IMPORT_PRODUCT', data });
            success++;
          }
        } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
      }
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
      let success = 0;
      for (const p of products) {
        try {
          const resp = await fetch(p.url);
          const html = await resp.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const data = extractProductDataFromDoc(doc);
          if (data.product_name) {
            await sendMessage({ type: 'IMPORT_PRODUCT', data });
            success++;
          }
        } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }
      }
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

      const detailBullets = {};
      try {
        doc.querySelectorAll('#productDetails_detailBullets_sections1 tr, #detailBullets_feature_div .a-list-item').forEach(row => {
          const label = row.querySelector('th, .a-text-bold')?.textContent?.replace(/[:\s]+$/, '').trim();
          const value = row.querySelector('td, span:not(.a-text-bold)')?.textContent?.trim();
          if (label && value) detailBullets[label] = value;
        });
      } catch (e) { console.error('[DawnWire]', e); showToast('Error: ' + (e.message || 'Unknown'), 'error'); }

      const stockStatus = extractStockStatus(doc);
      const bestSellersRank = extractBestSellersRank(doc);
      const category = extractCategory(doc);
      const bestFor = mapCategoryToBestFor(category);
      const videoUrl = extractVideoUrl(doc);

      return { product_name, brand, product_image, price, rating, reviewCount, key_features, pros: [], cons: [], review_summary: '', amazon_url, asin, gallery: [], videoUrl, variations: [], listPrice: '', savings: '', priceRange: undefined, specs: {}, detailBullets, stockStatus, dealBadge: '', bestSellersRank, category, bestFor, source: 'amazon' };
    }

    // Generic fallback for other stores
    const get = (sel) => doc.querySelector(sel);
    return { product_name: get('h1')?.textContent?.trim() || '', brand: '', product_image: get('img[src]')?.getAttribute('src') || '', price: get('[class*="price"]')?.textContent?.trim() || '', rating: 0, reviewCount: 0, key_features: [], pros: [], cons: [], review_summary: '', amazon_url: '', asin: '', gallery: [], videoUrl: '', variations: [], listPrice: '', savings: '', priceRange: undefined, specs: {}, detailBullets: {}, stockStatus: 'in_stock', dealBadge: '', bestSellersRank: '', category: '', bestFor: '', source: 'other' };
  }

  if (isProductPage()) {
    const waitForInterstitial = setInterval(() => {
      if (isAmazon() && !document.getElementById('productTitle')) return;
      if (isWalmart() && !document.querySelector('[data-testid="product-title"], .prod-title')) return;
      if (isBestBuy() && !document.querySelector('.sku-title')) return;
      clearInterval(waitForInterstitial);
      setTimeout(createBanner, 1500);
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
