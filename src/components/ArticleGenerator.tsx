import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Search, Sparkles, Loader2, Upload, Image as ImageIcon, X, Save, Eye,
  Check, PencilLine, FolderOpen, Package, Copy, RefreshCw, AlertTriangle,
  ExternalLink, Trash2, ClipboardCopy, FileText,
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
  review_summary?: string;
  specs?: any;
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

type Mode = 'product' | 'category' | 'articles';
type ArticleStatus = 'draft' | 'ready' | 'published' | 'scheduled';
type ArticleType = 'review' | 'guide' | 'comparison' | 'best-list' | 'how-to' | 'benefits' | 'faq';

const ARTICLE_TYPES: { value: ArticleType; label: string; min: number; hint: string }[] = [
  { value: 'review', label: 'Product Review', min: 1, hint: 'Select 1+ product' },
  { value: 'guide', label: 'Product Guide', min: 1, hint: 'Select 1+ product' },
  { value: 'comparison', label: 'Product Comparison', min: 2, hint: 'Requires 2+ products' },
  { value: 'best-list', label: 'Best Products List', min: 3, hint: 'Requires 3+ products' },
  { value: 'how-to', label: 'How-To-Use Article', min: 1, hint: 'Select 1+ product' },
  { value: 'benefits', label: 'Benefits & Features', min: 1, hint: 'Select 1+ product' },
  { value: 'faq', label: 'Frequently Asked Questions', min: 1, hint: 'Select 1+ product' },
];

const STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Draft',
  ready: 'Ready for Review',
  published: 'Published',
  scheduled: 'Scheduled',
};

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

const copyText = async (text: string): Promise<void> => {
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
  else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
};

