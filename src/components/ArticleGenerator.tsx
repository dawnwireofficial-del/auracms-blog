import React, { useEffect, useState } from 'react';
import {
  Search, Sparkles, Loader2, Upload, Image as ImageIcon, X, Save, Eye,
  Check, PencilLine, FileText, FolderOpen, Package, ExternalLink,
} from 'lucide-react';
import { proxyImageUrl } from '../utils/safeRender';

interface GeneratorProduct {
  id: string;
  slug?: string;
  product_name: string;
  brand?: string;
  product_image?: string;
  price?: string;
  rating?: number;
  best_for?: string;
  editor_score?: number;
  category_id?: string;
  status?: string;
}

interface GeneratorCategory {
  id: string;
  name: string;
  slug: string;
}

interface PostDraft {
  id: string;
  slug?: string;
  title?: string;
}

type Mode = 'product' | 'category';

const uploadImage = async (token: string, base64: string, fileName: string): Promise<string> => {
  const res = await fetch('/api/admin/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ base64, fileName }),
  });
  if (!res.ok) throw new Error('Image upload failed');
  const data = await res.json();
  return data.url || (data as any)?.url || '';
};

export default function ArticleGenerator({ token }: { token: string }) {
  const [mode, setMode] = useState<Mode>('product');
  const [products, setProducts] = useState<GeneratorProduct[]>([]);
  const [categories, setCategories] = useState<GeneratorCategory[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<GeneratorProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GeneratorCategory | null>(null);
  const [post, setPost] = useState<PostDraft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Editor fields
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editStatus, setEditStatus] = useState('draft');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editSeoDescription, setEditSeoDescription] = useState('');
  const [editSeoKeywords, setEditSeoKeywords] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [pr, cats] = await Promise.all([
        fetch('/api/admin/seo/product-reviews?limit=500', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/public/categories'),
      ]);
      const prBody = await pr.json();
      const catsBody = await cats.json();
      const items = Array.isArray(prBody.data) ? prBody.data : Array.isArray(prBody) ? prBody : [];
      const catsItems = Array.isArray(catsBody.data) ? catsBody.data : Array.isArray(catsBody) ? catsBody : [];
      setProducts(items);
      setCategories(catsItems.filter((c: any) => c.status === 'active' || c.status === undefined));
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (p.product_name || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q);
  });
  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  function openProductEditor(p: GeneratorProduct, draft: PostDraft) {
    setSelectedProduct(p);
    setPost(draft);
    setEditTitle(draft.title || p.product_name + ' Review & Buying Guide');
    setEditSlug(draft.slug || '');
    setEditExcerpt('');
    setEditContent('');
    setEditImage(p.product_image || '');
    setEditCategory(p.category_id || '');
    setEditTags([p.product_name, p.brand || '', 'review', 'buying guide'].filter(Boolean).join(', '));
    setEditStatus('draft');
    setEditSeoTitle(draft.title || '');
    setEditSeoDescription('');
    setEditSeoKeywords('');
    setShowEditor(true);
  }

  function openCategoryEditor(cat: GeneratorCategory, draft: PostDraft) {
    setSelectedCategory(cat);
    setPost(draft);
    setEditTitle(draft.title || 'Best ' + cat.name + ' — Buying Guide');
    setEditSlug(draft.slug || '');
    setEditExcerpt('');
    setEditContent('');
    setEditImage('');
    setEditCategory(cat.id);
    setEditTags([cat.name, 'buying guide', 'best ' + cat.name.toLowerCase()].filter(Boolean).join(', '));
    setEditStatus('draft');
    setEditSeoTitle(draft.title || '');
    setEditSeoDescription('');
    setEditSeoKeywords('');
    setShowEditor(true);
  }

  interface FullPost {
    id: string;
    slug?: string;
    title?: string;
    excerpt?: string;
    content?: string;
    featured_image?: string;
    category_id?: string;
    tags?: string[];
    status?: string;
    seo_title?: string;
    seo_description?: string;
    seo_keywords?: string;
  }

  async function fetchPostBody(postId: string): Promise<FullPost> {
    const res = await fetch(`/api/admin/posts?limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to load posts');
    const body = await res.json();
    const items = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
    const found = items.find((p: any) => p.id === postId) || {};
    return {
      id: postId,
      slug: found.slug,
      title: found.title,
      excerpt: found.excerpt,
      content: found.content,
      featured_image: found.featured_image || found.featuredImage,
      category_id: found.category_id || found.categoryId,
      tags: found.tags,
      status: found.status,
      seo_title: found.seo_title || found.seoTitle,
      seo_description: found.seo_description || found.seoDescription,
      seo_keywords: found.seo_keywords || found.seoKeywords,
    };
  }

  async function generateProductArticle() {
    if (!selectedProduct) return;
    setGenerating(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/seo/product-reviews/generate-article/${selectedProduct.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Article generation failed');
      const draft: PostDraft = body.post || { id: '', title: body.title };
      const full: FullPost = await fetchPostBody(draft.id).catch(() => ({ id: draft.id }));
      setPost(draft);
      openProductEditor(selectedProduct, { id: draft.id, slug: full.slug, title: full.title || draft.title });
      // Patch the editor with fetched full content
      setEditTitle(full.title || draft.title || '');
      setEditSlug(full.slug || draft.slug || '');
      setEditExcerpt(full.excerpt || '');
      setEditContent(full.content || '');
      setEditImage(full.featured_image || selectedProduct.product_image || '');
      setEditCategory(full.category_id || selectedProduct.category_id || '');
      setEditTags(Array.isArray(full.tags) ? full.tags.join(', ') : '');
      setEditStatus(full.status || 'draft');
      setEditSeoTitle(full.seo_title || '');
      setEditSeoDescription(full.seo_description || '');
      setEditSeoKeywords(typeof full.seo_keywords === 'string' ? full.seo_keywords : '');
      setMsg('Article generated. Edit, add a featured image, then publish.');
    } catch (e: any) {
      setError(e.message);
    }
    setGenerating(false);
  }

  async function generateCategoryArticle() {
    if (!selectedCategory) return;
    setGenerating(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/seo/buying-guides/generate/${selectedCategory.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Buying guide generation failed');
      const draft: PostDraft = body.post || { id: '', title: body.title };
      const full: FullPost = await fetchPostBody(draft.id).catch(() => ({ id: draft.id }));
      setPost(draft);
      openCategoryEditor(selectedCategory, { id: draft.id, slug: full.slug, title: full.title || draft.title });
      setEditTitle(full.title || draft.title || '');
      setEditSlug(full.slug || draft.slug || '');
      setEditExcerpt(full.excerpt || '');
      setEditContent(full.content || '');
      setEditImage(full.featured_image || '');
      setEditCategory(full.category_id || selectedCategory.id);
      setEditTags(Array.isArray(full.tags) ? full.tags.join(', ') : '');
      setEditStatus(full.status || 'draft');
      setEditSeoTitle(full.seo_title || '');
      setEditSeoDescription(full.seo_description || '');
      setEditSeoKeywords(typeof full.seo_keywords === 'string' ? full.seo_keywords : '');
      setMsg('Buying guide generated. Edit, add a featured image, then publish.');
    } catch (e: any) {
      setError(e.message);
    }
    setGenerating(false);
  }

  async function savePost() {
    if (!post?.id) { setError('No post to save'); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: editTitle,
        slug: editSlug,
        excerpt: editExcerpt,
        content: editContent,
        featuredImage: editImage,
        categoryId: editCategory || null,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        status: editStatus,
        seoTitle: editSeoTitle,
        seoDescription: editSeoDescription,
        seoKeywords: editSeoKeywords,
      };
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Save failed');
      setMsg('Article saved! ' + (editStatus === 'published' ? 'It is now live.' : 'It is still a draft.'));
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const url = await uploadImage(token, String(reader.result), file.name);
          setEditImage(url);
        } catch (err: any) {
          setError(err.message);
        }
        setUploading(false);
      };
      reader.onerror = () => { setUploading(false); setError('Could not read file'); };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  }

  const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40';
  const labelCls = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 dark:text-slate-400 text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading products & categories...
      </div>
    );
  }

  if (showEditor && post?.id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PencilLine className="w-5 h-5 text-blue-500" /> Edit Generated Article
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedProduct
                ? `Product: ${selectedProduct.product_name}${selectedProduct.brand ? ' · ' + selectedProduct.brand : ''}`
                : selectedCategory ? `Category: ${selectedCategory.name}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEditor(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700">Back</button>
            {post.slug && (
              <a href={`/post/${post.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl border border-blue-500/30">
                <Eye className="w-4 h-4" /> View
              </a>
            )}
            <button onClick={savePost} disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-between">
            <span>{msg}</span>
            <button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl text-sm font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: content */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className={labelCls}>Title</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Slug</label>
                <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className={inputCls}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Excerpt</label>
              <textarea value={editExcerpt} onChange={(e) => setEditExcerpt(e.target.value)} rows={2} className={inputCls} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + ' mb-0'}>Article Body (Markdown)</label>
                <span className="text-[10px] text-slate-400">Supports <code className="text-blue-500">[affiliate-card:slug]</code></span>
              </div>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={18} className={inputCls + ' font-mono'} />
            </div>
          </div>

          {/* Right: image + meta */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700 pb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Featured Image
              </h4>
              {editImage ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={proxyImageUrl(editImage)} alt="Featured" className="w-full h-44 object-contain bg-slate-50 dark:bg-slate-950" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <button onClick={() => setEditImage('')} className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/70 text-white hover:bg-slate-950" title="Remove"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="h-44 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs">No featured image</span>
                </div>
              )}
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 disabled:opacity-60">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                {selectedProduct?.product_image && (
                  <button onClick={() => setEditImage(selectedProduct.product_image || '')} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
                    <Package className="w-3.5 h-3.5" /> Use Product Image
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700 pb-2 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" /> Category & Tags
              </h4>
              <div>
                <label className={labelCls}>Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputCls}>
                  <option value="">Uncategorized</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Tags (comma-separated)</label>
                <input value={editTags} onChange={(e) => setEditTags(e.target.value)} className={inputCls} placeholder="review, buying guide, k-beauty" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700 pb-2">SEO & Metadata</h4>
              <div>
                <label className={labelCls}>SEO Title</label>
                <input value={editSeoTitle} onChange={(e) => setEditSeoTitle(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Meta Description</label>
                <textarea value={editSeoDescription} onChange={(e) => setEditSeoDescription(e.target.value)} rows={2} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>SEO Keywords</label>
                <input value={editSeoKeywords} onChange={(e) => setEditSeoKeywords(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={() => setShowEditor(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700">Back to Selector</button>
          <button onClick={savePost} disabled={saving} className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editStatus === 'published' ? 'Update Article' : 'Publish Article'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" /> Article Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Search for a product or category, generate an AI article, add a featured image, then publish like a blog post.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
            {(['product', 'category'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setSearch(''); setSelectedProduct(null); setSelectedCategory(null); }}
                className={`px-4 py-2 text-xs font-bold capitalize transition-all ${mode === m ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {m === 'product' ? 'Product' : 'Category'}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl text-sm font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={mode === 'product' ? 'Search products by name or brand...' : 'Search categories...'}
          className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-slate-100"
        />
      </div>

      {mode === 'product' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.slice(0, 48).map((p) => (
            <div
              key={p.id}
              className={`group bg-white dark:bg-slate-900 rounded-2xl border p-4 transition-all hover:shadow-lg cursor-pointer ${selectedProduct?.id === p.id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-800'}`}
              onClick={() => { setSelectedProduct(p); setMsg(null); }}
            >
              <div className="flex items-center gap-3">
                {p.product_image ? (
                  <img src={proxyImageUrl(p.product_image)} alt="" className="w-14 h-14 rounded-lg object-contain bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Package className="w-5 h-5" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">{p.product_name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {p.brand} {p.price ? '· ' + p.price : ''}
                  </div>
                </div>
              </div>
              {(p.rating || p.editor_score) && (
                <div className="flex items-center gap-2 mt-2 text-[11px] font-bold">
                  {p.rating ? <span className="text-amber-500">★ {p.rating}</span> : null}
                  {p.editor_score ? <span className="text-blue-600 dark:text-blue-400">Score: {p.editor_score}/10</span> : null}
                  {p.best_for ? <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full truncate">{p.best_for}</span> : null}
                </div>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={generating}
              >
                {generating && selectedProduct?.id === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Select & Generate
              </button>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-16 text-sm text-slate-400">No products match your search.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((c) => (
            <div
              key={c.id}
              className={`group bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all hover:shadow-lg cursor-pointer ${selectedCategory?.id === c.id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-800'}`}
              onClick={() => { setSelectedCategory(c); setMsg(null); }}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{c.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Best {c.name} Buying Guide</div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedCategory(c); }}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={generating}
              >
                {generating && selectedCategory?.id === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generate Guide
              </button>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full text-center py-16 text-sm text-slate-400">No categories match your search.</div>
          )}
        </div>
      )}

      {mode === 'product' && selectedProduct && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Selected Product</p>
            <p className="font-bold">{selectedProduct.product_name}</p>
            <p className="text-xs text-slate-300">
              {selectedProduct.brand} {selectedProduct.price ? '· ' + selectedProduct.price : ''} {selectedProduct.rating ? '· ★ ' + selectedProduct.rating : ''}
            </p>
          </div>
          <button
            onClick={generateProductArticle}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:opacity-90 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating Article...' : 'Generate Article'}
          </button>
        </div>
      )}

      {mode === 'category' && selectedCategory && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Selected Category</p>
            <p className="font-bold">Best {selectedCategory.name} — Buying Guide</p>
            <p className="text-xs text-slate-300">AI will write a full "How to Choose Best {selectedCategory.name}" article with your top products embedded.</p>
          </div>
          <button
            onClick={generateCategoryArticle}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:opacity-90 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating Guide...' : 'Generate Buying Guide'}
          </button>
        </div>
      )}
    </div>
  );
}
