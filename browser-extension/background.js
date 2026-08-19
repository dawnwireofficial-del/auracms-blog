const DEFAULT_API_URL = 'https://www.dawnwire.com';

let importQueue = [];
let queueRunning = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'IMPORT_PRODUCT') {
    handleImport(message.data).then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (message.type === 'IMPORT_FROM_URL') {
    // Bulk import: open the product in a background tab, extract with the same
    // live-DOM path as single-product import, then import & close the tab.
    importFromUrl(message.url).then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (message.type === 'IMPORT_BATCH') {
    addToQueue(message.products, sender.tab?.id);
    sendResponse({ queued: message.products.length });
    return false;
  }
  if (message.type === 'GET_QUEUE_STATUS') {
    sendResponse({
      queueLength: importQueue.length,
      running: queueRunning,
      items: importQueue.map(item => ({
        title: item.data.product_name?.substring(0, 40) || 'Unknown',
        status: item.status
      }))
    });
    return false;
  }
  if (message.type === 'TEST_CONNECTION') {
    testConnection().then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  // Auto-import: content script asks if auto-import is enabled for this URL
  if (message.type === 'CHECK_AUTO_IMPORT') {
    checkAutoImport(message.url).then(sendResponse).catch(() => sendResponse({ autoImport: false }));
    return true;
  }
});

// Listen for tab updates to trigger auto-import
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  // Check if auto-import is enabled
  const settings = await chrome.storage.sync.get(['autoImport', 'apiToken']);
  if (!settings.autoImport || !settings.apiToken) return;

  // Check if this is a supported product page
  if (!isSupportedProductUrl(tab.url)) return;

  // Small delay to let page settle
  setTimeout(async () => {
    try {
      // Check if already imported
      const base = (await getSettings()).apiUrl;
      const headers = await apiHeaders();
      const check = await fetch(base + '/api/admin/seo/product-reviews/check-duplicate?' + new URLSearchParams({ url: tab.url }), { headers });
      if (check.ok) {
        const dup = await check.json();
        if (dup.duplicate) return; // already imported
      }

      // Extract and import
      const data = await extractFromTab(tab.id);
      if (data && data.product_name) {
        const result = await handleImport(data);
        // Show a notification
        chrome.notifications?.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'DawnWire Auto-Import',
          message: `Imported: ${data.product_name.substring(0, 60)}`
        }).catch(() => {});
      }
    } catch (e) {
      console.error('[DawnWire AutoImport]', e);
    }
  }, 2000);
});

function isSupportedProductUrl(url) {
  const patterns = [
    /amazon\.\w+\/(dp|gp\/product|product)\/\w+/i,
    /amzn\.to\/\w+/i,
    /walmart\.com\/ip\//i,
    /bestbuy\.com\/.*\/product/i,
    /aliexpress\.com\/item/i,
    /ebay\.\w+\/itm\//i,
  ];
  return patterns.some(p => p.test(url));
}

async function extractFromTab(tabId) {
  await waitForTabComplete(tabId);
  await new Promise(r => setTimeout(r, 1500));
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_PRODUCT_DATA' });
      if (res && res.product_name) return res;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1200));
  }
  return null;
}

async function checkAutoImport(url) {
  const settings = await chrome.storage.sync.get(['autoImport', 'apiToken']);
  return { autoImport: !!settings.autoImport && !!settings.apiToken };
}

async function getSettings() {
  const result = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
  return { apiUrl: result.apiUrl || DEFAULT_API_URL, apiToken: result.apiToken || '' };
}

function apiUrl() {
  return getSettings().then(s => s.apiUrl.replace(/\/$/, ''));
}

function apiHeaders() {
  return getSettings().then(s => ({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + s.apiToken
  }));
}

// Full product payload for a reimport — refreshes reviews, images, specs, ASIN,
// price, rating etc. on the existing row instead of only patching a few fields.
function fullImportPayload(data) {
  const specs = {
    ...(data.specs || {}),
    asin: data.asin || '',
    source: data.source || (data.amazon_url?.includes('amazon.') ? 'amazon' : 'other'),
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
  return {
    product_name: data.product_name || null,
    brand: data.brand || null,
    product_image: data.product_image || null,
    affiliate_url: data.amazon_url || null,
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForTabComplete(tabId, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === 'complete') return true;
    } catch (e) { return false; }
    await sleep(500);
  }
  return false;
}

