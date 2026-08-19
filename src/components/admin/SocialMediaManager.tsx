import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../lib/store';
import { proxyImageUrl } from '../../utils/safeRender';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialCredential {
  id: string;
  platform: 'facebook' | 'instagram' | 'pinterest';
  access_token: string;
  has_token?: boolean;
  page_id?: string;
  board_id?: string;
  profile_name?: string;
  is_active: boolean;
  created_at?: string;
}

interface SocialPost {
  id: string;
  product_id: string;
  platform: string;
  caption: string;
  image_url: string;
  link?: string;
  status: 'draft' | 'published' | 'failed';
  platform_post_id?: string;
  error_message?: string;
  published_at?: string;
  created_at?: string;
}

interface PostDraft {
  facebook: string;
  instagram: string;
  pinterest: string;
}

type PlatformKey = 'facebook' | 'instagram' | 'pinterest';

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORMS: { key: PlatformKey; name: string; icon: string; color: string; maxChars: number; tips: string }[] = [
  {
    key: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: 'from-blue-600 to-blue-700',
    maxChars: 63206,
    tips: 'Short, conversational posts get 2x more engagement. Ask questions to drive comments.',
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: 'from-purple-500 via-pink-500 to-orange-400',
    maxChars: 2200,
    tips: 'Hook in first line. 5-10 hashtags. Use line breaks for readability. CTA at the end.',
  },
  {
    key: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: 'from-red-600 to-red-700',
    maxChars: 500,
    tips: 'SEO-focused. Use keywords naturally. Pin descriptions drive search visibility. Link to product page.',
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const SocialMediaManager: React.FC<{ token: string }> = ({ token }) => {
  const { products } = useAppStore();

  // Tab state
  const [activeSection, setActiveSection] = useState<'compose' | 'history' | 'settings'>('compose');

  // Product selection
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  // Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>(['facebook', 'instagram', 'pinterest']);

  // Captions
  const [drafts, setDrafts] = useState<PostDraft>({ facebook: '', instagram: '', pinterest: '' });
  const [isGenerating, setIsGenerating] = useState<PlatformKey | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [tone, setTone] = useState('engaging');
  const [customInstructions, setCustomInstructions] = useState('');

  // Publishing
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<any[]>([]);

  // Credentials
  const [credentials, setCredentials] = useState<SocialCredential[]>([]);
  const [editingCred, setEditingCred] = useState<Partial<SocialCredential> | null>(null);
  const [credTestResult, setCredTestResult] = useState<{ platform: string; success: boolean; message: string } | null>(null);

  // Post history
  const [postHistory, setPostHistory] = useState<SocialPost[]>([]);
  const [historyPage, setHistoryPage] = useState(0);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // ─── Load data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    loadCredentials();
    loadPostHistory();
  }, []);

  const loadCredentials = async () => {
    try {
      const res = await fetch('/api/admin/social-media/credentials', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCredentials(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  const loadPostHistory = async () => {
    try {
      const res = await fetch(`/api/admin/social-media/posts?limit=50&offset=${historyPage * 50}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPostHistory(data.data || []);
      }
    } catch {}
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const showNotif = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const isPlatformConnected = (platform: PlatformKey): boolean => {
    return credentials.some(c => c.platform === platform && c.is_active && c.has_token);
  };

  const getSelectedProduct = () => {
    if (!selectedProduct) return null;
    return {
      ...selectedProduct,
      title: selectedProduct.title || selectedProduct.product_name,
      mainCategory: selectedProduct.mainCategory || selectedProduct.category,
      mainFeatures: selectedProduct.mainFeatures || selectedProduct.key_features || [],
      editorScore: selectedProduct.editorScore || selectedProduct.editor_score || 0,
      currentPrice: selectedProduct.currentPrice || selectedProduct.price || 0,
      referencePrice: selectedProduct.referencePrice || selectedProduct.original_price || 0,
      discountPercentage: selectedProduct.discountPercentage || selectedProduct.discount_percentage || 0,
      shortDescription: selectedProduct.shortDescription || selectedProduct.review_summary || '',
      editorVerdict: selectedProduct.editorVerdict || selectedProduct.final_verdict || '',
      bestFor: selectedProduct.bestFor || selectedProduct.best_for || '',
    };
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.asin || '').toLowerCase().includes(q) ||
      (p.mainCategory || '').toLowerCase().includes(q)
    );
  });

  // ─── AI Caption Generation ──────────────────────────────────────────────────

  const generateCaption = async (platform: PlatformKey) => {
    const product = getSelectedProduct();
    if (!product) {
      showNotif('error', 'Select a product first');
      return;
    }

    setIsGenerating(platform);
    try {
      const res = await fetch('/api/admin/social-media/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product,
          platform,
          tone,
          customInstructions,
        }),
      });
      const data = await res.json();
      if (data.caption) {
        setDrafts(prev => ({ ...prev, [platform]: data.caption }));
        showNotif('success', `${platform.charAt(0).toUpperCase() + platform.slice(1)} caption generated`);
      } else {
        showNotif('error', data.error || 'Failed to generate caption');
      }
    } catch (e) {
      showNotif('error', 'Caption generation failed');
    }
    setIsGenerating(null);
  };

  const generateAllCaptions = async () => {
    setIsGeneratingAll(true);
    for (const p of selectedPlatforms) {
      await generateCaption(p);
    }
    setIsGeneratingAll(false);
    showNotif('success', 'All captions generated!');
  };

  // ─── Publishing ─────────────────────────────────────────────────────────────

  const publishToAll = async () => {
    const product = getSelectedProduct();
    if (!product) {
      showNotif('error', 'Select a product first');
      return;
    }

    const platformsWithContent = selectedPlatforms.filter(p => drafts[p].trim());
    if (platformsWithContent.length === 0) {
      showNotif('error', 'Write at least one caption before publishing');
      return;
    }

    const image = (product.images && product.images[0]) || product.product_image || '';
    if (!image) {
      showNotif('error', 'Product has no image to post');
      return;
    }

    setIsPublishing(true);
    setPublishResults([]);

    try {
      const res = await fetch('/api/admin/social-media/publish-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          platforms: platformsWithContent,
          captions: drafts,
          image_url: image,
          link: product.affiliateUrl || product.affiliate_url || `https://dawnwire.com/products/${product.slug}`,
        }),
      });
      const data = await res.json();
      setPublishResults(data.results || []);

      const successes = (data.results || []).filter((r: any) => r.success);
      const failures = (data.results || []).filter((r: any) => !r.success);

      if (successes.length > 0) {
        showNotif('success', `Posted to ${successes.length} platform${successes.length > 1 ? 's' : ''} successfully!`);
      }
      if (failures.length > 0) {
        showNotif('error', `Failed on ${failures.map((f: any) => f.platform).join(', ')}: ${failures[0]?.error || 'Unknown error'}`);
      }

      loadPostHistory();
    } catch (e: any) {
      showNotif('error', `Publish failed: ${e.message}`);
    }
    setIsPublishing(false);
  };

  const publishSingle = async (platform: PlatformKey) => {
    const product = getSelectedProduct();
    if (!product || !drafts[platform].trim()) return;

    const image = (product.images && product.images[0]) || '';
    if (!image) {
      showNotif('error', 'Product has no image');
      return;
    }

    try {
      const res = await fetch('/api/admin/social-media/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform,
          product_id: product.id,
          caption: drafts[platform],
          image_url: image,
          link: product.affiliateUrl || `https://dawnwire.com/products/${product.slug}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotif('success', `Posted to ${platform}!`);
      } else {
        showNotif('error', data.error || 'Failed');
      }
      loadPostHistory();
    } catch (e: any) {
      showNotif('error', e.message);
    }
  };

  // ─── Credentials ────────────────────────────────────────────────────────────

  const saveCredential = async () => {
    if (!editingCred || !editingCred.platform) return;

    try {
      const res = await fetch('/api/admin/social-media/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingCred),
      });
      const data = await res.json();
      if (data.success) {
        showNotif('success', `${editingCred.platform} credentials saved`);
        setEditingCred(null);
        loadCredentials();
      } else {
        showNotif('error', data.error || 'Failed to save');
      }
    } catch (e: any) {
      showNotif('error', e.message);
    }
  };

  const testConnection = async (platform: PlatformKey) => {
    const cred = credentials.find(c => c.platform === platform);
    if (!cred) {
      showNotif('error', 'No credentials for this platform');
      return;
    }

    try {
      const res = await fetch('/api/admin/social-media/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform,
          access_token: cred.access_token,
          page_id: cred.page_id,
          board_id: cred.board_id,
        }),
      });
      const data = await res.json();
      setCredTestResult({
        platform,
        success: data.success,
        message: data.success ? `Connected as ${data.profile?.name || 'Unknown'}` : (data.error || 'Connection failed'),
      });
      setTimeout(() => setCredTestResult(null), 5000);
    } catch (e: any) {
      setCredTestResult({ platform, success: false, message: e.message });
      setTimeout(() => setCredTestResult(null), 5000);
    }
  };

  const deleteCredential = async (id: string) => {
    try {
      await fetch(`/api/admin/social-media/credentials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadCredentials();
      showNotif('info', 'Credential removed');
    } catch {}
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-bold text-white animate-in fade-in duration-200 ${
          notification.type === 'success' ? 'bg-emerald-600' :
          notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'} {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">📱</span> Social Media Publisher
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create viral posts from your products and publish to Facebook, Instagram & Pinterest in one click.
          </p>
        </div>

        {/* Platform status badges */}
        <div className="flex gap-2">
          {PLATFORMS.map(p => (
            <div key={p.key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              isPlatformConnected(p.key)
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isPlatformConnected(p.key) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              {p.icon} {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        {[
          { key: 'compose' as const, label: '✏️ Compose & Publish', count: selectedPlatforms.length },
          { key: 'history' as const, label: '📋 Post History', count: postHistory.length },
          { key: 'settings' as const, label: '⚙️ Platform Settings', count: credentials.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all ${
              activeSection === tab.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ COMPOSE SECTION */}
      {activeSection === 'compose' && (
        <div className="space-y-6">
          {/* Product Selector */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">1. Select Product</h3>
              <span className="text-[10px] text-slate-400">{products.length} products available</span>
            </div>

            {selectedProduct ? (
              <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <img
                  src={proxyImageUrl(selectedProduct.images?.[0] || selectedProduct.product_image || '')}
                  alt={selectedProduct.title}
                  className="w-16 h-16 object-contain rounded-lg bg-white"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedProduct.title}</p>
                  <p className="text-xs text-slate-500">
                    {selectedProduct.brand && `${selectedProduct.brand} · `} ${selectedProduct.currentPrice || selectedProduct.price || '?'}
                    {selectedProduct.rating ? ` · ⭐ ${selectedProduct.rating}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  ✕ Change
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search products by name, brand, ASIN, or category..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowProductPicker(true); }}
                    onFocus={() => setShowProductPicker(true)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm outline-none"
                  />
                </div>
                {showProductPicker && (
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.slice(0, 30).map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedProduct(p); setShowProductPicker(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors text-left"
                      >
                        <img
                          src={proxyImageUrl(p.images?.[0] || '')}
                          alt=""
                          className="w-10 h-10 object-contain rounded-lg bg-white shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="%23f1f5f9" width="40" height="40"/><text x="12" y="26" font-size="16">📦</text></svg>'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-500">{p.brand} · ${p.currentPrice || '?'} · ⭐ {p.rating || '?'}</p>
                        </div>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">No products match "{searchQuery}"</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Platform Selection + Tone */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">2. Choose Platforms & Style</h3>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-500">Tone:</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 outline-none"
                >
                  <option value="engaging">🔥 Engaging</option>
                  <option value="professional">💼 Professional</option>
                  <option value="casual">😊 Casual</option>
                  <option value="urgent">⏰ Urgency/FOMO</option>
                  <option value="informative">📚 Informative</option>
                  <option value="luxury">✨ Luxury/Premium</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {PLATFORMS.map(p => (
                <button
                  key={p.key}
                  onClick={() => {
                    setSelectedPlatforms(prev =>
                      prev.includes(p.key) ? prev.filter(x => x !== p.key) : [...prev, p.key]
                    );
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border ${
                    selectedPlatforms.includes(p.key)
                      ? `bg-gradient-to-r ${p.color} text-white border-transparent shadow-md`
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {p.icon} {p.name}
                  {isPlatformConnected(p.key) ? ' ✅' : ' ⚠️'}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Extra instructions (e.g., 'mention it's great for Christmas gifts')"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 outline-none"
              />
              <button
                onClick={generateAllCaptions}
                disabled={isGeneratingAll || !selectedProduct}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {isGeneratingAll ? (
                  <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                ) : (
                  <>✨ AI Generate All</>
                )}
              </button>
            </div>
          </div>

          {/* Caption Composer — One per platform */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">3. Edit Captions & Publish</h3>

            {PLATFORMS.filter(p => selectedPlatforms.includes(p.key)).map(platform => {
              const connected = isPlatformConnected(platform.key);
              return (
                <div key={platform.key} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{platform.icon}</span>
                      <span className="text-sm font-black">{platform.name}</span>
                      <span className="text-[10px] text-slate-400">({drafts[platform.key].length}/{platform.maxChars} chars)</span>
                      {!connected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold">
                          Not connected — add API keys in Settings
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateCaption(platform.key)}
                        disabled={isGenerating === platform.key || !selectedProduct}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50 flex items-center gap-1"
                      >
                        {isGenerating === platform.key ? (
                          <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : '✨'} AI Generate
                      </button>
                      <button
                        onClick={() => publishSingle(platform.key)}
                        disabled={!connected || !drafts[platform.key].trim() || !selectedProduct}
                        className="text-xs font-bold text-white px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 shadow-sm transition-all"
                      >
                        🚀 Post Now
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={drafts[platform.key]}
                    onChange={(e) => setDrafts(prev => ({ ...prev, [platform.key]: e.target.value }))}
                    placeholder={`Write your ${platform.name} post here...`}
                    rows={6}
                    className="w-full bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-slate-700 outline-none resize-none font-mono"
                  />

                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 italic">{platform.tips}</p>
                    <span className={`text-[10px] font-bold ${
                      drafts[platform.key].length > platform.maxChars ? 'text-red-500' : 'text-slate-400'
                    }`}>
                      {drafts[platform.key].length > platform.maxChars ? '⚠️ Over limit!' : `${platform.maxChars - drafts[platform.key].length} chars remaining`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Publish All Button */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black">Ready to Publish?</h3>
                <p className="text-xs text-blue-100 mt-1">
                  Publish to {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} at once
                  {!selectedProduct && ' — select a product first'}
                </p>
              </div>
              <button
                onClick={publishToAll}
                disabled={isPublishing || !selectedProduct || selectedPlatforms.filter(p => drafts[p].trim()).length === 0}
                className="bg-white text-blue-700 font-extrabold px-8 py-3 rounded-xl text-sm shadow-xl hover:bg-blue-50 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {isPublishing ? (
                  <><span className="w-4 h-4 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" /> Publishing...</>
                ) : (
                  <>🚀 Publish to All Platforms</>
                )}
              </button>
            </div>

            {/* Publish Results */}
            {publishResults.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {publishResults.map((r, i) => (
                  <div key={i} className={`p-3 rounded-xl text-xs font-bold ${
                    r.success ? 'bg-emerald-500/20 text-emerald-100' : 'bg-red-500/20 text-red-100'
                  }`}>
                    {r.success ? '✅' : '❌'} {r.platform}: {r.success ? 'Published!' : (r.error || 'Failed')}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ POST HISTORY */}
      {activeSection === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">📋 Published Posts</h3>

          {postHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="text-4xl block mb-3">📭</span>
              <p className="text-sm font-bold">No posts yet</p>
              <p className="text-xs mt-1">Publish your first product to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {postHistory.map(post => (
                <div key={post.id} className="flex items-start gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <img
                    src={proxyImageUrl(post.image_url)}
                    alt=""
                    className="w-14 h-14 object-contain rounded-lg bg-white shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        post.platform === 'facebook' ? 'bg-blue-100 text-blue-700' :
                        post.platform === 'instagram' ? 'bg-purple-100 text-purple-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {post.platform === 'facebook' ? '📘' : post.platform === 'instagram' ? '📸' : '📌'} {post.platform}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                        post.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {post.status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {post.published_at ? new Date(post.published_at).toLocaleString() : new Date(post.created_at || '').toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{post.caption}</p>
                    {post.error_message && (
                      <p className="text-[10px] text-red-500 mt-1">Error: {post.error_message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ SETTINGS */}
      {activeSection === 'settings' && (
        <div className="space-y-4">
          {/* Existing credentials */}
          {PLATFORMS.map(platform => {
            const cred = credentials.find(c => c.platform === platform.key);
            return (
              <div key={platform.key} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{platform.icon}</span>
                    <span className="text-sm font-black">{platform.name}</span>
                    {isPlatformConnected(platform.key) ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold">
                        ✅ Connected {cred?.profile_name ? `(${cred.profile_name})` : ''}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                        Not configured
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {cred && (
                      <>
                        <button
                          onClick={() => testConnection(platform.key)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        >
                          🧪 Test Connection
                        </button>
                        <button
                          onClick={() => deleteCredential(cred.id)}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          🗑️ Remove
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setEditingCred({
                        platform: platform.key,
                        access_token: '',
                        page_id: '',
                        board_id: '',
                      })}
                      className="text-xs font-bold text-white px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm"
                    >
                      {cred ? '✏️ Edit' : '➕ Add Credentials'}
                    </button>
                  </div>
                </div>

                {/* Connection test result */}
                {credTestResult?.platform === platform.key && (
                  <div className={`mb-3 px-3 py-2 rounded-xl text-xs font-bold ${
                    credTestResult.success ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                  }`}>
                    {credTestResult.success ? '✅' : '❌'} {credTestResult.message}
                  </div>
                )}

                {/* Edit form */}
                {editingCred?.platform === platform.key && (
                  <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Access Token *</label>
                      <input
                        type="password"
                        placeholder={platform.key === 'pinterest' ? 'Pinterest access token' : 'Facebook/Instagram access token'}
                        value={editingCred.access_token || ''}
                        onChange={(e) => setEditingCred({ ...editingCred, access_token: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700 outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        {platform.key === 'facebook' && 'Get from Facebook Developer Portal → Your App → Settings → Basic → Access Tokens'}
                        {platform.key === 'instagram' && 'Same token as Facebook — use a Page Access Token with instagram_basic + instagram_content_publish permissions'}
                        {platform.key === 'pinterest' && 'Get from Pinterest Developers → Apps → Generate Access Token (needs pins:write permission)'}
                      </p>
                    </div>

                    {platform.key !== 'pinterest' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          {platform.key === 'facebook' ? 'Page ID' : 'Instagram Business Account ID'}
                        </label>
                        <input
                          type="text"
                          placeholder={platform.key === 'facebook' ? '1234567890' : '17841400123456789'}
                          value={editingCred.page_id || ''}
                          onChange={(e) => setEditingCred({ ...editingCred, page_id: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700 outline-none"
                        />
                      </div>
                    )}

                    {platform.key === 'pinterest' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Board ID</label>
                        <input
                          type="text"
                          placeholder="1234567890123456789"
                          value={editingCred.board_id || ''}
                          onChange={(e) => setEditingCred({ ...editingCred, board_id: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-xs font-mono border border-slate-200 dark:border-slate-700 outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Find in your Pinterest board URL: pinterest.com/yourboard/BOARD_ID</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Profile Name (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g., DawnWire Official Page"
                        value={editingCred.profile_name || ''}
                        onChange={(e) => setEditingCred({ ...editingCred, profile_name: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-xs border border-slate-200 dark:border-slate-700 outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={saveCredential}
                        disabled={!editingCred.access_token}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-xs disabled:opacity-50 shadow-sm"
                      >
                        💾 Save Credentials
                      </button>
                      <button
                        onClick={() => setEditingCred(null)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Help links */}
                <div className="mt-3 text-[10px] text-slate-400">
                  {platform.key === 'facebook' && (
                    <>📖 <a href="https://developers.facebook.com/docs/pages-api/getting-started" target="_blank" rel="noopener" className="underline hover:text-blue-500">Facebook Pages API Guide</a> · <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener" className="underline hover:text-blue-500">Graph API Explorer</a></>
                  )}
                  {platform.key === 'instagram' && (
                    <>📖 <a href="https://developers.facebook.com/docs/instagram-api/getting-started" target="_blank" rel="noopener" className="underline hover:text-blue-500">Instagram Graph API Guide</a> · Requires Facebook Page + Business Account</>
                  )}
                  {platform.key === 'pinterest' && (
                    <>📖 <a href="https://developers.pinterest.com/docs/getting-started/" target="_blank" rel="noopener" className="underline hover:text-blue-500">Pinterest API Guide</a> · <a href="https://developers.pinterest.com/apps/" target="_blank" rel="noopener" className="underline hover:text-blue-500">Create App</a></>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SocialMediaManager;