function extractSections(content: string): { heading: string; body: string }[] {
  const sections: { heading: string; body: string[] }[] = [];
  let current: { heading: string; body: string[] } | null = null;
  for (const line of (content || '').split('\n')) {
    if (/^##\s+/.test(line)) {
      if (current) sections.push(current);
      current = { heading: line.replace(/^##\s+/, '').trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) sections.push(current);
  return sections
    .filter((s) => s.heading)
    .map((s) => ({ heading: s.heading, body: s.body.join('\n').trim() }));
}

function makeImagePrompt(products: GeneratorProduct[], articleType: ArticleType, categoryName?: string): string {
  const primary = products[0];
  if (primary?.product_name) {
    const name = primary.product_name;
    const bestFor = primary.best_for ? ` intended for ${primary.best_for.toLowerCase()}` : '';
    return `Create a premium editorial product image featuring ${name}. Show the product${bestFor} in a clean lifestyle setting relevant to its intended use. Use professional lighting, realistic details, balanced composition, no text, no logos added, and a 16:9 aspect ratio.`;
  }
  if (categoryName) {
    return `Create a modern editorial-style featured image about "${categoryName}". Clean composition, professional lighting, realistic style, no text, 16:9 aspect ratio.`;
  }
  return `Create a premium editorial featured image for the article. Use professional lighting, balanced composition, no text, no logos, 16:9 aspect ratio.`;
}

function makeImageAlt(products: GeneratorProduct[], title: string, categoryName?: string): string {
  const names = products.map((p) => p.product_name).filter(Boolean).join(', ');
  const text = names || categoryName || title || 'Featured product';
  return `${names ? names + ' — ' : ''}${text}`.replace(/[#*`]/g, '').trim().substring(0, 200);
}

export default function ArticleGenerator({ token }: { token: string }) {
  const [mode, setMode] = useState<Mode>('product');
  const [products, setProducts] = useState<GeneratorProduct[]>([]);
  const [categories, setCategories] = useState<GeneratorCategory[]>([]);
  const [existingPosts, setExistingPosts] = useState<any[]>([]);
  const [usedProductIds, setUsedProductIds] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<GeneratorCategory | null>(null);
  const [articleType, setArticleType] = useState<ArticleType>('review');
  const [post, setPost] = useState<PostDraft | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Editor fields
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editImageAlt, setEditImageAlt] = useState('');
  const [editImagePrompt, setEditImagePrompt] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editStatus, setEditStatus] = useState<ArticleStatus>('draft');
  const [editSeoTitle, setEditSeoTitle] = useState('');
  const [editSeoDescription, setEditSeoDescription] = useState('');
  const [editSeoKeywords, setEditSeoKeywords] = useState('');
  const [editGeneratedType, setEditGeneratedType] = useState<ArticleType>('review');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [pr, cats, postsRes] = await Promise.all([
        fetch('/api/admin/seo/product-reviews?limit=500', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/public/categories'),
        fetch('/api/admin/posts?limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const prBody = await pr.json().catch(() => ({}));
      const catsBody = await cats.json().catch(() => ({}));
      const postsBody = await postsRes.json().catch(() => ({}));
      const items = Array.isArray(prBody.data) ? prBody.data : Array.isArray(prBody) ? prBody : [];
      const catsItems = Array.isArray(catsBody.data) ? catsBody.data : Array.isArray(catsBody) ? catsBody : [];
      const postItems = Array.isArray(postsBody.data) ? postsBody.data : Array.isArray(postsBody) ? postsBody : [];
      setProducts(items);
      setCategories(catsItems.filter((c: any) => c.status === 'active' || c.status === undefined));
      setExistingPosts(postItems.filter((p: any) => p.status && p.status !== 'deleted'));
      const used: Record<string, boolean> = {};
      postItems.forEach((p: any) => { if (p.productId) used[p.productId] = true; });
      setUsedProductIds(used);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  const selectedProducts = products.filter((p) => selectedIds[p.id]);
  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      (p.product_name || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.best_for || '').toLowerCase().includes(q)
    );
  });
  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const activeType = ARTICLE_TYPES.find((t) => t.value === articleType) || ARTICLE_TYPES[0];

  function toggleProduct(id: string) {
    if (usedProductIds[id]) {
      setError('This product already has an article. Edit it from the "Existing Articles" tab instead.');
      return;
    }
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
    setMsg(null);
  }

  function resetSelection() {
    setSelectedIds({});
    setSelectedCategory(null);
    setArticleType('review');
    setSearch('');
  }

  function openEditor() {
    setShowEditor(true);
    setShowPreview(false);
  }

  // Load an existing post into the editor (published posts included) so the admin
  // can edit content / upload a featured image anytime.
  function openExistingPost(existing: any) {
    setError(null);
    const p = existing || {};
    setPost({ id: p.id, slug: p.slug, title: p.title });
    setEditGeneratedType('review');
    setEditTitle(p.title || '');
    setEditSlug(p.slug || '');
    setEditExcerpt(p.excerpt || '');
    setEditContent(p.content || '');
    setEditImage(p.featuredImage || p.featured_image || '');
    setEditImageAlt(p.featuredImageAlt || p.featured_image_alt || '');
    setEditCategory(p.categoryId || p.category_id || '');
    setEditTags(Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''));
    setEditStatus((p.status as ArticleStatus) || 'draft');
    setEditSeoTitle(p.seoTitle || p.seo_title || '');
    setEditSeoDescription(p.seoDescription || p.seo_description || '');
    setEditSeoKeywords(p.seoKeywords || p.seo_keywords || '');
    setEditImagePrompt(makeImagePrompt([], 'review', selectedCategory?.name));
    setSelectedIds({});
    setShowEditor(true);
    setShowPreview(false);
  }

  // ---------- Generate: Product ----------
  async function generateProductArticle() {
    const ids = selectedProducts.map((p) => p.id);
    if (ids.length === 0) { setError('Select at least one product to generate an article.'); return; }
    if (ids.length < activeType.min) {
      setError(`"${activeType.label}" articles require at least ${activeType.min} product${activeType.min > 1 ? 's' : ''}. You selected ${ids.length}.`);
      return;
    }
    setGenerating(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo/product-reviews/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productIds: ids, articleType }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Article generation failed');
      const full: any = body.post || {};
      setPost({ id: full.id, slug: full.slug, title: full.title });
      setEditGeneratedType(articleType);
      setEditTitle(full.title || '');
      setEditSlug(full.slug || '');
      setEditExcerpt(full.excerpt || '');
      setEditContent(full.content || '');
      setEditImage(full.featured_image || selectedProducts[0]?.product_image || '');
      setEditImageAlt(body.imageAlt || makeImageAlt(selectedProducts, full.title || ''));
      setEditImagePrompt(body.imagePrompt || makeImagePrompt(selectedProducts, articleType));
      setEditCategory(full.category_id || selectedProducts[0]?.category_id || '');
      const t = body.seo?.tags || full.tags;
      setEditTags(Array.isArray(t) ? t.join(', ') : '');
      setEditStatus((full.status as ArticleStatus) || 'draft');
      setEditSeoTitle(body.seo?.seoTitle || full.seo_title || '');
      setEditSeoDescription(body.seo?.seoDescription || full.seo_description || '');
      setEditSeoKeywords((typeof body.seo?.seoKeywords === 'string' ? body.seo.seoKeywords : full.seo_keywords) || '');
      openEditor();
      setMsg('Article generated as a draft. Add a featured image, then publish.');
    } catch (e: any) {
      setError(e.message);
    }
    setGenerating(false);
  }

  // ---------- Generate: Category ----------
  async function generateCategoryArticle() {
    if (!selectedCategory) { setError('Select a category to generate a buying guide.'); return; }
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
      const full: any = body.post || {};
      setPost({ id: full.id, slug: full.slug, title: full.title });
      setEditGeneratedType('guide');
      setEditTitle(full.title || '');
      setEditSlug(full.slug || '');
      setEditExcerpt(full.excerpt || '');
      setEditContent(full.content || '');
      setEditImage(full.featured_image || '');
      setEditImageAlt(makeImageAlt([], full.title || '', selectedCategory.name));
      setEditImagePrompt(makeImagePrompt([], 'guide', selectedCategory.name));
      setEditCategory(full.category_id || selectedCategory.id);
      setEditTags(Array.isArray(full.tags) ? full.tags.join(', ') : '');
      setEditStatus((full.status as ArticleStatus) || 'draft');
      setEditSeoTitle(full.seo_title || '');
      setEditSeoDescription(full.seo_description || '');
      setEditSeoKeywords(typeof full.seo_keywords === 'string' ? full.seo_keywords : '');
      openEditor();
      setMsg(body.alreadyExists
        ? 'An article already exists for this category — the existing one was opened (no duplicate created).'
        : 'Buying guide generated as a draft. Add a featured image, then publish.');
    } catch (e: any) {
      setError(e.message);
    }
    setGenerating(false);
  }

  async function regeneratePrompt() {
    const ids = selectedProducts.map((p) => p.id);
    try {
      const localPrompt = makeImagePrompt(selectedProducts, editGeneratedType, selectedCategory?.name);
      const localAlt = makeImageAlt(selectedProducts, editTitle, selectedCategory?.name);
      if (ids.length > 0) {
        const res = await fetch('/api/admin/seo/article/image-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productIds: ids, articleType: editGeneratedType, title: editTitle }),
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          setEditImagePrompt(body.prompt || localPrompt);
          setEditImageAlt(body.alt || localAlt);
          setMsg('Image prompt regenerated.');
          return;
        }
      }
      setEditImagePrompt(localPrompt);
      setEditImageAlt(localAlt);
      setMsg('Image prompt regenerated.');
    } catch {
      setEditImagePrompt(makeImagePrompt(selectedProducts, editGeneratedType, selectedCategory?.name));
    }
  }

  async function savePost(targetStatus?: ArticleStatus) {
    if (!post?.id) { setError('No post to save'); return; }
    const effectiveStatus = targetStatus || editStatus;
    if (effectiveStatus === 'published' && !editImage.trim()) {
      setError('Upload a featured image before publishing. Drafts and Ready-for-Review can be saved without one.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: editTitle,
        slug: editSlug,
        excerpt: editExcerpt,
        content: editContent,
        featuredImage: editImage,
        featuredImageAlt: editImageAlt,
        categoryId: editCategory || null,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        status: effectiveStatus,
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
      setEditStatus(effectiveStatus);
      setMsg(effectiveStatus === 'published' ? 'Article published! It is now live.' : `Saved as ${STATUS_LABELS[effectiveStatus]}.`);
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  }

  async function copyArticle() {
    const text = `# ${editTitle}\n\n${editExcerpt}\n\n${editContent}`.trim();
    await copyText(text);
    setCopied('article');
    setTimeout(() => setCopied(null), 1500);
  }

  async function copySeoPack() {
    const text = [
      `Title: ${editTitle}`,
      `Slug: ${editSlug}`,
      `Excerpt: ${editExcerpt}`,
      ``,
      `Content:\n${editContent}`,
      ``,
      `SEO Title: ${editSeoTitle}`,
      `Meta Description: ${editSeoDescription}`,
      `SEO Keywords: ${editSeoKeywords}`,
      `Tags: ${editTags}`,
      ``,
      `Image Prompt:\n${editImagePrompt}`,
      `Image Alt Text: ${editImageAlt}`,
    ].join('\n');
    await copyText(text);
    setCopied('seo');
    setTimeout(() => setCopied(null), 1500);
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
          if (!editImageAlt.trim()) setEditImageAlt(makeImageAlt(selectedProducts, editTitle, selectedCategory?.name));
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

  const sections = extractSections(editContent);
  const structureSections = sections;

  const inputCls = 'w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/40';
  const labelCls = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5';
  const btnBase = 'inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl disabled:opacity-60';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500 dark:text-slate-400 text-sm gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading products & categories...
      </div>
    );
  }

  // ================== EDITOR VIEW ==================
  if (showEditor && post?.id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PencilLine className="w-5 h-5 text-blue-500" /> Edit Generated Article
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedProducts.length > 0
                ? `Products: ${selectedProducts.map((p) => p.product_name).join(', ')}`
                : selectedCategory ? `Category: ${selectedCategory.name}` : ''}
              {' · '}{ARTICLE_TYPES.find((t) => t.value === editGeneratedType)?.label || editGeneratedType}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEditor(false)} className={`${btnBase} text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700`}>Back</button>
            {post.slug && (
              <a href={`/post/${post.slug}`} target="_blank" rel="noreferrer" className={`${btnBase} text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/30`}>
                <Eye className="w-4 h-4" /> View
              </a>
            )}
            <button onClick={() => setShowPreview(true)} className={`${btnBase} text-slate-600 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700`}>
              <Eye className="w-4 h-4" /> Preview
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
            <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /><span>{error}</span></div>
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
                <label className={labelCls}>URL Slug</label>
                <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as ArticleStatus)} className={inputCls}>
                  {(Object.keys(STATUS_LABELS) as ArticleStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                {editStatus !== 'published' && !editImage.trim() && (
                  <p className="text-[10px] text-amber-500 mt-1">A featured image is required before publishing.</p>
                )}
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
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={20} className={inputCls + ' font-mono'} />
            </div>

            {structureSections.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700 pb-2 mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Generated Structure
                </h4>
                <ul className="space-y-2">
                  {structureSections.map((s, i) => (
                    <li key={i} className="text-sm">
                      <div className="font-bold text-slate-700 dark:text-slate-200">{s.heading}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 whitespace-pre-wrap line-clamp-3">
                        {s.body || '(empty section)'}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: image + meta */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200 border-b border-slate-200 dark:border-zinc-700 pb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Featured Image
              </h4>

              <div>
                <label className={labelCls}>Image Generation Prompt</label>
                <textarea value={editImagePrompt} onChange={(e) => setEditImagePrompt(e.target.value)} rows={5} className={inputCls + ' text-xs'} />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={async () => { await copyText(editImagePrompt); setCopied('prompt'); setTimeout(() => setCopied(null), 1500); }}
                    className={`${btnBase} flex-1 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20`}
                  >
                    {copied === 'prompt' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy Image Prompt
                  </button>
                  <button onClick={regeneratePrompt} className={`${btnBase} text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700`}>
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>
              </div>

              {editImage ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={proxyImageUrl(editImage)} alt={editImageAlt} className="w-full h-44 object-contain bg-white dark:bg-slate-950" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <button onClick={() => setEditImage('')} className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/70 text-white hover:bg-slate-950" title="Remove image"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="w-full h-44 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-2 hover:border-blue-500/40">
                  <Upload className="w-8 h-8" />
                  <span className="text-xs">Upload featured image</span>
                </button>
              )}

              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className={`${btnBase} flex-1 justify-center text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20`}>
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editImage ? <RefreshCw className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? 'Uploading...' : editImage ? 'Replace Image' : 'Upload Image'}
                </button>
                {selectedProducts[0]?.product_image && (
                  <button onClick={() => setEditImage(selectedProducts[0].product_image || '')} className={`${btnBase} flex-1 justify-center text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700`}>
                    <Package className="w-3.5 h-3.5" /> Use Product Image
                  </button>
                )}
                {editImage && (
                  <button onClick={() => setEditImage('')} className={`${btnBase} p-2 text-red-500 bg-red-500/10 hover:bg-red-500/20`} title="Remove image">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <label className={labelCls}>Alt Text</label>
                <input value={editImageAlt} onChange={(e) => setEditImageAlt(e.target.value)} className={inputCls} placeholder="Auto-generated from product + title" />
                <button onClick={async () => { setEditImageAlt(makeImageAlt(selectedProducts, editTitle, selectedCategory?.name)); }} className="mt-1.5 text-[10px] text-blue-500 hover:underline">Regenerate alt text</button>
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

        <div className="flex items-center justify-end gap-2 flex-wrap">
          <button onClick={copyArticle} className={`${btnBase} text-slate-600 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700`}>
            {copied === 'article' ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />} Copy Article
          </button>
          <button onClick={copySeoPack} className={`${btnBase} text-slate-600 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700`}>
            {copied === 'seo' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Full SEO Pack
          </button>
          <button onClick={() => setShowPreview(true)} className={`${btnBase} text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/30`}>
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={() => setShowEditor(false)} className={`${btnBase} text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700`}>Back to Selector</button>
          <button onClick={() => savePost('draft')} disabled={saving} className={`${btnBase} text-slate-700 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Draft
          </button>
          <button onClick={() => savePost('ready')} disabled={saving} className={`${btnBase} text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/40`}>
            <Check className="w-4 h-4" /> Ready for Review
          </button>
          <button onClick={() => savePost('published')} disabled={saving} className={`${btnBase} bg-blue-600 hover:bg-blue-700 text-white`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Publish Article
          </button>
        </div>

        {/* Preview modal */}
        {showPreview && (
          <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Preview</h3>
                <button onClick={() => setShowPreview(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6">
                <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">{editTitle}</h1>
                {editImage && (
                  <img src={proxyImageUrl(editImage)} alt={editImageAlt} className="w-full h-64 object-contain bg-white dark:bg-slate-950 my-4 rounded-xl border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                {editExcerpt && <p className="text-sm text-slate-500 dark:text-zinc-400 italic mb-4">{editExcerpt}</p>}
                <div className="markdown-body space-y-4">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-6 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-6 mb-2 border-b border-slate-200 dark:border-blue-500/20 pb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-100 mt-4 mb-1">{children}</h3>,
                      p: ({ children }) => <p className="leading-relaxed text-slate-800 dark:text-zinc-200">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-6 space-y-1 text-slate-500 dark:text-zinc-400 my-3">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 space-y-1 text-slate-500 dark:text-zinc-400 my-3">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 py-1 italic my-4 text-slate-800 dark:text-zinc-200 bg-blue-50 dark:bg-blue-500/10 rounded-xl">{children}</blockquote>
                      ),
                      strong: ({ children }) => <strong className="font-bold text-slate-800 dark:text-white">{children}</strong>,
                      code: ({ children }) => <code className="font-mono text-sm bg-zinc-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-blue-400 border border-blue-500/20">{children}</code>,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4"><table className="min-w-full text-sm border-collapse">{children}</table></div>
                      ),
                      th: ({ children }) => <th className="border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-left">{children}</th>,
                      td: ({ children }) => <td className="border border-slate-300 dark:border-slate-700 px-3 py-2">{children}</td>,
                      hr: () => <hr className="my-6 border-slate-200 dark:border-blue-500/20" />,
                    }}
                  >
                    {editContent}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================== GENERATOR VIEW ==================
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" /> Article Generator
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select products (or a category), choose an article type, generate a draft, then add a featured image manually before publishing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
            {(['product', 'category', 'articles'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); resetSelection(); }}
                className={`px-4 py-2 text-xs font-bold capitalize transition-all ${mode === m ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {m === 'product' ? 'Product Articles' : m === 'category' ? 'Category Buying Guides' : 'Existing Articles'}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800" title="Reload">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {mode === 'product' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex-1">
            <label className={labelCls}>Article Type</label>
            <select value={articleType} onChange={(e) => { setArticleType(e.target.value as ArticleType); setMsg(null); }} className={inputCls}>
              {ARTICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label} — {t.min > 1 ? `min ${t.min} products` : 'min 1 product'}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">Selected Products ({selectedProducts.length})</div>
            <div className={`rounded-xl border px-3 py-1.5 text-sm ${selectedProducts.length >= activeType.min ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/40 text-amber-600 dark:text-amber-400'}`}>
              {activeType.hint} · {selectedProducts.length} selected
            </div>
          </div>
          <div className="sm:self-end">
            <button
              onClick={generateProductArticle}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:opacity-90 disabled:opacity-50 w-full sm:w-auto justify-center"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? 'Generating Article...' : 'Generate Article'}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div className="p-3 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl text-sm font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" /><span>{error}</span></div>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={mode === 'product' ? 'Search products by name, brand, or category...' : mode === 'category' ? 'Search categories...' : 'Search articles by title or slug...'}
          className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-900 dark:text-slate-100"
        />
      </div>

      {mode === 'articles' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              All Articles ({existingPosts.length})
            </p>
            <p className="text-xs text-slate-400">Edit any article — published or draft — to update content or upload a featured image.</p>
          </div>
          {existingPosts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm text-slate-400">No posts yet. Generate one first.</div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 font-bold">Title</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Category</th>
                    <th className="px-4 py-3 font-bold">Image</th>
                    <th className="px-4 py-3 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {existingPosts
                    .filter((p: any) => {
                      const q = search.toLowerCase();
                      return !q || (p.title || '').toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q);
                    })
                    .map((p: any) => (
                      <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{p.title || '(untitled)'}</div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">/{p.slug}</div>
                          {p.productId && <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Linked to product</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${p.status === 'published' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : p.status === 'draft' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-500/10 text-slate-500'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {p.categoryId ? (categories.find((c: any) => c.id === p.categoryId)?.name || '—') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {(p.featuredImage || p.featured_image) ? (
                            <img src={proxyImageUrl(p.featuredImage || p.featured_image)} alt="" className="w-12 h-8 object-cover rounded-md border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <span className="text-[10px] text-slate-400">No image</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => openExistingPost(p)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                              <PencilLine className="w-3 h-3" /> Edit
                            </button>
                            {p.slug && (
                              <a href={`/post/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:underline">
                                <ExternalLink className="w-3 h-3" /> View
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {existingPosts.filter((p: any) => (p.title || '').toLowerCase().includes(search.toLowerCase()) || (p.slug || '').toLowerCase().includes(search.toLowerCase())).length === 0 && search && (
                <div className="text-center py-12 text-sm text-slate-400">No articles match "{search}".</div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === 'articles' ? null : mode === 'product' ? (
        <>
          {selectedProducts.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-blue-900/30 to-slate-900 border border-blue-500/30 text-white space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Selected Products ({selectedProducts.length})</p>
                <button onClick={() => { setSelectedIds({}); }} className="text-xs text-slate-300 hover:text-white">Clear all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 bg-white/10 rounded-full pl-2.5 pr-1.5 py-1 text-xs">
                    {p.product_name}
                    <button onClick={() => toggleProduct(p.id)} className="p-0.5 hover:bg-white/20 rounded-full"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.slice(0, 48).map((p) => {
              const selected = !!selectedIds[p.id];
              const used = !!usedProductIds[p.id];
              return (
                <div
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`group bg-white dark:bg-slate-900 rounded-2xl border p-4 transition-all ${used ? 'opacity-60 cursor-not-allowed border-slate-200 dark:border-slate-800' : 'hover:shadow-lg cursor-pointer ' + (selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-200 dark:border-slate-800')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {p.product_image ? (
                        <img src={proxyImageUrl(p.product_image)} alt="" className="w-14 h-14 rounded-lg object-contain bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><Package className="w-5 h-5" /></div>
                      )}
                      <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center ${selected ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-400'}`}>
                        {selected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">{p.product_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.brand} {p.price ? '· ' + p.price : ''}
                      </div>
                    </div>
                  </div>
                  {(p.rating || p.editor_score || p.best_for) && (
                    <div className="flex items-center gap-2 mt-2 text-[11px] font-bold flex-wrap">
                      {p.rating ? <span className="text-amber-500">★ {p.rating}</span> : null}
                      {p.editor_score ? <span className="text-blue-600 dark:text-blue-400">Score: {p.editor_score}/10</span> : null}
                      {p.best_for ? <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full truncate">{p.best_for}</span> : null}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    {used ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400"><FileText className="w-3 h-3" /> Has article</span>
                    ) : (
                      <span className={`text-[11px] font-bold ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{selected ? 'Selected' : 'Click to select'}</span>
                    )}
                    {p.slug && (
                      <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:underline">
                        <ExternalLink className="w-3 h-3" /> View
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-16 text-sm text-slate-400">No products match your search.</div>
            )}
          </div>
        </>
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
                Select
              </button>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="col-span-full text-center py-16 text-sm text-slate-400">No categories match your search.</div>
          )}
        </div>
      )}

      {mode === 'category' && selectedCategory && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-blue-900/30 to-slate-900 border border-blue-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">Selected Category</p>
            <p className="font-bold">Best {selectedCategory.name} — Buying Guide</p>
            <p className="text-xs text-slate-300">Generates a draft "How to Choose Best {selectedCategory.name}" article. Add a featured image manually after generating.</p>
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