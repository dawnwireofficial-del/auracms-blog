import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Download, Settings, Package, Copy, Check, ExternalLink, Smartphone, Globe, Key, Wifi, Play, AlertCircle, Search, Star, ExternalLink as LinkIcon } from 'lucide-react';
import { proxyImageUrl } from '../utils/safeRender';

interface Props {
  token: string;
}

export default function ExtensionManager({ token }: Props) {
  const [activeTab, setActiveTab] = useState<'setup' | 'settings' | 'products'>('setup');
  const [copiedToken, setCopiedToken] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [apiUrl, setApiUrl] = useState('https://www.dawnwire.com');

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const testConnection = async () => {
    setTestResult('testing');
    try {
      const res = await fetch(apiUrl + '/api/auth/me', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        setTestResult('success');
      } else {
        setTestResult('error');
      }
    } catch {
      setTestResult('error');
    }
    setTimeout(() => setTestResult('idle'), 3000);
  };

function ImportedProductsTab({ token }: { token: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/product-reviews?limit=200', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = search
    ? products.filter(p =>
        (p.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.slug || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.asin || '').toLowerCase().includes(search.toLowerCase())
      )
    : products;

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#246BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, slug or ASIN..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-[#246BFF]/30 focus:border-[#246BFF] outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono">{filtered.length} products</span>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Package className="h-10 w-10 text-slate-300 dark:text-zinc-600" />
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            {search ? 'No products match your search.' : 'No products imported yet. Use the browser extension to import products.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
                <th className="text-left py-2.5 px-3">Product</th>
                <th className="text-left py-2.5 px-3">Brand</th>
                <th className="text-left py-2.5 px-3">Price</th>
                <th className="text-left py-2.5 px-3">Rating</th>
                <th className="text-left py-2.5 px-3">Status</th>
                <th className="text-left py-2.5 px-3">ASIN</th>
                <th className="text-right py-2.5 px-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-zinc-700/50 hover:bg-slate-50 dark:hover:bg-zinc-700/30 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      {p.product_image ? (
                        <img src={proxyImageUrl(p.product_image)} alt="" referrerPolicy="no-referrer" className="w-8 h-8 rounded-lg object-cover bg-white dark:bg-zinc-800" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">📦</div>
                      )}
                      <span className="font-semibold text-slate-700 dark:text-zinc-200 truncate max-w-[200px]">{p.product_name || p.title || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400">{p.brand || '—'}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-zinc-200">{p.price || '—'}</td>
                  <td className="py-2.5 px-3">
                    {p.rating ? (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3 w-3 fill-amber-400" /> {Number(p.rating).toFixed(1)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.status === 'published' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                      p.status === 'draft' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                      'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}>{p.status || 'draft'}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 dark:text-zinc-500">{p.asin || p.specs?.asin || '—'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <a
                      href={`/products/${p.slug || p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#246BFF] hover:underline font-semibold"
                    >
                      <LinkIcon className="h-3 w-3" />
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

  const tabs = [
    { key: 'setup', icon: Play, label: 'Setup Guide' },
    { key: 'settings', icon: Settings, label: 'Settings' },
    { key: 'products', icon: Package, label: 'Imported Products' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Browser Extension</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Import Amazon, Walmart, Best Buy, AliExpress &amp; eBay products directly into DawnWire
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded-full">
          <Download className="h-3 w-3" />
          Extension v1.0
        </span>
      </div>

      <div className="flex gap-1 bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-[#246BFF] text-white shadow-sm'
                : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-700/50'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'setup' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-dw-blue/20 to-dw-orange/20 dark:from-blue-900/30 dark:to-orange-900/30 rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#246BFF]/10 flex items-center justify-center shrink-0">
                <Download className="h-5 w-5 text-[#246BFF]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Step 1: Install the Extension</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Download the DawnWire Browser Extension from the Chrome Web Store, or load it unpacked from the <code className="text-[#246BFF] bg-[#246BFF]/10 px-1 rounded">browser-extension/</code> folder in developer mode.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-[#246BFF] hover:underline"
                  onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Go to Settings to configure
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Step 2: Set API URL</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                In the extension popup, enter your DawnWire site URL as the API URL:
              </p>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700">
                <code className="text-xs font-mono text-[#246BFF] font-bold">https://www.dawnwire.com</code>
                <button
                  onClick={() => { navigator.clipboard.writeText('https://www.dawnwire.com'); }}
                  className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                  title="Copy URL"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Step 3: Paste API Token</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Copy your API token below and paste it into the extension popup&apos;s API Token field:
              </p>
              <div className="flex items-center gap-2 bg-slate-950 dark:bg-black px-3 py-2 rounded-xl border border-slate-700">
                <code className="text-xs font-mono text-emerald-400 font-bold truncate flex-1">{token}</code>
                <button
                  onClick={copyToken}
                  className="text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                  title="Copy token"
                >
                  {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dw-blue/10 dark:bg-blue-900/30 flex items-center justify-center">
                <Smartphone className="h-4 w-4 text-dw-blue dark:text-blue-400" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Step 4: Start Importing</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
              Navigate to any Amazon product page (or Walmart, Best Buy, AliExpress, eBay). A DawnWire import banner will appear at the top of the page. Click <strong className="text-slate-700 dark:text-zinc-200">&ldquo;Import to DawnWire&rdquo;</strong> to import the product. The extension will automatically:
            </p>
            <ul className="space-y-1.5 mt-2">
              {[
                'Extract product title, brand, price, rating, images, and specifications',
                'Detect and save product video URLs',
                'Create an affiliate cloak link',
                'Generate an AI buying guide article',
                'Update existing products if already imported (by ASIN)',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-zinc-300">
                  <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              The extension also works on <strong>search result pages</strong>, <strong>brand stores</strong>, and <strong>wishlist pages</strong> — look for the &ldquo;Import All&rdquo; banner to batch-import multiple products at once.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1.5">API URL</label>
              <input
                readOnly
                value="https://www.dawnwire.com"
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-700 dark:text-zinc-200"
              />
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Enter this URL in the extension popup &rarr; Settings</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1.5">Browser Extension API Token</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={token}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-slate-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-mono text-emerald-600 dark:text-emerald-400"
                />
                <button
                  onClick={copyToken}
                  className="px-4 py-2.5 rounded-xl bg-[#246BFF] text-white text-xs font-bold hover:bg-[#1a5ae8] transition-all flex items-center gap-1.5 shrink-0"
                >
                  {copiedToken ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedToken ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                This token authenticates the extension to your DawnWire admin API. Keep it private.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1.5">Test Connection</label>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
                Verify the extension can connect to your DawnWire API with the current token.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value)}
                    placeholder="https://www.dawnwire.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-mono bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 focus:ring-2 focus:ring-[#246BFF]/30 focus:border-[#246BFF] outline-none transition-all"
                  />
                </div>
                <button
                  onClick={testConnection}
                  disabled={testResult === 'testing'}
                  className="px-4 py-2.5 rounded-xl bg-[#246BFF] text-white text-xs font-bold hover:bg-[#1a5ae8] transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {testResult === 'testing' ? (
                    <><Wifi className="h-3.5 w-3.5 animate-spin" /> Testing...</>
                  ) : (
                    <><Wifi className="h-3.5 w-3.5" /> Test</>
                  )}
                </button>
              </div>
              {testResult === 'success' && (
                <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <Check className="h-3.5 w-3.5" />
                  Connection successful! Your extension is ready to use.
                </div>
              )}
              {testResult === 'error' && (
                <div className="mt-3 flex items-center gap-2 text-red-500 dark:text-red-400 text-xs font-bold">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Connection failed. Check the API URL and token, then try again.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <ImportedProductsTab token={token} />
      )}
    </div>
  );
}