// Opens the product in a background tab, lets its JS render, then asks the
// content script to extract full live-DOM data (identical to single-product
// import). Imports via handleImport (dup-check → create → article → video).
async function importFromUrl(url) {
  let tab;
  try {
    tab = await chrome.tabs.create({ url, active: false });
  } catch (e) {
    throw new Error('Could not open product tab: ' + e.message);
  }
  try {
    await waitForTabComplete(tab.id);
    await sleep(1500); // let dynamic content (reviews, video, A+) render
    let data = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const res = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_PRODUCT_DATA' });
        if (res && res.product_name) { data = res; break; }
      } catch (e) { /* content script not injected/ready yet */ }
      await sleep(1200);
    }
    if (!data || !data.product_name) {
      return { success: false, error: 'Could not extract product from ' + url };
    }
    return await handleImport(data);
  } finally {
    try { await chrome.tabs.remove(tab.id); } catch (e) {}
  }
}

async function handleImport(data) {
  const { apiToken } = await getSettings();
  if (!apiToken) throw new Error('API token not configured. Open extension popup to set it up.');

  const baseUrl = (await getSettings()).apiUrl.replace(/\/$/, '');
  const headers = await apiHeaders();

  // 1. Check for duplicate by ASIN or name
  const dupQuery = new URLSearchParams();
  if (data.asin) dupQuery.set('asin', data.asin);
  if (data.product_name) dupQuery.set('name', data.product_name);
  if (dupQuery.toString()) {
    const dupRes = await fetch(baseUrl + '/api/admin/seo/product-reviews/check-duplicate?' + dupQuery.toString(), { headers });
    if (dupRes.ok) {
      const dupData = await dupRes.json();
      if (dupData.duplicate) {
        // Update existing instead of creating new
        const updateRes = await fetch(baseUrl + '/api/admin/seo/product-reviews/' + dupData.id, {
          method: 'PUT',
          headers,
          body: JSON.stringify(fullImportPayload(data))
        });
        if (updateRes.ok) {
          // Auto-process the updated duplicate (fill missing SEO/category/brand)
          try {
            await fetch(baseUrl + '/api/admin/seo/product-reviews/auto-process/' + dupData.id, {
              method: 'POST',
              headers
            });
          } catch (e) { console.error('[DawnWire BG]', e); }
          // Refresh video from Amazon (uses ASIN on the existing row)
          try {
            await fetch(baseUrl + '/api/admin/seo/product-reviews/fetch-video/' + dupData.id, {
              method: 'POST',
              headers
            });
          } catch (e) { console.error('[DawnWire BG]', e); }
          return { success: true, updated: true, id: dupData.id };
        }
      }
    }
  }

  // 2. Create the product review
  const res = await fetch(baseUrl + '/api/admin/seo/product-reviews/import', {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...data })
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || 'HTTP ' + res.status);

  const reviewId = result.id || result.review?.id;

  // 3. Auto-create a cloaked affiliate link (with tag=dawnwire-20 for commission)
  let affiliateLink = null;
  const rawUrl = data.amazon_url || data.affiliate_url || '';
  if (reviewId && rawUrl) {
    try {
      const slug = data.asin || (result.review?.slug || result.slug || 'product-' + Date.now());
      // Ensure the affiliate tag is present
      let taggedUrl = rawUrl;
      if (taggedUrl.includes('amazon') && !taggedUrl.includes('tag=')) {
        taggedUrl += (taggedUrl.includes('?') ? '&' : '?') + 'tag=dawnwire-20';
      } else if (taggedUrl.includes('amazon') && !taggedUrl.includes('dawnwire-20')) {
        taggedUrl = taggedUrl.replace(/tag=[^&]+/, 'tag=dawnwire-20');
      }
      const affRes = await fetch(baseUrl + '/api/admin/affiliate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: data.product_name?.substring(0, 100) || 'Product',
          destinationUrl: taggedUrl,
          affiliateUrl: taggedUrl,
          shortSlug: slug,
          buttonText: 'Buy Now',
          status: 'active',
          noFollow: true,
          sponsored: true,
          openInNewTab: true,
          categoryId: null,
          postId: null,
        })
      });
      if (affRes.ok) {
        const affData = await affRes.json();
        affiliateLink = '/go/' + (affData.short_slug || affData.slug || slug);
      }
    } catch (e) { console.error('[DawnWire BG]', e); }
  }

  // 4. Trigger server-side video fetch from Amazon (uses ASIN)
  let videoFetched = false;
  if (reviewId) {
    try {
      const videoRes = await fetch(baseUrl + '/api/admin/seo/product-reviews/fetch-video/' + reviewId, {
        method: 'POST',
        headers
      });
      if (videoRes.ok) {
        const videoData = await videoRes.json();
        if (videoData.videoUrl) videoFetched = true;
      }
    } catch (e) { console.error('[DawnWire BG]', e); }
  }

  // 5. Auto-process: brand + category detection + AI SEO generation (fills
  //    missing seo_title, description, keywords, best_for, verdict, score)
  let autoProcessed = false;
  if (reviewId) {
    try {
      const autoRes = await fetch(baseUrl + '/api/admin/seo/product-reviews/auto-process/' + reviewId, {
        method: 'POST',
        headers
      });
      if (autoRes.ok) autoProcessed = true;
    } catch (e) { console.error('[DawnWire BG]', e); }
  }

  // 6. Auto-generate a published AI article (+ design image) for this product
  let generatedArticle = false;
  if (reviewId && data.amazon_url) {
    try {
      const genRes = await fetch(baseUrl + '/api/admin/seo/auto-articles/generate/' + reviewId, {
        method: 'POST',
        headers
      });
      if (genRes.ok) generatedArticle = true;
    } catch (e) { console.error('[DawnWire BG]', e); }
  }

  return { success: true, review: result, id: reviewId, affiliateLink, generatedArticle, videoFetched, autoProcessed };
}

