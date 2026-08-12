import React, { useState, useRef } from 'react';
import { Edit2, Trash2, Upload, ImageIcon, X } from 'lucide-react';
import { Category } from '../../types';
import { proxyImageUrl } from '../../utils/safeRender';

interface AdminCategoriesProps {
  token: string;
  categories: Category[];
  onRefresh: () => void;
}

const makeSlug = (text: string) => {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

function CategoryImageUpload({ token, onUrl }: { token: string; onUrl: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise(resolve => { reader.onload = resolve; });
      const base64 = (reader.result as string).split(',')[1];
      const r = await fetch('/api/admin/upload-image', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64, fileName: file.name }),
      });
      const data = await r.json();
      if (data.url) onUrl(data.url);
      else { const { toast } = await import('../../lib/toastStore'); toast.error(data.error || 'Upload failed'); }
    } catch (err) {
      const { toast } = await import('../../lib/toastStore');
      toast.error('Upload failed. Try again.');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/png,image/webp,image/jpeg,image/svg+xml" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 text-[11px] font-bold text-[#0c5adb] hover:text-blue-700 px-3 py-2 rounded-lg border border-[#0c5adb]/30 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all">
        {uploading ? <span className="w-3 h-3 border-2 border-[#0c5adb] border-t-transparent rounded-full animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? 'Uploading…' : 'Upload Category Image'}
      </button>
    </>
  );
}

export default function AdminCategories({ token, categories, onRefresh }: AdminCategoriesProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [catImage, setCatImage] = useState('');

  const parentMap = new Map(categories.map(c => [c.id, c]));

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) return;

    const payload: Record<string, any> = { name: catName, slug: catSlug, description: catDesc, status: 'active' };
    if (catParentId) payload.parentId = catParentId;
    if (catImage) payload.image = catImage;
    const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsCreatingCategory(false);
        setEditingCategory(null);
        setCatName('');
        setCatSlug('');
        setCatDesc('');
        setCatParentId('');
        setCatImage('');
        onRefresh();
      } else {
        const d = await res.json();
        const { toast } = await import('../../lib/toastStore');
        toast.error(d.error || 'Failed to save category.');
      }
    } catch (e) {
      const { toast } = await import('../../lib/toastStore');
      toast.error('Network failure while saving category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Associated posts will be marked uncategorized.')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onRefresh();
    } catch (e) {
      const { toast } = await import('../../lib/toastStore');
      toast.error('Network failure while deleting category.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="admin-workspace-categories">
      <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm space-y-4 h-fit">
        <h3 className="font-display font-bold text-slate-800 dark:text-zinc-100 text-sm">
          {editingCategory ? 'Update Category' : 'Create Category'}
        </h3>
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Category Name</label>
            <input
              type="text"
              value={catName}
              onChange={(e) => {
                setCatName(e.target.value);
                if (!editingCategory) setCatSlug(makeSlug(e.target.value));
              }}
              placeholder="Technology"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Category Slug</label>
            <input
              type="text"
              value={catSlug}
              onChange={(e) => setCatSlug(makeSlug(e.target.value))}
              placeholder="technology"
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Summarize topic scope..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Parent Category</label>
            <select
              value={catParentId}
              onChange={(e) => setCatParentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input bg-white dark:bg-zinc-900/50"
            >
              <option value="">None (Top-level)</option>
              {categories
                .filter((c) => editingCategory ? c.id !== editingCategory.id : true)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.parentId ? ` (${parentMap.get(c.parentId)?.name || ''})` : ''}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Category Image</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 overflow-hidden flex items-center justify-center shrink-0">
                {catImage ? (
                  <img src={proxyImageUrl(catImage) || catImage} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
                ) : (
                  <ImageIcon className="h-5 w-5 text-slate-300" />
                )}
              </div>
              <div className="space-y-1.5">
                <CategoryImageUpload token={token} onUrl={setCatImage} />
                {catImage && (
                  <button type="button" onClick={() => setCatImage('')} className="text-[11px] font-semibold text-red-500 hover:text-red-700 flex items-center gap-1">
                    <X className="h-3 w-3" /> Remove image
                  </button>
                )}
                <p className="text-[10px] text-slate-400 leading-relaxed">Upload a dedicated category PNG (recommended 800×800, square, min 500×500). This is used on the homepage circle and category headers — it replaces any auto-picked product image.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {editingCategory && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCatName('');
                  setCatSlug('');
                  setCatDesc('');
                  setCatParentId('');
                  setCatImage('');
                }}
                className="flex-1 bg-slate-100 text-slate-600 dark:text-zinc-300 text-xs font-semibold py-2.5 rounded-xl br-btn transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold py-2.5 rounded-xl br-btn transition-all shadow-sm"
            >
              {editingCategory ? 'Update' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase border-b border-slate-100 dark:border-zinc-700/50">
              <th className="p-4 pl-6">Name</th>
              <th className="p-4">Image</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Parent</th>
              <th className="p-4">Description</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50 dark:bg-zinc-900/50">
                <td className="p-4 pl-6 font-bold text-slate-800 dark:text-zinc-100">{cat.name}</td>
                <td className="p-4">
                  {cat.image ? (
                    <img src={proxyImageUrl(cat.image) || cat.image} alt={cat.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-contain bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-700/50 p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <span className="text-[10px] text-slate-300 dark:text-zinc-600">none</span>
                  )}
                </td>
                <td className="p-4 font-mono text-slate-500 dark:text-zinc-400">{cat.slug}</td>
                <td className="p-4 text-slate-500 dark:text-zinc-400 text-xs">{cat.parentId ? (parentMap.get(cat.parentId)?.name || '—') : '—'}</td>
                <td className="p-4 text-slate-500 dark:text-zinc-400 line-clamp-1 max-w-xs">{cat.description || '-'}</td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCatName(cat.name);
                        setCatSlug(cat.slug);
                        setCatDesc(cat.description || '');
                        setCatParentId(cat.parentId || '');
                        setCatImage(cat.image || '');
                      }}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600 dark:text-zinc-300 hover:text-slate-900 br-btn"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-500 hover:text-red-700 br-btn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
