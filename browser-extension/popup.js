document.addEventListener('DOMContentLoaded', async () => {
  // ─── Elements ───
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  const urlInput = document.getElementById('urlInput');
  const parseUrlsBtn = document.getElementById('parseUrlsBtn');
  const importUrlsBtn = document.getElementById('importUrlsBtn');
  const clearUrlsBtn = document.getElementById('clearUrlsBtn');
  const urlPreview = document.getElementById('urlPreview');
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const resultsSummary = document.getElementById('resultsSummary');
  const resultOk = document.getElementById('resultOk');
  const resultFail = document.getElementById('resultFail');
  const importLog = document.getElementById('importLog');
  const currentPageSection = document.getElementById('currentPageSection');
  const currentPageUrl = document.getElementById('currentPageUrl');
  const currentPageBadge = document.getElementById('currentPageBadge');
  const importCurrentBtn = document.getElementById('importCurrentBtn');
  const autoImportToggle = document.getElementById('autoImportToggle');
  const autoImportInfo = document.getElementById('autoImportInfo');

  // Settings elements
  const apiUrlInput = document.getElementById('apiUrl');
  const apiTokenInput = document.getElementById('apiToken');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');
  const statusSettings = document.getElementById('statusSettings');

  // ─── Store detection ───
  const STORE_PATTERNS = [
    { name: 'Amazon', badge: 'badge-amazon', patterns: [/amazon\.\w+\/(dp|gp\/product|product)\/\w+/i, /amzn\.to\/\w+/i] },
    { name: 'Walmart', badge: 'badge-walmart', patterns: [/walmart\.com\/ip\//i] },
    { name: 'Best Buy', badge: 'badge-bestbuy', patterns: [/bestbuy\.com\/.*\/product/i] },
    { name: 'AliExpress', badge: 'badge-aliexpress', patterns: [/aliexpress\.com\/item/i] },
    { name: 'eBay', badge: 'badge-ebay', patterns: [/ebay\.\w+\/itm\//i] },
  ];

  function detectStore(url) {
    for (const store of STORE_PATTERNS) {
      if (store.patterns.some(p => p.test(url))) return store;
    }
    return { name: 'Unknown', badge: 'badge-unknown' };
  }

  function isValidProductUrl(url) {
    try { new URL(url); return true; } catch { return false; }
  }

  // ─── Tab switching ───
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // ─── Load saved settings ───
  const saved = await chrome.storage.sync.get(['apiUrl', 'apiToken', 'autoImport']);
  if (saved.apiUrl) apiUrlInput.value = saved.apiUrl;
  if (saved.apiToken) apiTokenInput.value = saved.apiToken;
  if (saved.autoImport) {
    autoImportToggle.classList.add('on');
    autoImportInfo.style.display = 'block';
  }

  // ─── Detect current page ───
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      const store = detectStore(tab.url);
      if (store.name !== 'Unknown') {
        currentPageSection.style.display = 'flex';
        currentPageBadge.textContent = store.name.toUpperCase();
        currentPageBadge.className = 'badge ' + store.badge;
        currentPageUrl.textContent = tab.url;

        // Check if already imported
        const { apiToken, apiUrl } = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
        if (apiToken) {
          try {
            const base = (apiUrl || 'https://www.dawnwire.com').replace(/\/$/, '');
            const check = await fetch(base + '/api/admin/seo/product-reviews/check-duplicate?' + new URLSearchParams({ url: tab.url }), {
              headers: { 'Authorization': 'Bearer ' + apiToken }
            });
            if (check.ok) {
              const dup = await check.json();
              if (dup.duplicate) {
                importCurrentBtn.textContent = 'Already Imported';
                importCurrentBtn.classList.add('imported');
                importCurrentBtn.disabled = true;
              }
            }
          } catch (e) {}
        }
      }
    }
  } catch (e) {}

  // ─── Current page import ───
  importCurrentBtn.addEventListener('click', async () => {
    importCurrentBtn.disabled = true;
    importCurrentBtn.textContent = 'Importing...';
    try {
      const result = await chrome.runtime.sendMessage({ type: 'IMPORT_FROM_URL', url: currentPageUrl.textContent });
      if (result?.success) {
        importCurrentBtn.textContent = 'Imported ✓';
        importCurrentBtn.classList.add('imported');
      } else {
        importCurrentBtn.textContent = 'Failed';
        importCurrentBtn.disabled = false;
        setStatus(statusDiv, 'Import failed: ' + (result?.error || 'Unknown error'), 'error');
      }
    } catch (e) {
      importCurrentBtn.textContent = 'Failed';
      importCurrentBtn.disabled = false;
      setStatus(statusDiv, 'Error: ' + e.message, 'error');
    }
  });

  // ─── Auto-import toggle ───
  autoImportToggle.addEventListener('click', async () => {
    const isOn = autoImportToggle.classList.toggle('on');
    autoImportInfo.style.display = isOn ? 'block' : 'none';
    await chrome.storage.sync.set({ autoImport: isOn });
  });

  // ─── URL input: live preview on paste/change ───
  urlInput.addEventListener('input', () => {
    const urls = parseUrls();
    if (urls.length > 0) {
      parseUrlsBtn.style.display = 'block';
    } else {
      parseUrlsBtn.style.display = 'none';
      urlPreview.style.display = 'none';
    }
  });

  // ─── Parse URLs ───
  function parseUrls() {
    const lines = urlInput.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const urls = [];
    for (const line of lines) {
      // Try to extract URL from text (user might paste "Product Name https://..." or just a URL)
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);
      if (urlMatch && isValidProductUrl(urlMatch[1])) {
        urls.push(urlMatch[1]);
      } else if (isValidProductUrl(line)) {
        urls.push(line);
      }
    }
    return [...new Set(urls)]; // deduplicate
  }

  // ─── Preview parsed URLs ───
  parseUrlsBtn.addEventListener('click', () => {
    const urls = parseUrls();
    if (urls.length === 0) {
      setStatus(statusDiv, 'No valid URLs found. Paste product URLs (one per line).', 'error');
      return;
    }
    urlPreview.innerHTML = urls.map((url, i) => {
      const store = detectStore(url);
      const short = url.replace(/https?:\/\/(www\.)?/, '').substring(0, 50);
      return `<div class="url-item" data-url="${url}">
        <span class="badge ${store.badge}">${store.name}</span>
        <span class="url-text" title="${url}">${short}</span>
        <button class="url-remove" data-idx="${i}">&times;</button>
      </div>`;
    }).join('');
    urlPreview.style.display = 'block';
    parseUrlsBtn.style.display = 'none';
    setStatus(statusDiv, `${urls.length} product URL(s) ready to import.`, 'info');
  });

  // ─── Remove individual URL ───
  urlPreview.addEventListener('click', (e) => {
    if (e.target.classList.contains('url-remove')) {
      e.target.closest('.url-item').remove();
      const remaining = urlPreview.querySelectorAll('.url-item');
      if (remaining.length === 0) urlPreview.style.display = 'none';
    }
  });

  // ─── Import URLs ───
  importUrlsBtn.addEventListener('click', async () => {
    const urls = parseUrls();
    if (urls.length === 0) {
      setStatus(statusDiv, 'No valid URLs found. Paste product URLs (one per line).', 'error');
      return;
    }

    // Check API token
    const { apiToken } = await chrome.storage.sync.get(['apiToken']);
    if (!apiToken) {
      setStatus(statusDiv, 'Please configure your API token in Settings first.', 'error');
      return;
    }

    importUrlsBtn.disabled = true;
    importUrlsBtn.textContent = 'Importing...';
    progressBar.classList.add('active');
    progressFill.style.width = '0%';
    progressText.style.display = 'block';
    resultsSummary.style.display = 'none';
    importLog.style.display = 'block';
    importLog.innerHTML = '';

    let done = 0, failed = 0;
    const total = urls.length;

    // Process URLs sequentially (background.js handles concurrent internally)
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const store = detectStore(url);
      const short = url.replace(/https?:\/\/(www\.)?/, '').substring(0, 40);

      // Add to log as pending
      const logItem = document.createElement('div');
      logItem.className = 'url-item';
      logItem.innerHTML = `<span class="badge ${store.badge}">${store.name}</span>
        <span class="url-text">${short}</span>
        <span class="url-status importing">Importing</span>`;
      importLog.appendChild(logItem);

      progressText.textContent = `Importing ${i + 1} of ${total}...`;

      try {
        const result = await chrome.runtime.sendMessage({ type: 'IMPORT_FROM_URL', url });
        if (result?.success) {
          done++;
          logItem.querySelector('.url-status').className = 'url-status done';
          logItem.querySelector('.url-status').textContent = 'Done';
        } else {
          failed++;
          logItem.querySelector('.url-status').className = 'url-status failed';
          logItem.querySelector('.url-status').textContent = 'Failed';
        }
      } catch (e) {
        failed++;
        logItem.querySelector('.url-status').className = 'url-status failed';
        logItem.querySelector('.url-status').textContent = 'Error';
      }

      progressFill.style.width = (((done + failed) / total) * 100) + '%';
    }

    // Show results
    resultsSummary.style.display = 'flex';
    resultOk.textContent = done;
    resultFail.textContent = failed;
    progressText.textContent = `Complete: ${done} imported, ${failed} failed.`;

    importUrlsBtn.disabled = false;
    importUrlsBtn.textContent = '⚡ Import Products';
    urlInput.value = '';
    urlPreview.style.display = 'none';
    parseUrlsBtn.style.display = 'none';

    if (done > 0) {
      setStatus(statusDiv, `${done} product(s) imported successfully!`, 'success');
    }
    if (failed > 0) {
      setStatus(statusDiv, `${failed} product(s) failed. Check the log above.`, 'error');
    }
  });

  // ─── Clear ───
  clearUrlsBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlPreview.style.display = 'none';
    urlPreview.innerHTML = '';
    parseUrlsBtn.style.display = 'none';
    importLog.style.display = 'none';
    importLog.innerHTML = '';
    resultsSummary.style.display = 'none';
    progressBar.classList.remove('active');
    progressText.style.display = 'none';
    statusDiv.className = 'status';
  });

  // ─── Settings: Save ───
  saveBtn.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim() || 'https://www.dawnwire.com';
    const apiToken = apiTokenInput.value.trim();
    if (!apiToken) {
      setStatus(statusSettings, 'Please enter your API token from DawnWire admin settings.', 'error');
      return;
    }
    await chrome.storage.sync.set({ apiUrl, apiToken });
    setStatus(statusSettings, 'Settings saved!', 'success');
  });

  // ─── Settings: Test ───
  testBtn.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim() || 'https://www.dawnwire.com';
    const apiToken = apiTokenInput.value.trim();
    if (!apiToken) {
      setStatus(statusSettings, 'Please enter your API token first.', 'error');
      return;
    }
    await chrome.storage.sync.set({ apiUrl, apiToken });
    setStatus(statusSettings, 'Testing connection...', 'info');
    try {
      const result = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });
      if (result?.success) {
        setStatus(statusSettings, 'Connected as ' + (result.user?.name || result.user?.email || 'Unknown'), 'success');
        document.getElementById('connIndicator').style.display = 'flex';
        document.getElementById('connDot').style.background = '#33cc88';
        document.getElementById('connText').textContent = 'Connected';
      } else {
        setStatus(statusSettings, 'Failed: ' + (result?.error || 'Unknown error'), 'error');
        document.getElementById('connIndicator').style.display = 'flex';
        document.getElementById('connDot').style.background = '#ff4444';
        document.getElementById('connText').textContent = 'Disconnected';
      }
    } catch (err) {
      setStatus(statusSettings, 'Failed: ' + err.message, 'error');
      document.getElementById('connIndicator').style.display = 'flex';
      document.getElementById('connDot').style.background = '#ff4444';
      document.getElementById('connText').textContent = 'Disconnected';
    }
  });

  // ─── Helpers ───
  function setStatus(el, text, type) {
    el.textContent = text;
    el.className = 'status ' + type;
  }
});
