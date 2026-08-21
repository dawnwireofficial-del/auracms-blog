// ─── DawnWire Social Auto-Post Extension ──────────────────────────────────────
// Auto-pin products to Pinterest & post to social media from any product page.

const DEFAULT_API_URL = 'https://www.dawnwire.com';

// ─── UTM Helper ──────────────────────────────────────────────────────────────
// Appends UTM tracking params to a DawnWire URL so analytics can attribute
// traffic to the originating social platform.
function withUTM(url, platform) {
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', platform);
    u.searchParams.set('utm_medium', 'social');
    u.searchParams.set('utm_campaign', 'auto_social');
    return u.toString();
  } catch { return url; }
}

// ─── State ───────────────────────────────────────────────────────────────────
let currentProduct = null;
let selectedPlatforms = ['pinterest'];
let settings = {};

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  settings = await chrome.storage.sync.get([
    'apiUrl', 'apiToken', 'pinterestToken', 'pinterestBoard',
    'facebookToken', 'facebookPageId', 'instagramToken', 'instagramBusinessId',
    'autoPin', 'priorityPins', 'includePrice', 'includeScore',
    'pinsPerDay', 'minScore', 'recentPins'
  ]);

  // Populate settings
  if (settings.apiUrl) document.getElementById('settingsApiUrl').value = settings.apiUrl;
  if (settings.apiToken) document.getElementById('settingsApiToken').value = settings.apiToken;
  if (settings.pinterestToken) document.getElementById('pinterestToken').value = settings.pinterestToken;
  if (settings.pinterestBoard) document.getElementById('pinterestBoard').value = settings.pinterestBoard;
  if (settings.facebookToken) document.getElementById('facebookToken').value = settings.facebookToken;
  if (settings.facebookPageId) document.getElementById('facebookPageId').value = settings.facebookPageId;
  if (settings.instagramToken) document.getElementById('instagramToken').value = settings.instagramToken;
  if (settings.instagramBusinessId) document.getElementById('instagramBusinessId').value = settings.instagramBusinessId;
  if (settings.pinsPerDay) document.getElementById('pinsPerDay').value = settings.pinsPerDay;
  if (settings.minScore) document.getElementById('minScore').value = settings.minScore;

  // Toggle states
  if (settings.autoPin !== false) document.getElementById('autoPinToggle').classList.add('active');
  if (settings.priorityPins !== false) document.getElementById('priorityToggle').classList.add('active');
  if (settings.includePrice !== false) document.getElementById('priceToggle').classList.add('active');
  if (settings.includeScore !== false) document.getElementById('scoreToggle').classList.add('active');

  // Update platform statuses
  updatePlatformStatuses();

  // Get current page product
  await detectCurrentProduct();

  // Load stats
  loadStats();

  // Load recent pins
  loadRecentPins();

  // Setup event listeners
  setupEventListeners();
});

// ─── Tab Navigation ──────────────────────────────────────────────────────────
function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Platform selection
  document.querySelectorAll('.platform-card').forEach(card => {
    card.addEventListener('click', () => {
      const platform = card.dataset.platform;
      if (selectedPlatforms.includes(platform)) {
        selectedPlatforms = selectedPlatforms.filter(p => p !== platform);
        card.classList.remove('selected');
      } else {
        selectedPlatforms.push(platform);
        card.classList.add('selected');
      }
    });
  });

  // Toggles
  document.querySelectorAll('.toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
    });
  });

  // Buttons
  document.getElementById('postNowBtn').addEventListener('click', postToPlatforms);
  document.getElementById('saveScheduleBtn').addEventListener('click', saveScheduleSettings);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  document.getElementById('testConnectionBtn').addEventListener('click', testConnection);
}

// ─── Platform Status ─────────────────────────────────────────────────────────
function updatePlatformStatuses() {
  const pinterestOk = settings.pinterestToken && settings.pinterestBoard;
  const facebookOk = settings.facebookToken && settings.facebookPageId;
  const instagramOk = settings.instagramToken && settings.instagramBusinessId;

  document.getElementById('pinterestStatus').textContent = pinterestOk ? '● Connected' : '○ Not set';
  document.getElementById('pinterestStatus').style.color = pinterestOk ? '#10B981' : '#EF4444';

  document.getElementById('facebookStatus').textContent = facebookOk ? '● Connected' : '○ Not set';
  document.getElementById('facebookStatus').style.color = facebookOk ? '#10B981' : '#EF4444';

  document.getElementById('instagramStatus').textContent = instagramOk ? '● Connected' : '○ Not set';
  document.getElementById('instagramStatus').style.color = instagramOk ? '#10B981' : '#EF4444';
}