function addToQueue(products, tabId) {
  importQueue.push(...products.map(p => ({ data: p, status: 'pending' })));
  if (!queueRunning) processQueue(tabId);
}

async function processQueue(tabId) {
  queueRunning = true;
  notifyQueueStatus(tabId);

  const CONCURRENCY = 3;

  while (importQueue.length > 0) {
    const batch = importQueue.splice(0, CONCURRENCY);
    batch.forEach(item => { item.status = 'importing'; });
    notifyQueueStatus(tabId);

    await Promise.allSettled(batch.map(item =>
      handleImport(item.data).then(result => {
        item.status = result?.success ? 'done' : 'failed';
        item.result = result;
      }).catch(() => {
        item.status = 'failed';
      })
    ));

    for (const item of batch) {
      if (item.status === 'failed') {
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount < 10) {
          const delay = Math.min(1000 * Math.pow(2, item.retryCount), 30000);
          await new Promise(r => setTimeout(r, delay));
          item.status = 'pending';
          importQueue.push(item);
        }
      }
    }
    notifyQueueStatus(tabId);
  }

  queueRunning = false;
  notifyQueueStatus(tabId);
}

function notifyQueueStatus(tabId) {
  const status = {
    queueLength: importQueue.length,
    running: queueRunning,
    items: importQueue.map(item => ({
      title: item.data.product_name?.substring(0, 40) || 'Unknown',
      status: item.status
    }))
  };
  // Notify the popup if open
  chrome.runtime.sendMessage({ type: 'QUEUE_STATUS', status }).catch(() => {});
  // Also notify the content script tab if available
  if (tabId) {
    chrome.tabs.sendMessage(tabId, { type: 'QUEUE_STATUS', status }).catch(() => {});
  }
}

async function testConnection() {
  const { apiUrl, apiToken } = await getSettings();
  if (!apiToken) throw new Error('API token not configured');
  const res = await fetch(apiUrl.replace(/\/$/, '') + '/api/auth/me', {
    headers: { 'Authorization': 'Bearer ' + apiToken }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Connection failed');
  return { success: true, user: data };
}
