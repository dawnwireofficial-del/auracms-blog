import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { proxyImageUrl } from '../utils/safeRender';
import {
  Upload, Search, Package, X, Check, AlertCircle, Loader2,
  Trash2, Download, Play, Square, FileText, Globe, Tag, ExternalLink
} from 'lucide-react';

const MARKETPLACES = [
  { code: 'US', name: 'Amazon.com (US)', domain: 'www.amazon.com' },
  { code: 'UK', name: 'Amazon.co.uk', domain: 'www.amazon.co.uk' },
  { code: 'AE', name: 'Amazon.ae (UAE)', domain: 'www.amazon.ae' },
  { code: 'SA', name: 'Amazon.sa (Saudi)', domain: 'www.amazon.sa' },
  { code: 'CA', name: 'Amazon.ca', domain: 'www.amazon.ca' },
  { code: 'IN', name: 'Amazon.in', domain: 'www.amazon.in' },
  { code: 'DE', name: 'Amazon.de', domain: 'www.amazon.de' },
  { code: 'FR', name: 'Amazon.fr', domain: 'www.amazon.fr' },
  { code: 'IT', name: 'Amazon.it', domain: 'www.amazon.it' },
  { code: 'ES', name: 'Amazon.es', domain: 'www.amazon.es' },
  { code: 'JP', name: 'Amazon.co.jp', domain: 'www.amazon.co.jp' },
  { code: 'AU', name: 'Amazon.com.au', domain: 'www.amazon.com.au' },
  { code: 'BR', name: 'Amazon.com.br', domain: 'www.amazon.com.br' },
  { code: 'MX', name: 'Amazon.com.mx', domain: 'www.amazon.com.mx' },
];

const CATEGORIES = [
  'Electronics', 'Home & Kitchen', 'Beauty & Personal Care', 'Fitness',
  'Baby Products', 'Automotive', 'Office & Productivity', 'Gaming',
  'Sports & Outdoors', 'Toys & Games', 'Computers & Laptops',
  'Smartphones', 'Headphones & Audio', 'Cameras & Photo', 'Drones',
];

const CATEGORY_QUERIES: Record<string, string[]> = {
  'Electronics': ['best electronics 2025', 'top tech gadgets', 'electronics deals'],
  'Home & Kitchen': ['best home kitchen 2025', 'kitchen gadgets deals', 'home improvement must have'],
  'Beauty & Personal Care': ['best beauty products 2025', 'skincare must have', 'hair care deals'],
  'Fitness': ['best fitness gear 2025', 'home workout equipment', 'fitness tracker deals'],
  'Baby Products': ['best baby products 2025', 'baby gear essentials', 'nursery must haves'],
  'Automotive': ['best car accessories 2025', 'auto detailing tools', 'car gadgets'],
  'Office & Productivity': ['best desk accessories 2025', 'office productivity tools', 'monitor stands deals'],
  'Gaming': ['best gaming gear 2025', 'gaming chair deals', 'rgb keyboard mouse'],
  'Sports & Outdoors': ['best outdoor gear 2025', 'camping equipment deals', 'fitness sports gear'],
  'Toys & Games': ['best toys 2025', 'board games deals', 'educational toys'],
  'Computers & Laptops': ['best laptops 2025', 'laptop deals', 'chromebook under 500'],
  'Smartphones': ['best smartphones 2025', 'phone deals', 'android phones under 300'],
  'Headphones & Audio': ['best headphones 2025', 'noise canceling deals', 'wireless earbuds'],
  'Cameras & Photo': ['best cameras 2025', 'mirrorless deals', 'action camera'],
  'Drones': ['best drones 2025', 'drone under 500', 'camera drone deals'],
};

interface Props {
  token: string;
}

interface SearchPreviewItem {
  asin: string;
  title: string;
  price: number | null;
  image: string;
  url: string;
  selected: boolean;
  relevanceScore: number;
}

