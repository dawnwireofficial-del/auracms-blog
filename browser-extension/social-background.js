// ─── DawnWire Social Auto-Post Background Service Worker ──────────────────────
// Handles auto-pinning, scheduling, and background social media posting.
//
// The manifest registers THIS file as the MV3 service worker. It imports
// ./background.js so the product-import handlers (IMPORT_PRODUCT, IMPORT_BATCH,
// IMPORT_FROM_URL, GET_QUEUE_STATUS, RESUME_QUEUE, CLEAR_QUEUE, TEST_CONNECTION,
// CHECK_AUTO_IMPORT + the tab auto-import watcher) are active too — without this
// import, store-page imports via content.js silently fail ("message port closed").
import './background.js';

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

// ─── Pinterest Credentials ───────────────────────────────────────────────────
// Single source of truth: the admin dashboard stores the Pinterest token + board
// in the DawnWire database. This fetches them from the server using the same
// admin token the extension already holds, falling back to locally saved values
// (chrome.storage.sync) for setups that never configured the dashboard.
async function getPinterestCredentials() {
  try {
    const { apiUrl, apiToken } = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
    if (apiUrl && apiToken) {
      const res = await fetch(`${apiUrl}/api/admin/social-media/credentials/active/pinterest`, {
        headers: { 'Authorization': `Bearer ${apiToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.access_token && data.board_id) {
          return { token: data.access_token, board: data.board_id };
        }
      }
    }
  } catch (e) {
    console.warn('[DawnWire] Pinterest server credentials fetch failed, using local settings:', e.message);
  }

  const local = await chrome.storage.sync.get(['pinterestToken', 'pinterestBoard']);
  if (local.pinterestToken && local.pinterestBoard) {
    return { token: local.pinterestToken, board: local.pinterestBoard };
  }
  return null;
}

// ─── Per-Category Board Routing ───────────────────────────────────────────────
// Pins land on the niche board matching the product's category (Beauty,
// Electronics, Home & Kitchen, …) so each board ranks for its keywords.
// Falls back to the default board when nothing matches.

// Category slug → keyword used to match against Pinterest board names.
const PIN_BOARD_KEYWORDS = {
  'beauty-personal-care': 'Beauty',
  'home-kitchen': 'Kitchen',
  'electronics': 'Electronics',
  'technology': 'Technology',
  'gaming': 'Gaming',
  'sports-outdoors': 'Sports',
  'fitness': 'Fitness',
  'baby-products': 'Baby',
  'automotive': 'Automotive',
  'toys-games': 'Toys',
  'office-productivity': 'Office',
  'ai-software-tools': 'AI',
};

let boardsCache = { at: 0, boards: [] };

async function fetchUserBoards(token) {
  if (Date.now() - boardsCache.at < 5 * 60 * 1000) return boardsCache.boards;
  const boards = [];
  let bookmark = null;
  try {
    do {
      const url = new URL('https://api.pinterest.com/v5/boards');
      url.searchParams.set('page_size', '100');
      if (bookmark) url.searchParams.set('bookmark', bookmark);
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) break;
      const data = await res.json();
      if (Array.isArray(data.items)) {
        for (const b of data.items) {
          if (b?.id && b?.name) boards.push({ id: b.id, name: b.name });
        }
      }
      bookmark = data?.bookmark || null;
    } while (bookmark && boards.length < 500);
  } catch (e) {
    console.warn('[DawnWire] Pinterest board fetch failed:', e.message);
  }
  boardsCache = { at: Date.now(), boards };
  return boards;
}

function normalizeBoardText(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function productCategorySignals(product) {
  const signals = [];
  if (product?.best_for) signals.push(String(product.best_for));
  if (product?.category) signals.push(String(product.category));
  if (product?.specs?.details?.department) signals.push(String(product.specs.details.department));
  if (product?.specs?.details?.category) signals.push(String(product.specs.details.category));
  for (const [slug, word] of Object.entries(PIN_BOARD_KEYWORDS)) {
    if (String(product?.category || '').includes(slug)) signals.push(word);
  }
  return signals.filter(Boolean);
}

async function resolveBoardForProduct(token, defaultBoardId, product) {
  if (!defaultBoardId) return '';
  const signals = productCategorySignals(product);
  if (signals.length === 0) return defaultBoardId;

  const boards = await fetchUserBoards(token);
  if (boards.length === 0) return defaultBoardId;

  let bestId = defaultBoardId;
  let bestScore = 0;
  for (const board of boards) {
    const name = normalizeBoardText(board.name);
    let score = 0;
    for (const signal of signals) {
      const norm = normalizeBoardText(signal);
      if (!norm) continue;
      for (const token of norm.split(' ')) {
        if (token.length < 3) continue;
        if (name.includes(token)) score += 1;
      }
      if (name.includes(norm)) score += 2;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = board.id;
    }
  }
  return bestScore >= 1 ? bestId : defaultBoardId;
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
  const creds = await getPinterestCredentials();

  if (!creds) {
    return { success: false, error: 'Pinterest credentials not configured' };
  }

  const { token, board } = creds;

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

  // Route to the niche board matching this product's category.
  const targetBoard = await resolveBoardForProduct(token, board, product);

  const pinRes = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      board_id: targetBoard,
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
    'apiUrl', 'apiToken', 'autoPin', 'minScore', 'pinsPerDay'
  ]);

  const creds = await getPinterestCredentials();
  if (!creds) {
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
