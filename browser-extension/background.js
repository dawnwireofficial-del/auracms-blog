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
          body: JSON.stringify({
            price: data.price || null,
            original_price: data.listPrice || null,
            rating: data.rating || 0,
            stock_status: data.stockStatus || 'in_stock',
            deal_badge: data.dealBadge || null,
            status: 'published',
            review_summary: data.review_summary || null,
            key_features: data.key_features || [],
            pros: data.pros || [],
            cons: data.cons || [],
            best_for: data.bestFor || null,
            specs: data.specs || null,
          })
        });
        if (updateRes.ok) {
          return { success: true, updated: true, id: dupData.id };
        }
      }
    }
  }

  // 2. Create the product review
  const res = await fetch(baseUrl + '/api/admin/seo/product-reviews/import', {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
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

  // 5. Optionally trigger AI article generation
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

  return { success: true, review: result, id: reviewId, affiliateLink, generatedArticle, videoFetched };
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