export default function AmazonBulkImporter({ token }: Props) {
  const [activeTab, setActiveTab] = useState<'csv' | 'search' | 'category'>('csv');
  const [marketplace, setMarketplace] = useState('US');
  const [csvText, setCsvText] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvAsins, setCsvAsins] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchPreviewItem[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryResults, setCategoryResults] = useState<SearchPreviewItem[]>([]);
  const [scanning, setScanning] = useState(false);

  const [importing, setImporting] = useState(false);
  const [jobId, setJobId] = useState('');
  const [progress, setProgress] = useState({ processed: 0, succeeded: 0, failed: 0, skipped: 0, total: 0, status: 'idle' });
  const [errors, setErrors] = useState<string[]>([]);
  const [currentAsin, setCurrentAsin] = useState('');
  const [maxProducts, setMaxProducts] = useState(100);
  const [updateExisting, setUpdateExisting] = useState(true);

  const getApiBase = () => (process.env.APP_URL?.replace(/\/$/, '') || 'https://www.dawnwire.com');

  function extractAsin(input: string): string {
    const match = input.match(/(?:\/dp\/|\/gp\/product\/|\/product\/|ASIN=|\/d\/)([A-Z0-9]{10})/i);
    if (match) return match[1].toUpperCase();
    const trimmed = input.trim().toUpperCase();
    if (/^[A-Z0-9]{10}$/.test(trimmed)) return trimmed;
    return '';
  }

  function parseCsvAsins(text: string): string[] {
    const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
    const seen = new Set<string>();
    const result: string[] = [];
    for (const line of lines) {
      const asin = extractAsin(line);
      if (asin && !seen.has(asin)) {
        seen.add(asin);
        result.push(asin);
      }
    }
    return result;
  }

  const handleCsvFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setCsvAsins(parseCsvAsins(text));
    };
    reader.readAsText(file);
  }, []);

  const handleCsvPaste = useCallback((text: string) => {
    setCsvText(text);
    setCsvAsins(parseCsvAsins(text));
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`${getApiBase()}/api/admin/products/search-amazon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, marketplace, maxResults: maxProducts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      const items: SearchPreviewItem[] = data.results.map((r: any) => ({
        ...r,
        selected: false,
      }));
      setSearchResults(items);
    } catch (e: any) {
      alert(e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const toggleSearchSelect = (asin: string) => {
    setSearchResults(prev => prev.map(r => r.asin === asin ? { ...r, selected: !r.selected } : r));
  };

  const toggleAllSearch = () => {
    const anySelected = searchResults.some(r => r.selected);
    setSearchResults(prev => prev.map(r => ({ ...r, selected: !anySelected })));
  };

  const handleCategoryScan = async () => {
    if (!selectedCategory) return;
    setScanning(true);
    setCategoryResults([]);
    try {
      const queries = CATEGORY_QUERIES[selectedCategory] || [selectedCategory];
      const seen = new Set<string>();
      const all: SearchPreviewItem[] = [];
      for (const q of queries) {
        const res = await fetch(`${getApiBase()}/api/admin/products/search-amazon`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, marketplace, maxResults: 50 }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');
        for (const r of (data.results || [])) {
          if (!seen.has(r.asin)) {
            seen.add(r.asin);
            all.push({ ...r, selected: true });
          }
        }
        if (all.length >= maxProducts) break;
        await new Promise(r => setTimeout(r, 1500));
      }
      setCategoryResults(all.slice(0, maxProducts));
    } catch (e: any) {
      alert(e.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const toggleCategorySelect = (asin: string) => {
    setCategoryResults(prev => prev.map(r => r.asin === asin ? { ...r, selected: !r.selected } : r));
  };

  const startImport = async (asins: string[], source: string) => {
    if (asins.length === 0) return;
    setImporting(true);
    setErrors([]);
    setProgress({ processed: 0, succeeded: 0, failed: 0, skipped: 0, total: asins.length, status: 'running' });
    setJobId('');

    try {
      const res = await fetch(`${getApiBase()}/api/admin/products/bulk-import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          asins,
          queries: source === 'search' ? [searchQuery] : source === 'category' ? CATEGORY_QUERIES[selectedCategory] : undefined,
          marketplace,
          maxProducts: asins.length,
          updateExisting,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setJobId(data.job.id);
      pollJob(data.job.id);
    } catch (e: any) {
      setProgress(prev => ({ ...prev, status: 'failed' }));
      setErrors([e.message || 'Import failed']);
      setImporting(false);
    }
  };

  const pollJob = async (jid: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/admin/products/bulk-import/${jid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Poll failed');
        setProgress({
          processed: data.processed_items || 0,
          succeeded: data.succeeded || 0,
          failed: data.failed || 0,
          skipped: data.skipped || 0,
          total: data.total_items || 0,
          status: data.status,
        });
        if (data.result?.errors) setErrors(data.result.errors);
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          clearInterval(interval);
          setImporting(false);
        }
      } catch (e: any) {
        clearInterval(interval);
        setImporting(false);
        setErrors([e.message || 'Poll failed']);
      }
    }, 2000);
  };

  const cancelImport = async () => {
    if (!jobId) return;
    try {
      await fetch(`${getApiBase()}/api/admin/products/bulk-import/${jobId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    setImporting(false);
    setProgress(prev => ({ ...prev, status: 'cancelled' }));
  };

  const selectedSearchAsins = searchResults.filter(r => r.selected).map(r => r.asin);
  const selectedCategoryAsins = categoryResults.filter(r => r.selected).map(r => r.asin);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100">Amazon Bulk Import</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Import up to 1000 products from Amazon with auto affiliate links (tag=dawnwire-20)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Marketplace</label>
          <select
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
            disabled={importing}
            className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-50"
          >
            {MARKETPLACES.map(m => (
              <option key={m.code} value={m.code}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-1 bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-1">
        {[
          { key: 'csv', icon: FileText, label: 'CSV Upload' },
          { key: 'search', icon: Search, label: 'Keyword Search' },
          { key: 'category', icon: Globe, label: 'Category Scan' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            disabled={importing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
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

      <div className="flex items-center gap-4 bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
            disabled={importing}
            className="rounded border-slate-300"
          />
          <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">Update existing products (skip duplicates if unchecked)</span>
        </label>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase">Max</label>
          <select
            value={maxProducts}
            onChange={(e) => setMaxProducts(Number(e.target.value))}
            disabled={importing}
            className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-50"
          >
            {[10, 25, 50, 100, 250, 500, 1000].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'csv' && (
          <motion.div key="csv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-4">
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Upload className="h-5 w-5 text-[#246BFF]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Upload CSV or Paste ASINs</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1 block">Or paste ASINs / Amazon URLs (one per line)</label>
                  <textarea
                    value={csvText}
                    onChange={(e) => handleCsvPaste(e.target.value)}
                    disabled={importing}
                    placeholder={"B09XS7JWHH\nhttps://www.amazon.com/dp/B0C762112C\nB0CHWRXH8B"}
                    rows={6}
                    className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-xl p-3 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-mono disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold">Or upload .csv / .txt</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvFile}
                    disabled={importing}
                    className="text-xs text-slate-500 dark:text-zinc-400 disabled:opacity-50"
                  />
                  {csvFile && <span className="text-[10px] text-emerald-600 font-bold">{csvFile.name}</span>}
                </div>
                {csvAsins.length > 0 && (
                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      {csvAsins.length} valid ASIN(s) detected
                    </span>
                    <button
                      onClick={() => startImport(csvAsins.slice(0, maxProducts), 'csv')}
                      disabled={importing}
                      className="px-4 py-2 bg-[#246BFF] hover:bg-[#1a5ae6] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      Import {Math.min(csvAsins.length, maxProducts)} Products
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'search' && (
          <motion.div key="search" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-4">
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Search className="h-5 w-5 text-[#246BFF]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Search Amazon Products</h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={searching || importing}
                  placeholder="e.g. wireless headphones, mechanical keyboard..."
                  className="flex-1 text-xs border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 disabled:opacity-50"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || importing || !searchQuery.trim()}
                  className="px-5 py-2.5 bg-[#246BFF] hover:bg-[#1a5ae6] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  Search
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-700/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                    {searchResults.length} results
                    <span className="text-slate-400 dark:text-zinc-500 font-normal ml-1">
                      ({selectedSearchAsins.length} selected)
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleAllSearch}
                      disabled={importing}
                      className="text-[10px] font-bold text-[#246BFF] bg-[#246BFF]/5 px-3 py-1.5 rounded-lg hover:bg-[#246BFF]/10 transition-all disabled:opacity-50"
                    >
                      {searchResults.some(r => r.selected) ? 'Deselect All' : 'Select All'}
                    </button>
                    <button
                      onClick={() => startImport(selectedSearchAsins.slice(0, maxProducts), 'search')}
                      disabled={importing || selectedSearchAsins.length === 0}
                      className="px-4 py-1.5 bg-[#246BFF] hover:bg-[#1a5ae6] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      Import Selected ({selectedSearchAsins.length})
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-left">
                        <th className="p-3 w-10"><input type="checkbox" checked={searchResults.every(r => r.selected)} onChange={toggleAllSearch} disabled={importing} /></th>
                        <th className="p-3 font-bold text-slate-500 dark:text-zinc-400">Image</th>
                        <th className="p-3 font-bold text-slate-500 dark:text-zinc-400">Title</th>
                        <th className="p-3 font-bold text-slate-500 dark:text-zinc-400">ASIN</th>
                        <th className="p-3 font-bold text-slate-500 dark:text-zinc-400">Price</th>
                        <th className="p-3 font-bold text-slate-500 dark:text-zinc-400">Relevance</th>
                        <th className="p-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map(r => (
                        <tr key={r.asin} className={`border-t border-slate-100 dark:border-zinc-700/50 hover:bg-slate-50/50 dark:hover:bg-zinc-700/20 ${r.selected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                          <td className="p-3"><input type="checkbox" checked={r.selected} onChange={() => toggleSearchSelect(r.asin)} disabled={importing} /></td>
                          <td className="p-3"><img src={proxyImageUrl(r.image)} alt="" referrerPolicy="no-referrer" className="h-10 w-10 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></td>
                          <td className="p-3 font-medium text-slate-700 dark:text-zinc-300 max-w-xs truncate">{r.title}</td>
                          <td className="p-3 font-mono text-slate-500 dark:text-zinc-400">{r.asin}</td>
                          <td className="p-3 text-slate-600 dark:text-zinc-400">{r.price ? `$${r.price.toFixed(2)}` : 'N/A'}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div className="h-full bg-[#246BFF] rounded-full" style={{ width: `${Math.min(r.relevanceScore * 100, 100)}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500 dark:text-zinc-400">{Math.round(r.relevanceScore * 100)}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#246BFF]">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'category' && (
          <motion.div key="category" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-4">
            <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-[#246BFF]" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Scan Amazon Category</h3>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={scanning || importing}
                  className="flex-1 text-xs border border-slate-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 disabled:opacity-50"
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={handleCategoryScan}
                  disabled={scanning || importing || !selectedCategory}
                  className="px-5 py-2.5 bg-[#246BFF] hover:bg-[#1a5ae6] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                  Scan & Import
                </button>
              </div>
            </div>

            {categoryResults.length > 0 && (
              <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-700/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                    {categoryResults.length} products found
                    <span className="text-slate-400 dark:text-zinc-500 font-normal ml-1">
                      ({selectedCategoryAsins.length} selected)
                    </span>
                  </span>
                  <button
                    onClick={() => startImport(selectedCategoryAsins.slice(0, maxProducts), 'category')}
                    disabled={importing || selectedCategoryAsins.length === 0}
                    className="px-4 py-1.5 bg-[#246BFF] hover:bg-[#1a5ae6] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    Import Selected ({selectedCategoryAsins.length})
                  </button>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-zinc-900/50 text-left sticky top-0">
                        <th className="p-3 w-10"><input type="checkbox" checked={categoryResults.every(r => r.selected)} onChange={() => {
                          const anySelected = categoryResults.some(r => r.selected);
                          setCategoryResults(prev => prev.map(r => ({ ...r, selected: !anySelected })));
                        }} disabled={importing} /></th>
                        <th className="p-3 font-bold text-slate-500 dark:text-zinc-400">Image</th>
                        <th className="p-3 font-bold text-slate-500 dark:text-zinc-400">Title</th>
                        <th className="p-3 font-bold text-slate-500 dark:text-zinc-400">ASIN</th>
                        <th className="p-3 font-bold text-slate-500 dark:text-zinc-400">Price</th>
                        <th className="p-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryResults.map(r => (
                        <tr key={r.asin} className={`border-t border-slate-100 dark:border-zinc-700/50 hover:bg-slate-50/50 dark:hover:bg-zinc-700/20 ${r.selected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                          <td className="p-3"><input type="checkbox" checked={r.selected} onChange={() => toggleCategorySelect(r.asin)} disabled={importing} /></td>
                          <td className="p-3"><img src={proxyImageUrl(r.image)} alt="" referrerPolicy="no-referrer" className="h-10 w-10 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></td>
                          <td className="p-3 font-medium text-slate-700 dark:text-zinc-300 max-w-xs truncate">{r.title}</td>
                          <td className="p-3 font-mono text-slate-500 dark:text-zinc-400">{r.asin}</td>
                          <td className="p-3 text-slate-600 dark:text-zinc-400">{r.price ? `$${r.price.toFixed(2)}` : 'N/A'}</td>
                          <td className="p-3">
                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#246BFF]">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {(progress.status === 'running' || progress.status === 'cancelled' || progress.status === 'completed' || progress.status === 'failed') && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Import Progress</h3>
            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
              progress.status === 'running' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              progress.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              progress.status === 'cancelled' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {progress.status}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#246BFF] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Processed', value: `${progress.processed} / ${progress.total}`, color: 'text-slate-600 dark:text-zinc-300' },
              { label: 'Succeeded', value: progress.succeeded, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Failed', value: progress.failed, color: 'text-red-600 dark:text-red-400' },
              { label: 'Skipped', value: progress.skipped, color: 'text-amber-600 dark:text-amber-400' },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-3 text-center">
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold">{stat.label}</div>
              </div>
            ))}
          </div>

          {progress.status === 'running' && (
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 text-[#246BFF] animate-spin" />
              <span className="text-xs text-slate-600 dark:text-zinc-400">Processing: {currentAsin || '...'}</span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50 p-4 max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-xs font-bold text-red-700 dark:text-red-400">Errors ({errors.length})</span>
              </div>
              <div className="space-y-1">
                {errors.slice(-20).map((err, i) => (
                  <div key={i} className="text-[10px] text-red-600 dark:text-red-400 font-mono">{err}</div>
                ))}
              </div>
            </div>
          )}

          {progress.status === 'running' && (
            <button
              onClick={cancelImport}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <Square className="h-3.5 w-3.5" />
              Cancel Import
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
}
