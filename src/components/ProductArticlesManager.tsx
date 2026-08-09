import React, { useEffect, useState } from 'react';
import { Search, ExternalLink, Sparkles, FileText, Save, X, Check, Loader2, Eye, PencilLine } from 'lucide-react';
import { proxyImageUrl } from '../utils/safeRender';

interface ArticleRow {
  id: string;
  slug?: string;
  product_name: string;
  brand?: string;
  product_image?: string;
  status?: string;
  review_article?: string;
  hasArticle?: boolean;
  articlePreview?: string;
  articles?: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    updatedAt?: string;
  }>;
}

export default function ProductArticlesManager({ token }: { token: string }) {
  const [rows, setRows] = useState<ArticleRow[]>([]);
  const [filtered, setFiltered] = useState<ArticleRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState<string | null>(null);
  const [pubLoading, setPubLoading] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ArticleRow | null>(null);
  const [editBody, setEditBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener('focus', h);
    return () => window.removeEventListener('focus', h);
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(rows.filter(r => r.product_name.toLowerCase().includes(q) || (r.brand || '').toLowerCase().includes(q)));
  }, [search, rows]);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/product-articles', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const body = await res.json();
      const items = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
      setRows(items);
      setFiltered(items);
    }
    setLoading(false);
  }

  async function generateArticle(id: string) {
    setGenLoading(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/seo/product-reviews/generate-article/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg('Article generated as draft. Edit and publish below.');
        await load();
      } else {
        setMsg(`Error: ${body.error || 'Failed to generate article'}`);
      }
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    }
    setGenLoading(null);
  }

  async function publishPost(postId: string) {
    setPubLoading(postId);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      if (res.ok) {
        setMsg('Article published.');
        await load();
      } else {
        const body = await res.json().catch(() => ({}));
        setMsg(`Error: ${body.error || 'Failed to publish'}`);
      }
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    }
    setPubLoading(null);
  }

  function openEdit(r: ArticleRow) {
    setEditTarget(r);
    setEditBody(r.review_article || '');
  }

  async function saveArticle() {
    if (!editTarget) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/product-articles/${editTarget.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_article: editBody }),
      });
      if (res.ok) {
        setMsg('Product article saved. It now renders directly on the product page.');
        setEditTarget(null);
        await load();
      } else {
        const body = await res.json().catch(() => ({}));
        setMsg(`Error: ${body.error || 'Failed to save'}`);
      }
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    }
    setSaving(false);
  }

  const statusBadge = (s: string) => {
    const cls = s === 'published'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : s === 'scheduled'
        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide ${cls}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" /> Product Articles
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate, edit and publish review articles per product. The article also renders directly on the product page.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-slate-100 w-64"
          />
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl text-sm font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 dark:text-slate-400 text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading products...
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Page Article</th>
                  <th className="px-4 py-3">Generated Blog Post</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const post = r.articles?.[0];
                  return (
                    <tr key={r.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {r.product_image ? (
                            <img src={proxyImageUrl(r.product_image)} alt="" className="w-10 h-10 rounded-lg object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400"><FileText className="w-4 h-4" /></div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{r.product_name}</div>
                            <div className="text-[11px] text-slate-400">{r.brand} • {r.status}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.hasArticle ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"><Check className="w-3.5 h-3.5" /> Renders on page</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {post ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 max-w-[220px]">{post.title}</span>
                              {statusBadge(post.status)}
                            </div>
                            <div className="flex items-center gap-2">
                              <a href={`/post/${post.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"><Eye className="w-3 h-3" /> View</a>
                              {post.status !== 'published' && (
                                <button onClick={() => publishPost(post.id)} disabled={!!pubLoading} className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50">
                                  {pubLoading === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Publish
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => generateArticle(r.id)}
                            disabled={!!genLoading}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                          >
                            {genLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                            {genLoading === r.id ? 'Generating...' : 'Generate Article'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(r)} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
                            <PencilLine className="w-3.5 h-3.5" /> Edit Article
                          </button>
                          {r.slug && (
                            <a href={`/products/${r.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-16 text-center text-sm text-slate-400">No products yet. Import products to get started.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100">Edit Article — {editTarget.product_name}</h3>
                <p className="text-[11px] text-slate-400">Markdown supported. Renders on the product page with affiliate CTA.</p>
              </div>
              <button onClick={() => setEditTarget(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="flex-1 p-4 text-sm font-mono bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 outline-none resize-none min-h-[50vh]"
              placeholder="## Why this product stands out&#10;&#10;Write your review article in markdown..."
            />
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setEditTarget(null)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Cancel</button>
              <button onClick={saveArticle} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
