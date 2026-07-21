document.addEventListener('DOMContentLoaded', async () => {
  const apiUrlInput = document.getElementById('apiUrl');
  const apiTokenInput = document.getElementById('apiToken');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');
  const importStatus = document.getElementById('importStatus');
  const queueSection = document.getElementById('queueSection');
  const queueList = document.getElementById('queueList');
  const queueProgressFill = document.getElementById('queueProgressFill');

  const result = await chrome.storage.sync.get(['apiUrl', 'apiToken']);
  if (result.apiUrl) apiUrlInput.value = result.apiUrl;
  if (result.apiToken) apiTokenInput.value = result.apiToken;

  function setStatus(text, type) {
    statusDiv.textContent = text;
    statusDiv.className = 'status ' + type;
  }

  // Listen for queue status updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'QUEUE_STATUS') {
      updateQueueUI(message.status);
    }
  });

  function updateQueueUI(status) {
    if (status.queueLength > 0 || status.running) {
      queueSection.classList.add('active');
      importStatus.classList.add('active');
    } else {
      queueSection.classList.remove('active');
      importStatus.classList.remove('active');
      return;
    }

    const done = status.items.filter(i => i.status === 'done').length;
    const failed = status.items.filter(i => i.status === 'failed').length;
    const total = status.items.length + done + failed;
    const pct = total > 0 ? ((done + failed) / (total)) * 100 : 0;
    queueProgressFill.style.width = Math.min(pct, 100) + '%';

    queueList.innerHTML = status.items.map((item, i) => `
      <div class="queue-item" key="${i}">
        <span class="queue-title">${item.title}</span>
        <span class="queue-status ${item.status}">${item.status}</span>
      </div>
    `).join('');
  }

  // Poll queue status periodically
  setInterval(async () => {
    try {
      const status = await chrome.runtime.sendMessage({ type: 'GET_QUEUE_STATUS' });
      if (status) updateQueueUI(status);
    } catch (e) { console.error('[DawnWire Popup]', e); }
  }, 2000);

  saveBtn.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim() || 'https://www.dawnwire.com';
    const apiToken = apiTokenInput.value.trim();
    if (!apiToken) {
      setStatus('Please enter your API token from DawnWire admin settings.', 'error');
      return;
    }
    await chrome.storage.sync.set({ apiUrl, apiToken });
    setStatus('Settings saved successfully!', 'success');
  });

  testBtn.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim() || 'https://www.dawnwire.com';
    const apiToken = apiTokenInput.value.trim();
    if (!apiToken) {
      setStatus('Please enter your API token first.', 'error');
      return;
    }
    await chrome.storage.sync.set({ apiUrl, apiToken });
    setStatus('Testing connection...', 'info');
    try {
      const result = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });
      if (result?.success) {
        setStatus('Connection OK! Logged in as ' + (result.user?.name || result.user?.email || 'Unknown'), 'success');
        document.getElementById('connIndicator').style.display = 'flex';
        document.getElementById('connDot').style.background = '#33cc88';
        document.getElementById('connText').textContent = 'Connected';
      } else {
        setStatus('Connection failed: ' + (result?.error || 'Unknown error'), 'error');
        document.getElementById('connIndicator').style.display = 'flex';
        document.getElementById('connDot').style.background = '#ff4444';
        document.getElementById('connText').textContent = 'Disconnected';
      }
    } catch (err) {
      setStatus('Connection failed: ' + err.message, 'error');
      document.getElementById('connIndicator').style.display = 'flex';
      document.getElementById('connDot').style.background = '#ff4444';
      document.getElementById('connText').textContent = 'Disconnected';
    }
  });
});