// ─── Detect Current Product ──────────────────────────────────────────────────
async function detectCurrentProduct() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    const url = tab.url;
    const isProductPage = /amazon\.\w+\/(dp|gp\/product|product)\//i.test(url) ||
                          /walmart\.com\/ip\//i.test(url) ||
                          /bestbuy\.com\/.*\/product/i.test(url) ||
                          /aliexpress\.com\/item/i.test(url) ||
                          /ebay\.\w+\/itm\//i.test(url);

    if (!isProductPage) {
      document.getElementById('productName').textContent = 'Not on a product page';
      document.getElementById('productMeta').textContent = 'Navigate to a product page to auto-post';
      return;
    }

    // Extract product data from page
    const productData = await extractProductFromPage(tab);
    if (productData) {
      // Look up the DawnWire product URL via API so social posts link to our site
      productData.dawnwireUrl = await lookupDawnWireUrl(productData.title);
      currentProduct = productData;
      displayProduct(productData);
      generateCaption(productData);
    }
  } catch (e) {
    console.error('Failed to detect product:', e);
  }
}

// ─── Look Up DawnWire Product URL ────────────────────────────────────────────
// Searches DawnWire API for the product and returns its review page URL.
// Falls back to the homepage if no matching product is found.
async function lookupDawnWireUrl(productTitle) {
  const apiUrl = settings.apiUrl || DEFAULT_API_URL;
  if (!productTitle) return `${apiUrl}/`;

  try {
    // Search DawnWire for the product by title keywords
    const keywords = productTitle.split(' ').slice(0, 5).join(' ');
    const searchUrl = `${apiUrl}/api/public/search-suggestions?q=${encodeURIComponent(keywords)}`;
    const res = await fetch(searchUrl);
    if (!res.ok) return `${apiUrl}/`;

    const data = await res.json();
    const products = data?.products || [];

    if (products.length > 0) {
      // Use the first matching product's slug
      const slug = products[0].slug;
      if (slug) return `${apiUrl}/products/${slug}`;
    }
  } catch (e) {
    console.warn('DawnWire lookup failed:', e);
  }

  return `${apiUrl}/`;
}

// ─── Extract Product from Page ───────────────────────────────────────────────
async function extractProductFromPage(tab) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const url = window.location.href;
        let product = { url, source: 'unknown' };

        // Amazon
        if (/amazon\.\w+\/(dp|gp\/product|product)\//i.test(url)) {
          product.source = 'amazon';
          const title = document.getElementById('productTitle')?.textContent?.trim() ||
                       document.querySelector('h1')?.textContent?.trim() || '';
          const price = document.querySelector('.a-price .a-offscreen')?.textContent?.trim() ||
                       document.querySelector('#priceblock_ourprice')?.textContent?.trim() || '';
          const image = document.getElementById('landingImage')?.src ||
                       document.querySelector('#imgBlkFront')?.src || '';
          const rating = document.querySelector('#acrPopover .a-icon-alt')?.textContent?.trim() || '';
          const reviewCount = document.querySelector('#acrCustomerReviewText')?.textContent?.trim() || '';
          product = { ...product, title, price, image, rating, reviewCount };
        }

        // Walmart
        else if (/walmart\.com\/ip\//i.test(url)) {
          product.source = 'walmart';
          const title = document.querySelector('h1')?.textContent?.trim() || '';
          const price = document.querySelector('[itemprop="price"]')?.textContent?.trim() || '';
          const image = document.querySelector('img[data-testid="hero-image"]')?.src || '';
          product = { ...product, title, price, image };
        }

        // Best Buy
        else if (/bestbuy\.com/i.test(url)) {
          product.source = 'bestbuy';
          const title = document.querySelector('h1')?.textContent?.trim() || '';
          const price = document.querySelector('.priceView-customer-price span')?.textContent?.trim() || '';
          const image = document.querySelector('.product-image img')?.src || '';
          product = { ...product, title, price, image };
        }

        // Generic fallback
        else {
          product.title = document.querySelector('h1')?.textContent?.trim() || document.title;
          product.image = document.querySelector('meta[property="og:image"]')?.content || '';
        }

        return product;
      }
    });

    return results?.[0]?.result || null;
  } catch (e) {
    console.error('Script injection failed:', e);
    return null;
  }
}

