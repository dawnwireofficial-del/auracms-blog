import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, X, LayoutGrid, MousePointerClick, Image as ImageIcon } from 'lucide-react';
import { BANNER_PLACEMENTS, BANNER_PLACEMENT_MAP } from '../../lib/bannerPlacements';
import { proxyImageUrl } from '../../utils/safeRender';
import BannerEditForm from './BannerEditForm';
import type { Category } from '../../types';

/**
 * Complete Banner Manager — one admin panel to see every homepage banner placement
 * (hero main, 2×2 tiles, campaign promos) plus per-category banners, with the
 * recommended image size shown for each slot. Editing any placement opens the same
 * form used by the frontend inline editor.
 */
export default function AdminBannerManager({ token, categories }: { token: string; categories: Category[] }) {
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [editPlacement, setEditPlacement] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'homepage' | 'category'>('homepage');
  const [selectedCat, setSelectedCat] = useState('');
  const [catBanners, setCatBanners] = useState<any[]>([]);
  const [catEdit, setCatEdit] = useState<any>(null);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const loadHero = async () => {
    const r = await fetch('/api/admin/homepage-hero', { headers: { Authorization: `Bearer ${token}` } });
    const data = r.ok ? await r.json() : [];
    setHeroSlides(Array.isArray(data) ? data : []);
  };
  useEffect(() => { loadHero(); }, []);

  const loadCat = async () => {
    if (!selectedCat) return;
    const r = await fetch(`/api/admin/category-banners/${selectedCat}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = r.ok ? await r.json() : [];
    setCatBanners(Array.isArray(data) ? data : []);
  };
  useEffect(() => { loadCat(); }, [selectedCat]);

  const catSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data: any = { categoryId: selectedCat };
    for (const [key, val] of fd.entries()) {
      if (key === 'isActive') data[key] = true;
      else data[key] = val;
    }
    if (catEdit) await fetch(`/api/admin/category-banners/${catEdit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    else await fetch('/api/admin/category-banners', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    setCatFormOpen(false); setCatEdit(null); loadCat();
  };

  const catRemove = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await fetch(`/api/admin/category-banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadCat();
  };

  const topCats = categories.filter((c: any) => !c.parentId && c.status === 'active');

  const heroByPlacement = (key: string) => heroSlides.find(s => (s.placement || 'hero_main') === key) || null;

  const activeIn = (s: any) => s && s.isActive &&
    (!s.start_date || new Date(s.start_date).getTime() <= Date.now()) &&
    (!s.end_date || new Date(s.end_date).getTime() >= Date.now());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Banner Manager</h3>
        <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button onClick={() => setViewTab('homepage')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${viewTab === 'homepage' ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500'}`}>Homepage Banners</button>
          <button onClick={() => setViewTab('category')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${viewTab === 'category' ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500'}`}>Category Banners</button>
        </div>
      </div>

      {/* ============ HOMEPAGE BANNERS (all placements) ============ */}
      {viewTab === 'homepage' && (
        <>
          <div className="p-3.5 bg-[#F4F8FF] dark:bg-zinc-800/60 rounded-xl border border-[#246BFF]/15 flex items-start gap-2.5">
            <MousePointerClick className="h-4 w-4 text-[#246BFF] shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
              Each homepage slot reads its banner by placement. On the live site, hover any banner while logged in as admin and click <b>Edit Banner</b> to change just that slot. Recommended sizes are shown per slot below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BANNER_PLACEMENTS.map(p => {
              const slide = heroByPlacement(p.key);
              const isLive = activeIn(slide);
              return (
                <div key={p.key} className={`p-3.5 bg-white dark:bg-zinc-800/50 rounded-xl border transition-colors ${slide ? 'border-[#246BFF]/30' : 'border-dashed border-slate-300 dark:border-zinc-700'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-slate-800 dark:text-zinc-100">{p.label}</span>
                        <code className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{p.key}</code>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.description}</p>
                      <p className="text-[10px] font-bold text-[#246BFF] mt-1">Recommended: {p.recommended}</p>
                    </div>
                    <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full ${slide ? (isLive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500') : 'bg-slate-100 text-slate-400'}`}>
                      {slide ? (isLive ? 'Live' : 'Paused') : 'Empty'}
                    </span>
                  </div>

                  <div className={`mt-2.5 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 ${p.aspect} flex items-center justify-center relative`}>
                    {slide?.desktopImage ? (
                      <img src={proxyImageUrl(slide.desktopImage)} alt="" referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><ImageIcon className="h-3.5 w-3.5" /> No banner set</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] text-slate-500 truncate">{slide?.heading || slide?.title || 'Auto-generated fallback design'}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditPlacement(p.key)} className="p-1.5 text-slate-400 hover:text-[#0c5adb] flex items-center gap-1 text-[10px] font-bold">
                        {slide ? <><Edit2 className="h-3 w-3" /> Edit</> : <><Plus className="h-3 w-3" /> Add</>}
                      </button>
                      {slide && (
                        <button onClick={async () => { if (confirm('Delete this banner?')) { await fetch(`/api/admin/homepage-hero/${slide.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); loadHero(); } }} className="p-1.5 text-slate-400 hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {editPlacement && (
            <BannerEditForm
              placement={editPlacement as any}
              banner={heroByPlacement(editPlacement)}
              token={token}
              onClose={() => { setEditPlacement(null); loadHero(); }}
            />
          )}
        </>
      )}

      {/* ============ CATEGORY BANNERS ============ */}
      {viewTab === 'category' && (
        <>
          <div className="flex items-center gap-2">
            <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0c5adb]">
              <option value="">Select category...</option>
              {topCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {selectedCat && <button onClick={() => { setCatEdit(null); setCatFormOpen(true); }} className="bg-[#0c5adb] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#0a4db8] flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Banner</button>}
          </div>

          {!selectedCat && <p className="text-xs text-slate-400 text-center py-8">Select a category to manage its banners</p>}

          {catFormOpen && (
            <form onSubmit={catSave} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Desktop Image URL</label><input name="desktopImage" defaultValue={catEdit?.desktopImage} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Mobile Image URL</label><input name="mobileImage" defaultValue={catEdit?.mobileImage} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Heading</label><input name="heading" defaultValue={catEdit?.heading} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Sort Order</label><input name="sortOrder" type="number" defaultValue={catEdit?.sortOrder || 0} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
              </div>
              <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Description</label><textarea name="description" defaultValue={catEdit?.description} rows={2} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">CTA Text</label><input name="ctaText" defaultValue={catEdit?.ctaText} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">CTA Link</label><input name="ctaLink" defaultValue={catEdit?.ctaLink} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600"><input name="isActive" type="checkbox" defaultChecked={catEdit?.isActive ?? true} className="rounded border-slate-300 text-[#0c5adb]" /> Active</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg">{catEdit ? 'Update' : 'Create'} Banner</button>
                <button type="button" onClick={() => { setCatFormOpen(false); setCatEdit(null); }} className="text-xs text-slate-500 px-4 py-2">Cancel</button>
              </div>
            </form>
          )}

          {selectedCat && (
            <div className="space-y-3">
              {catBanners.map(b => (
                <div key={b.id} className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50">
                  <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-900 shrink-0">
                    {b.desktopImage ? <img src={proxyImageUrl(b.desktopImage)} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="h-6 w-6" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">{b.heading || 'No heading'}</p>
                    <p className="text-[10px] text-slate-400">Order: {b.sortOrder} | {b.isActive ? <span className="text-green-500">Active</span> : <span className="text-slate-400">Inactive</span>}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPreview(b)} className="p-1.5 text-slate-400 hover:text-[#0c5adb]" title="Preview"><Eye className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { setCatEdit(b); setCatFormOpen(true); }} className="p-1.5 text-slate-400 hover:text-[#0c5adb]"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => catRemove(b.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              {catBanners.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No banners for this category yet.</p>}
            </div>
          )}
        </>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreview(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-700">
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">Banner Preview</span>
              <button onClick={() => setPreview(null)}><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold text-slate-500 mb-2">Desktop:</p>
              {preview.desktopImage ? <img src={proxyImageUrl(preview.desktopImage)} alt="" referrerPolicy="no-referrer" className="w-full rounded-lg border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">No desktop image</div>}
              <p className="text-[10px] font-bold text-slate-500 mt-3 mb-2">Mobile:</p>
              {preview.mobileImage ? <img src={proxyImageUrl(preview.mobileImage)} alt="" referrerPolicy="no-referrer" className="w-48 rounded-lg border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="h-32 w-48 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">No mobile image</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
