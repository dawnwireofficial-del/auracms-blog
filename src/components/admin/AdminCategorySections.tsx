import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Category } from '../../types';

const CATEGORY_SECTION_TYPES = [
  { value: 'hero_banner', label: 'Hero Banner (slideshow)' },
  { value: 'subcategory_grid', label: 'Subcategory Grid' },
  { value: 'product_carousel', label: 'Product Carousel' },
  { value: 'featured_products', label: 'Featured Products' },
  { value: 'best_sellers', label: 'Best Sellers' },
  { value: 'trending', label: 'Trending Products' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'deals', label: 'Deals' },
  { value: 'products_by_price', label: 'Products by Price' },
  { value: 'editors_picks', label: "Editor's Picks" },
  { value: 'featured_brands', label: 'Featured Brands' },
  { value: 'promotional_banner', label: 'Promotional Banner' },
  { value: 'buying_guides', label: 'Buying Guides' },
  { value: 'custom_text', label: 'Custom Text' },
];

const SECTION_WIDTHS = ['full', 'wide', 'narrow', 'half'];

export default function AdminCategorySections({ token, categories }: { token: string; categories: Category[] }) {
  const [selectedCat, setSelectedCat] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!selectedCat) return;
    const r = await fetch(`/api/admin/category-sections/${selectedCat}`, { headers: { Authorization: `Bearer ${token}` } });
    setSections((await r.json() || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder));
  };
  useEffect(() => { load(); }, [selectedCat]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const data: Record<string, any> = { categoryId: selectedCat };
    for (const [key, val] of fd.entries()) {
      if (key === 'isActive') data[key] = true;
      else if (key === 'sortOrder') data[key] = parseInt(val as string) || 0;
      else data[key] = val;
    }
    if (!data.isActive) data.isActive = false;
    if (edit) {
      await fetch(`/api/admin/category-sections/${edit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    } else {
      await fetch('/api/admin/category-sections', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    }
    setShowForm(false); setEdit(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    await fetch(`/api/admin/category-sections/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const sectionTypeLabels: Record<string, string> = {};
  CATEGORY_SECTION_TYPES.forEach(st => { sectionTypeLabels[st.value] = st.label; });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Category Section Builder</h3>
      </div>

      <select value={selectedCat} onChange={e => { setSelectedCat(e.target.value); setShowForm(false); setEdit(null); }} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0c5adb]">
        <option value="">Select a category...</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {selectedCat && (
        <>
          <div className="space-y-2">
            {sections.length === 0 && <p className="text-xs text-slate-400 italic">No sections defined yet for this category.</p>}
            {sections.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{sectionTypeLabels[s.sectionType] || s.sectionType}</p>
                  <p className="text-[10px] text-slate-400">Order {s.sortOrder} · {s.sectionWidth || 'full'}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{s.isActive ? 'Active' : 'Off'}</span>
                <button onClick={() => { setEdit(s); setShowForm(true); }} className="p-1 text-slate-400 hover:text-[#0c5adb]"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(s.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>

          <button onClick={() => { setEdit(null); setShowForm(true); }} className="flex items-center gap-1.5 text-xs font-semibold text-[#0c5adb] hover:underline"><Plus className="h-3.5 w-3.5" /> Add Section</button>

          {showForm && (
            <form onSubmit={save} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Section Type</label>
                  <select name="sectionType" defaultValue={edit?.sectionType} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0c5adb]">
                    <option value="">Select type...</option>
                    {CATEGORY_SECTION_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Width</label>
                  <select name="sectionWidth" defaultValue={edit?.sectionWidth || 'full'} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900">
                    {SECTION_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Title</label><input name="title" defaultValue={edit?.title} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Sort Order</label><input name="sortOrder" type="number" defaultValue={edit?.sortOrder || 0} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900" /></div>
              </div>
              <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Subtitle</label><input name="subtitle" defaultValue={edit?.subtitle} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">CTA Text</label><input name="ctaText" defaultValue={edit?.ctaText} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">CTA Link</label><input name="ctaLink" defaultValue={edit?.ctaLink} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Products Limit</label><input name="limit" type="number" defaultValue={edit?.limit || 8} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Price (for products_under_price)</label><input name="price" type="number" defaultValue={edit?.price || ''} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600"><input name="isActive" type="checkbox" defaultChecked={edit?.isActive ?? true} className="rounded border-slate-300 text-[#0c5adb]" /> Active</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg">{edit ? 'Update' : 'Add'} Section</button>
                <button type="button" onClick={() => { setShowForm(false); setEdit(null); }} className="text-xs text-slate-500 px-4 py-2">Cancel</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