// ─── Display Product ─────────────────────────────────────────────────────────
function displayProduct(product) {
  document.getElementById('productName').textContent = product.title || 'Unknown Product';
  document.getElementById('productImage').src = product.image || '';
  document.getElementById('productImage').onerror = function() { this.style.display = 'none'; };

  const meta = [
    product.source ? `Source: ${product.source}` : '',
    product.price ? `Price: ${product.price}` : '',
    product.rating ? `Rating: ${product.rating}` : '',
  ].filter(Boolean).join(' • ');
  document.getElementById('productMeta').textContent = meta;

  // Store badge
  const badge = document.getElementById('storeBadge');
  badge.textContent = product.source || 'Unknown';
  badge.className = `badge badge-info`;
}

// ─── Generate Caption ────────────────────────────────────────────────────────
function generateCaption(product) {
  const parts = [
    `🔍 ${product.title || 'Product Review'}`,
    '',
  ];

  if (settings.includeScore !== false) {
    parts.push(`⭐ DawnWire Editor Score: 8/10`);
  }

  if (product.price) {
    parts.push(`💰 Price: ${product.price}`);
  }

  if (product.rating) {
    parts.push(`📊 ${product.rating}`);
  }

  parts.push('');
  const dawnwireUrl = currentProduct?.dawnwireUrl || 'https://www.dawnwire.com';
  parts.push(`🔗 Full review: ${withUTM(dawnwireUrl, 'social')}`);
  parts.push('#ProductReview #BestDeals #AmazonFinds #DawnWire');

  document.getElementById('captionInput').value = parts.join('\n');
}

// ─── Post to Platforms ───────────────────────────────────────────────────────
async function postToPlatforms() {
  const btn = document.getElementById('postNowBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Posting...';

  const caption = document.getElementById('captionInput').value;
  const log = document.getElementById('activityLog');

  for (const platform of selectedPlatforms) {
    try {
      addLog(`Posting to ${platform}...`, 'info');

      if (platform === 'pinterest') {
        await postToPinterest(caption);
        addLog(`✅ Pinterest pin created!`, 'success');
      } else if (platform === 'facebook') {
        await postToFacebook(caption);
        addLog(`✅ Facebook post created!`, 'success');
      } else if (platform === 'instagram') {
        await postToInstagram(caption);
        addLog(`✅ Instagram post created!`, 'success');
      }
    } catch (e) {
      addLog(`❌ ${platform}: ${e.message}`, 'error');
    }
  }

  btn.disabled = false;
  btn.textContent = '🚀 Post to Selected Platforms';
  loadStats();
}

// ─── Pinterest Post ──────────────────────────────────────────────────────────
async function postToPinterest(caption) {
  const token = settings.pinterestToken;
  const boardId = settings.pinterestBoard;

  if (!token || !boardId) throw new Error('Pinterest credentials not configured');

  const title = caption.split('\n')[0].substring(0, 100);
  // Always use DawnWire URL for social posts (drives traffic to our site)
  const dawnwireUrl = currentProduct?.dawnwireUrl || 'https://www.dawnwire.com';
  const link = withUTM(dawnwireUrl, 'pinterest');
  const imageUrl = currentProduct?.image || '';

  const response = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      board_id: boardId,
      title,
      description: caption.substring(0, 500),
      link,
      image_url: imageUrl,
    }),
  });

  const data = await response.json();
  if (data.code && data.code !== 200) {
    throw new Error(data.message || 'Pinterest API error');
  }

  // Save to recent pins
  saveRecentPin({
    platform: 'pinterest',
    title: title.substring(0, 50),
    url: link,
    time: new Date().toLocaleTimeString(),
  });

  return data;
}

// ─── Facebook Post ───────────────────────────────────────────────────────────
async function postToFacebook(caption) {
  const token = settings.facebookToken;
  const pageId = settings.facebookPageId;

  if (!token || !pageId) throw new Error('Facebook credentials not configured');

  // Always use DawnWire URL (not the store URL)
  const dawnwireUrl = currentProduct?.dawnwireUrl || `${settings.apiUrl || DEFAULT_API_URL}/`;
  const link = withUTM(dawnwireUrl, 'facebook');

  const response = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: caption,
      link,
      access_token: token,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  saveRecentPin({
    platform: 'facebook',
    title: caption.split('\n')[0].substring(0, 50),
    url: link,
    time: new Date().toLocaleTimeString(),
  });

  return data;
}

