import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, Search, Star, ShoppingBag, ExternalLink, Copy, Check, RefreshCw, X, Save, Eye, Sparkles, FileText, Download } from 'lucide-react';
import { proxyImageUrl } from '../utils/safeRender';

interface ProductReviewItem {
  id: string;
  slug?: string;
  product_name: string;
  brand?: string;
  product_image?: string;
  affiliate_url?: string;
  asin?: string;
  price?: string;
  original_price?: string;
  rating: number;
  best_for?: string;
  stock_status?: string;
  deal_badge?: string;
  coupon_code?: string;
  coupon_expiry?: string;
  category_id?: string;
  pros: string[];
  cons: string[];
  key_features: string[];
  cta_text: string;
  review_summary?: string;
  final_verdict?: string;
  status: string;
  click_count?: number;
  page_views?: number;
  created_at: string;
  gallery?: string[];
  specs?: any;
}

import { Category } from '../types';

export default function ProductReviewManager({ token, categories = [] }: { token: string, categories?: Category[] }) {
  const [reviews, setReviews] = useState<ProductReviewItem[]>([]);
  const [filtered, setFiltered] = useState<ProductReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<ProductReviewItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    load();
    const handleFocus = () => load();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(reviews.filter(r => r.product_name.toLowerCase().includes(q) || (r.brand || '').toLowerCase().includes(q) || (r.best_for || '').toLowerCase().includes(q)));
  }, [search, reviews]);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/seo/product-reviews', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const body = await res.json();
      const items = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
      setReviews(items);
      setFiltered(items);
    }
    setLoading(false);
  }

  async function downloadCatalogue() {
    const res = await fetch('/api/admin/seo/product-reviews/export', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert('Download failed: ' + (body.error || res.status));
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dawnwire-catalogue-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function openNew() {
    setEditing({
      id: '', product_name: '', brand: '', product_image: '', affiliate_url: '', price: '', original_price: '', rating: 0, best_for: '', stock_status: 'in_stock', deal_badge: '', coupon_code: '', coupon_expiry: '', category_id: '', pros: [], cons: [], key_features: [], cta_text: 'Buy on Amazon', review_summary: '', final_verdict: '', status: 'draft', click_count: 0, page_views: 0, created_at: '', gallery: [], specs: {}
    });
    setIsNew(true);
  }

  function safeJsonArray(val: any): string[] {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) {
      try {
        const p = JSON.parse(val);
        if (Array.isArray(p)) return p;
      } catch {
        return val.split('\n').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  function openEdit(r: ProductReviewItem) {
    const gallery = safeJsonArray((r.specs && r.specs.gallery) || r.gallery || []);
    setEditing({
      ...r,
      asin: r.asin || (r.specs && r.specs.asin) || '',
      pros: safeJsonArray(r.pros),
      cons: safeJsonArray(r.cons),
      key_features: safeJsonArray(r.key_features),
      gallery,
      specs: r.specs || {}
    });
    setIsNew(false);
  }

  function closeEdit() {
    setEditing(null);
    setIsNew(false);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setMsg(null);
    const body: any = {
      product_name: editing.product_name,
      brand: editing.brand || null,
      product_image: editing.product_image || null,
      affiliate_url: editing.affiliate_url || null,
      asin: editing.asin || (editing.affiliate_url || '').match(/\/dp\/([A-Z0-9]{10})/)?.[1] || null,
      price: editing.price || null,
      original_price: editing.original_price || null,
      rating: editing.rating || 0,
      best_for: editing.best_for || null,
      stock_status: editing.stock_status || 'in_stock',
      deal_badge: editing.deal_badge || null,
      coupon_code: editing.coupon_code || null,
      coupon_expiry: editing.coupon_expiry || null,
      category_id: editing.category_id || null,
      pros: editing.pros,
      cons: editing.cons,
      key_features: editing.key_features,
      cta_text: editing.cta_text || 'Buy on Amazon',
      review_summary: editing.review_summary || null,
      final_verdict: editing.final_verdict || null,
      status: editing.status,
      gallery: editing.gallery || [],
      specs: { ...(editing.specs || {}), gallery: editing.gallery || [], asin: editing.asin || (editing.affiliate_url || '').match(/\/dp\/([A-Z0-9]{10})/)?.[1] || (editing.specs?.asin || null) },
    };
    const url = isNew
      ? '/api/admin/seo/product-reviews'
      : `/api/admin/seo/product-reviews/${editing.id}`;
    const method = isNew ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setMsg(isNew ? 'Product review created!' : 'Product review updated!');
      closeEdit();
      load();
    } else {
      const err = await res.json().catch(() => ({ error: 'Save failed' }));
      setMsg(`Error: ${err.error}`);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this product review?')) return;
    const res = await fetch(`/api/admin/seo/product-reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) load();
  }

  async function generateArticle(id: string) {
    setGenLoading(id);
    const res = await fetch(`/api/admin/seo/product-reviews/generate-article/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setGenLoading(null);
    if (res.ok) {
      setMsg('Article generated and saved as draft in Posts!');
    } else {
      const err = await res.json().catch(() => ({ error: 'Generation failed' }));
      setMsg(`Error: ${err.error}`);
    }
  }

  async function generateVerdict(id: string) {
    setGenLoading(id + '-verdict');
    const res = await fetch(`/api/admin/seo/product-reviews/${id}/generate-ai-verdict`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setGenLoading(null);
    if (res.ok) {
      setMsg('AI Verdict generated successfully!');
      load();
    } else {
      const err = await res.json().catch(() => ({ error: 'Generation failed' }));
      setMsg(`Error: ${err.error}`);
    }
  }

  const renderStars = (r: number) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3 h-3 ${n <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-600'}`} />
      ))}
    </div>
  );

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      published: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      draft: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
    };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[s] || styles.draft}`}>{s}</span>;
  };

  const stockBadge = (s?: string) => {
    const styles: Record<string, string> = {
      in_stock: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      low_stock: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
      out_of_stock: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      limited: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
    };
    if (!s || s === 'in_stock') return null;
    return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${styles[s] || styles.in_stock}`}>{s.replace('_', ' ')}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#246BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-[#246BFF]" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Product Reviews ({reviews.length})</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800/50 focus:outline-none br-input w-48"
            />
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all flex items-center gap-1.5 text-xs font-semibold" title="Refresh Product List">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={downloadCatalogue} className="px-3 py-2 rounded-xl border border-emerald-600/50 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20 transition-all flex items-center gap-1.5 text-xs font-semibold" title="Download full catalogue as CSV (names, live URLs, brand, price, ASIN, stock)">
            <Download className="h-3.5 w-3.5" />
            Download Catalogue
          </button>
          <button onClick={openNew} className="px-4 py-2 rounded-xl bg-[#246BFF] text-white text-xs font-semibold hover:bg-[#1a5ae0] transition-all flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Product
          </button>
        </div>
      </div>

      {/* Chrome Extension Integration Box */}
      <div className="p-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 rounded-2xl border border-blue-500/30 text-white shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">DawnWire Chrome Extension Setup</h3>
          </div>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold border border-cyan-500/40">Dashboard Connected</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Link your browser extension to import products into this dashboard. In the Chrome Extension popup, enter <strong>API URL</strong>: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">https://www.dawnwire.com</code> and paste your <strong>API Token</strong> below:
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold">API Token:</span>
            <code className="text-emerald-400 font-mono select-all font-bold">{token}</code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(token);
                setCopiedToken(true);
                setTimeout(() => setCopiedToken(false), 2000);
              }}
              className="ml-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
            >
              {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedToken ? 'Copied Token!' : 'Copy Token'}
            </button>
          </div>
        </div>
      </div>

      {msg && (
        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5">
          <span className="text-xs text-blue-700 dark:text-blue-300">{msg}</span>
          <button onClick={() => setMsg(null)}><X className="h-3.5 w-3.5 text-blue-400" /></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase border-b border-slate-200 dark:border-zinc-700">
                <th className="p-3 pl-5">Product</th>
                <th className="p-3">Price</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Status</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Clicks</th>
                <th className="p-3 text-right pr-5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-zinc-700/50 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                  <td className="p-3 pl-5">
                    <div className="flex items-center gap-3">
                      {r.product_image ? (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 overflow-hidden shrink-0">
                          <img src={proxyImageUrl(r.product_image)} alt={r.product_name} className="w-full h-full object-contain" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-700 flex items-center justify-center text-slate-400 shrink-0">
                          <ShoppingBag className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate max-w-[200px]">{r.product_name}</p>
                        {r.brand && <p className="text-[10px] text-slate-400 dark:text-zinc-500">{r.brand}</p>}
                        {r.best_for && <span className="text-[9px] text-[#246BFF] bg-[#246BFF]/5 px-1.5 py-0.5 rounded-full mt-0.5 inline-block">{r.best_for}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{r.price || '—'}</div>
                    {r.original_price && r.original_price !== r.price && (
                      <div className="text-[10px] text-slate-400 line-through">{r.original_price}</div>
                    )}
                    {r.deal_badge && <span className="text-[9px] font-bold text-red-500">🔥 {r.deal_badge}</span>}
                  </td>
                  <td className="p-3">{renderStars(r.rating)}</td>
                  <td className="p-3">{statusBadge(r.status)}</td>
                  <td className="p-3">{stockBadge(r.stock_status)}</td>
                  <td className="p-3">
                    <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300">{r.click_count || 0}</span>
                  </td>
                  <td className="p-3 pr-5">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === 'published' && (
                        <button
                          onClick={() => window.open(`/products/${r.slug || r.id}`, '_blank')}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-all"
                          title="View on site"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => generateArticle(r.id)}
                        disabled={genLoading === r.id}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-all disabled:opacity-30"
                        title="Generate buying guide article"
                      >
                        {genLoading === r.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => generateVerdict(r.id)}
                        disabled={genLoading === r.id + '-verdict'}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 hover:text-[#246BFF] transition-all disabled:opacity-30"
                        title="Generate AI Verdict"
                      >
                        {genLoading === r.id + '-verdict' ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 rounded-lg hover:bg-[#246BFF]/10 text-slate-400 hover:text-[#246BFF] transition-all"
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-slate-400 dark:text-zinc-500">
                    No product reviews found. Click "New Product" to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEdit} />
          <div className="relative bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-zinc-800 border-b border-slate-200 dark:border-zinc-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">{isNew ? 'New Product Review' : 'Edit Product Review'}</h3>
              <button onClick={closeEdit} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Product Name *</label>
                  <input type="text" value={editing.product_name} onChange={e => setEditing({ ...editing, product_name: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Brand</label>
                  <input type="text" value={editing.brand || ''} onChange={e => setEditing({ ...editing, brand: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Price</label>
                  <input type="text" value={editing.price || ''} onChange={e => setEditing({ ...editing, price: e.target.value })} placeholder="$49.99" className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Original Price</label>
                  <input type="text" value={editing.original_price || ''} onChange={e => setEditing({ ...editing, original_price: e.target.value })} placeholder="$79.99" className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Rating (0-5)</label>
                  <input type="number" min={0} max={5} step={0.1} value={editing.rating} onChange={e => setEditing({ ...editing, rating: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Best For</label>
                  <input type="text" value={editing.best_for || ''} onChange={e => setEditing({ ...editing, best_for: e.target.value })} placeholder="Gaming, Productivity..." className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Stock Status</label>
                  <select value={editing.stock_status || 'in_stock'} onChange={e => setEditing({ ...editing, stock_status: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input">
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="limited">Limited Availability</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Status</label>
                  <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Category</label>
                  <select value={editing.category_id ? (categories.find(c => c.id === editing.category_id)?.parentId || editing.category_id) : ''} onChange={e => { const pid = e.target.value; setEditing({ ...editing, category_id: pid ? (categories.filter(c => c.parentId === pid)[0]?.id || pid) : '' }); }} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input">
                    <option value="">No Category</option>
                    {categories.filter(c => !c.parentId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const selectedCat = categories.find(c => c.id === editing.category_id);
                  const parentId = selectedCat?.parentId || editing.category_id;
                  const subs = categories.filter(c => c.parentId === parentId);
                  if (!parentId || subs.length === 0) return null;
                  return (
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Subcategory</label>
                      <select value={selectedCat?.parentId ? editing.category_id || '' : ''} onChange={e => setEditing({ ...editing, category_id: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input">
                        <option value="">All {categories.find(c => c.id === parentId)?.name || ''}</option>
                        {subs.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Deal Badge</label>
                  <input type="text" value={editing.deal_badge || ''} onChange={e => setEditing({ ...editing, deal_badge: e.target.value })} placeholder="15% OFF" className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Coupon Code</label>
                  <input type="text" value={editing.coupon_code || ''} onChange={e => setEditing({ ...editing, coupon_code: e.target.value })} placeholder="SAVE20" className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Product Image URL</label>
                  <input type="text" value={editing.product_image || ''} onChange={e => setEditing({ ...editing, product_image: e.target.value })} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Additional Images (one URL per line)</label>
                  <textarea value={(editing.gallery || []).join('\n')} onChange={e => setEditing({ ...editing, gallery: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} rows={3} placeholder="https://...&#10;https://..." className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Affiliate URL (your Amazon tag link)</label>
                  <input type="text" value={editing.affiliate_url || ''} onChange={e => setEditing({ ...editing, affiliate_url: e.target.value })} placeholder="https://www.amazon.com/dp/B0XXXXX?tag=yourtag-20" className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">ASIN / Amazon Product ID</label>
                  <input type="text" value={editing.asin || ''} onChange={e => setEditing({ ...editing, asin: e.target.value.trim().toUpperCase() })} placeholder="B0XXXXXXX0 (10 chars)" className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input font-mono" />
                  <p className="text-[10px] text-slate-400 mt-1">Used for video fetch and duplicate detection. Auto-detected from the affiliate URL if left blank on save.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Review Summary</label>
                <textarea value={editing.review_summary || ''} onChange={e => setEditing({ ...editing, review_summary: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Final Verdict</label>
                <textarea value={editing.final_verdict || ''} onChange={e => setEditing({ ...editing, final_verdict: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Pros (one per line)</label>
                  <textarea value={(Array.isArray(editing.pros) ? editing.pros : []).join('\n')} onChange={e => setEditing({ ...editing, pros: e.target.value.split('\n').filter(Boolean) })} rows={5} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input font-mono" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Cons (one per line)</label>
                  <textarea value={(Array.isArray(editing.cons) ? editing.cons : []).join('\n')} onChange={e => setEditing({ ...editing, cons: e.target.value.split('\n').filter(Boolean) })} rows={5} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input font-mono" />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">Key Features (one per line)</label>
                  <textarea value={(Array.isArray(editing.key_features) ? editing.key_features : []).join('\n')} onChange={e => setEditing({ ...editing, key_features: e.target.value.split('\n').filter(Boolean) })} rows={5} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 p-2 text-xs bg-white dark:bg-zinc-900/50 focus:outline-none br-input font-mono" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button onClick={closeEdit} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all">
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving || !editing.product_name}
                  className="px-6 py-2 rounded-xl bg-[#246BFF] text-white text-xs font-semibold hover:bg-[#1a5ae0] transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isNew ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
