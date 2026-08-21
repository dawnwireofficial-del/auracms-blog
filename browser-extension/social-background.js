// ─── DawnWire Social Auto-Post Background Service Worker ──────────────────────
// Handles auto-pinning, scheduling, and background social media posting.

const DEFAULT_API_URL = 'https://www.dawnwire.com';

// ─── UTM Helper ──────────────────────────────────────────────────────────────
function withUTM(url, platform) {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', platform);
    u.searchParams.set('utm_medium', 'social');
    u.searchParams.set('utm_campaign', 'auto_social');
    return u.toString();
  } catch { return url; }
}

// ─── Auto-Pin Queue ──────────────────────────────────────────────────────────
let autoPinQueue = [];
let autoPinRunning = false;

// ─── Message Listener ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTO_PIN_PRODUCT') {
    autoPinProduct(message.data).then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'BATCH_AUTO_PIN') {
    batchAutoPin().then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'GET_PIN_STATS') {
    getPinStats().then(sendResponse).catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (message.type === 'SCHEDULE_PIN') {
    schedulePin(message.data).then(sendResponse).catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// ─── Auto-Pin Single Product ─────────────────────────────────────────────────
async function autoPinProduct(product) {
  const settings = await chrome.storage.sync.get(['pinterestToken', 'pinterestBoard']);

  if (!settings.pinterestToken || !settings.pinterestBoard) {
    return { success: false, error: 'Pinterest credentials not configured' };
  }

  const title = product.title
    ? `${product.title} — DawnWire Score ${product.editor_score || '?'}/10`
    : product.product_name || 'Product Review';

  const dawnwireUrl = `https://www.dawnwire.com/products/${product.slug || product.id}`;
  const link = withUTM(dawnwireUrl, 'pinterest');

  const description = [
    product.review_summary || '',
    product.final_verdict || '',
    product.best_for ? `Best for: ${product.best_for}` : '',
    product.price ? `Price: $${product.price}` : '',
    product.editor_score ? `DawnWire Editor Score: ${product.editor_score}/10` : '',
    '',
    `🔗 Full review: ${link}`,
    '#ProductReview #BestDeals #AmazonFinds #DawnWire',
  ].filter(Boolean).join('\n').substring(0, 500);

  const imageUrl = product.product_image || product.image || '';
  if (!imageUrl) return { success: false, error: 'No product image' };

  const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.pinterestToken}`,
    },
    body: JSON.stringify({
      board_id: settings.pinterestBoard,
      title: title.substring(0, 100),
      description,
      link,
      image_url: imageUrl,
    }),
  });

  const data = await pinRes.json();
  if (data.code && data.code !== 200) {
    return { success: false, error: data.message || 'Pinterest API error' };
  }

  // Log the pin
  await chrome.storage.local.get(['pinHistory'], async (result) => {
    const history = result.pinHistory || [];
    history.unshift({
      product: product.title || product.product_name,
      url: link,
      time: new Date().toISOString(),
      pinId: data.id,
    });
    await chrome.storage.local.set({ pinHistory: history.slice(0, 100) });
  });

  return { success: true, pinId: data.id };
}

// ─── Batch Auto-Pin ──────────────────────────────────────────────────────────
async function batchAutoPin() {
  if (autoPinRunning) return { success: false, error: 'Already running' };

  const settings = await chrome.storage.sync.get([
    'apiUrl', 'apiToken', 'pinterestToken', 'pinterestBoard',
    'autoPin', 'minScore', 'pinsPerDay'
  ]);

  if (!settings.pinterestToken || !settings.pinterestBoard) {
    return { success: false, error: 'Pinterest not configured' };
  }

  autoPinRunning = true;
  const results = [];

  try {
    // Fetch products from DawnWire API
    const apiUrl = settings.apiUrl || DEFAULT_API_URL;
    const res = await fetch(`${apiUrl}/api/public/product-reviews?limit=10&sort=editor_score&status=published`);
    const data = await res.json();
    const products = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

    // Get already pinned products
    const { pinHistory = [] } = await chrome.storage.local.get(['pinHistory']);
    const pinnedIds = new Set(pinHistory.map(p => p.url));

    // Filter and pin new products
    const minScore = settings.minScore || 6;
    const maxPins = settings.pinsPerDay || 10;
    let pinned = 0;

    for (const product of products) {
      if (pinned >= maxPins) break;

      const productUrl = withUTM(`https://www.dawnwire.com/products/${product.slug || product.id}`, 'pinterest');
      if (pinnedIds.has(productUrl)) continue;

      if ((product.editor_score || 0) < minScore) continue;

      const result = await autoPinProduct(product);
      results.push({
        product: product.product_name || product.title,
        success: result.success,
        pinId: result.pinId,
        error: result.error,
      });

      if (result.success) pinned++;

      // Rate limit: 1 pin per second
      await new Promise(r => setTimeout(r, 1200));
    }

    return { success: true, results, pinned };
  } finally {
    autoPinRunning = false;
  }
}

// ─── Schedule Pin ────────────────────────────────────────────────────────────
async function schedulePin(data) {
  const { product, scheduledTime } = data;

  // Store scheduled pin
  await chrome.storage.local.get(['scheduledPins'], async (result) => {
    const scheduled = result.scheduledPins || [];
    scheduled.push({
      product,
      scheduledTime,
      created: new Date().toISOString(),
      status: 'pending',
    });
    await chrome.storage.local.set({ scheduledPins: scheduled });
  });

  return { success: true };
}

// ─── Get Pin Stats ───────────────────────────────────────────────────────────
async function getPinStats() {
  const { pinHistory = [] } = await chrome.storage.local.get(['pinHistory']);
  const today = new Date().toDateString();
  const todayPins = pinHistory.filter(p => new Date(p.time).toDateString() === today);

  return {
    totalPins: pinHistory.length,
    todayPins: todayPins.length,
    recentPins: pinHistory.slice(0, 10),
  };
}

// ─── Alarm for Scheduled Pins ────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkScheduledPins') {
    const { scheduledPins = [] } = await chrome.storage.local.get(['scheduledPins']);
    const now = new Date();

    const duePins = scheduledPins.filter(p =>
      p.status === 'pending' && new Date(p.scheduledTime) <= now
    );

    for (const pin of duePins) {
      try {
        await autoPinProduct(pin.product);
        pin.status = 'done';
      } catch (e) {
        pin.status = 'failed';
        pin.error = e.message;
      }
    }

    await chrome.storage.local.set({ scheduledPins });
  }
});

// Set up alarm to check every minute
chrome.alarms.create('checkScheduledPins', { periodInMinutes: 1 });