// ─── Instagram Post ──────────────────────────────────────────────────────────
async function postToInstagram(caption) {
  const token = settings.instagramToken;
  const businessId = settings.instagramBusinessId;

  if (!token || !businessId) throw new Error('Instagram credentials not configured');

  const imageUrl = currentProduct?.image || '';
  if (!imageUrl) throw new Error('No product image available');

  // Step 1: Create media container (Instagram uses image, link is in bio)
  const containerRes = await fetch(`https://graph.facebook.com/v19.0/${businessId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: caption.substring(0, 2200) + '\n\n🔗 Link in bio → dawnwire.com',
      access_token: token,
    }),
  });

  const containerData = await containerRes.json();
  if (containerData.error) throw new Error(containerData.error.message);

  // Step 2: Publish
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${businessId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: token,
    }),
  });

  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(publishData.error.message);

  const dawnwireUrl = currentProduct?.dawnwireUrl || `${settings.apiUrl || DEFAULT_API_URL}/`;
  saveRecentPin({
    platform: 'instagram',
    title: caption.split('\n')[0].substring(0, 50),
    url: withUTM(dawnwireUrl, 'instagram'),
    time: new Date().toLocaleTimeString(),
  });

  return publishData;
}

// ─── Recent Pins ─────────────────────────────────────────────────────────────
function saveRecentPin(pin) {
  const recentPins = settings.recentPins || [];
  recentPins.unshift(pin);
  settings.recentPins = recentPins.slice(0, 20);
  chrome.storage.sync.set({ recentPins: settings.recentPins });
  loadRecentPins();
}

function loadRecentPins() {
  const container = document.getElementById('recentPins');
  const pins = settings.recentPins || [];

  if (pins.length === 0) {
    container.innerHTML = '<div class="log-entry log-info">No recent pins yet.</div>';
    return;
  }

  container.innerHTML = pins.map(pin => `
    <div class="log-entry">
      <span class="log-success">${pin.platform}</span> • ${pin.title}
      <br><span style="color: #6B7280; font-size: 10px;">${pin.time}</span>
    </div>
  `).join('');
}

// ─── Stats ───────────────────────────────────────────────────────────────────
function loadStats() {
  const today = new Date().toDateString();
  const recentPins = settings.recentPins || [];
  const todayPins = recentPins.filter(p => new Date().toDateString() === today);

  document.getElementById('statPins').textContent = todayPins.filter(p => p.platform === 'pinterest').length;
  document.getElementById('statPosts').textContent = todayPins.filter(p => p.platform !== 'pinterest').length;
}

// ─── Activity Log ────────────────────────────────────────────────────────────
function addLog(message, type = 'info') {
  const log = document.getElementById('activityLog');
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  log.insertBefore(entry, log.firstChild);
}

// ─── Settings ────────────────────────────────────────────────────────────────
async function saveSettings() {
  const newSettings = {
    apiUrl: document.getElementById('settingsApiUrl').value,
    apiToken: document.getElementById('settingsApiToken').value,
    pinterestToken: document.getElementById('pinterestToken').value,
    pinterestBoard: document.getElementById('pinterestBoard').value,
    facebookToken: document.getElementById('facebookToken').value,
    facebookPageId: document.getElementById('facebookPageId').value,
    instagramToken: document.getElementById('instagramToken').value,
    instagramBusinessId: document.getElementById('instagramBusinessId').value,
  };

  await chrome.storage.sync.set(newSettings);
  settings = { ...settings, ...newSettings };
  updatePlatformStatuses();
  addLog('Settings saved!', 'success');
}

async function saveScheduleSettings() {
  const scheduleSettings = {
    autoPin: document.getElementById('autoPinToggle').classList.contains('active'),
    priorityPins: document.getElementById('priorityToggle').classList.contains('active'),
    includePrice: document.getElementById('priceToggle').classList.contains('active'),
    includeScore: document.getElementById('scoreToggle').classList.contains('active'),
    pinsPerDay: parseInt(document.getElementById('pinsPerDay').value) || 10,
    minScore: parseInt(document.getElementById('minScore').value) || 6,
  };

  await chrome.storage.sync.set(scheduleSettings);
  settings = { ...settings, ...scheduleSettings };
  addLog('Schedule settings saved!', 'success');
}

async function testConnection() {
  const apiUrl = document.getElementById('settingsApiUrl').value;
  const apiToken = document.getElementById('settingsApiToken').value;
  const status = document.getElementById('connectionStatus');

  try {
    const response = await fetch(`${apiUrl}/api/public/health/ai`, {
      headers: { 'Authorization': `Bearer ${apiToken}` },
    });

    if (response.ok) {
      status.innerHTML = '<span style="color: #10B981;">✓ Connected successfully!</span>';
      addLog('Connection test passed!', 'success');
    } else {
      status.innerHTML = `<span style="color: #EF4444;">✗ Connection failed (${response.status})</span>`;
      addLog(`Connection test failed: ${response.status}`, 'error');
    }
  } catch (e) {
    status.innerHTML = `<span style="color: #EF4444;">✗ ${e.message}</span>`;
    addLog(`Connection error: ${e.message}`, 'error');
  }
}
