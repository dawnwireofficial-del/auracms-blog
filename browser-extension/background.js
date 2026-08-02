const DEFAULT_API_URL = 'https://www.dawnwire.com';

let importQueue = [];
let queueRunning = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'IMPORT_PRODUCT') {
    handleImport(message.data).then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (message.type === 'IMPORT_BATCH') {
    addToQueue(message.products, sender.tab?.id);
    sendResponse({ queued: message.products.length });
    return false;
  }
  if (message.type === 'GET_QUEUE_STATUS') {
    sendResponse({ queueLength: importQueue.length, running: queueRunning });
    return false;
  }
  if (message.type === 'TEST_CONNECTION') {
    testConnection().then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

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

async function handleImport(data) {
  const { apiToken } = await getSettings();
  if (!apiToken) throw new Error('API token not configured. Open extension popup to set it up.');

  const baseUrl = (await getSettings()).apiUrl.replace(/\/$/, '');
  const headers = await apiHeaders();

  // 1. Check for duplicate by ASIN
  if (data.asin) {
    const dupRes = await fetch(baseUrl + '/api/admin/seo/product-reviews/check-duplicate?asin=' + encodeURIComponent(data.asin), { headers });
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

  // 3. Auto-create a cloaked affiliate link
  let affiliateLink = null;
  if (reviewId && data.amazon_url) {
    try {
      const slug = data.asin || (result.review?.slug || result.slug || 'product-' + Date.now());
      const affRes = await fetch(baseUrl + '/api/admin/affiliate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: data.product_name?.substring(0, 100) || 'Product',
          destinationUrl: data.amazon_url,
          affiliate_url: data.amazon_url,
          short_slug: slug,
          button_text: 'Buy Now',
          status: 'active',
          no_follow: true,
          sponsored: true,
          open_in_new_tab: true,
          category_id: null,
          post_id: null,
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

  // 6. Optionally trigger AI article generation
  let generatedArticle = false;
  if (reviewId && data.amazon_url) {
    try {
      const genRes = await fetch(baseUrl + '/api/admin/seo/product-reviews/generate-article/' + reviewId, {
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
