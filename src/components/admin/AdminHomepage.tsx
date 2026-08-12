import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MoveUp, MoveDown, Eye, X, GripVertical, Upload, LayoutGrid, MousePointerClick } from 'lucide-react';
import { proxyImageUrl } from '../../utils/safeRender';
import { BANNER_PLACEMENTS, BANNER_PLACEMENT_MAP } from '../../lib/bannerPlacements';

function UploadBtn({ token, onUrl }: { token: string; onUrl: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
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
    } catch (e) { console.error('Upload failed', e); }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="text-[10px] font-bold text-[#0c5adb] hover:text-blue-700 shrink-0 px-2 py-1 rounded border border-[#0c5adb]/30 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all flex items-center gap-1">
        {uploading ? <span className="w-3 h-3 border-2 border-[#0c5adb] border-t-transparent rounded-full animate-spin" /> : <Upload className="h-3 w-3" />}
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
    </>
  );
}

const SECTION_TYPES = [
  { value: 'hero_banner', label: 'Hero Banner' },
  { value: 'shop_by_category', label: 'Shop by Category' },
  { value: 'todays_deals', label: "Today's Deals" },
  { value: 'best_sellers', label: 'Best Sellers' },
  { value: 'trending_products', label: 'Trending Products' },
  { value: 'featured_products', label: 'Featured Products' },
  { value: 'editors_picks', label: "Editor's Picks" },
  { value: 'top_rated_products', label: 'Top Rated' },
  { value: 'products_under_price', label: 'Products Under Price' },
  { value: 'featured_brands', label: 'Featured Brands' },
  { value: 'product_comparisons', label: 'Product Comparisons' },
  { value: 'buying_guides', label: 'Buying Guides' },
  { value: 'latest_reviews', label: 'Latest Reviews' },
  { value: 'latest_blog', label: 'Latest Blog' },
  { value: 'newsletter_signup', label: 'Newsletter Signup' },
  { value: 'custom_text', label: 'Custom Text' },
];

interface HomepageSection {
  id: string;
  sectionType: string;
  title?: string;
  subtitle?: string;
  sortOrder: number;
  isActive: boolean;
  settings: Record<string, any>;
}

export default function AdminHomepage({ token }: { token: string }) {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [editSection, setEditSection] = useState<HomepageSection | null>(null);
  const [editSlide, setEditSlide] = useState<any>(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showSlideForm, setShowSlideForm] = useState(false);
  const [tab, setTab] = useState<'sections' | 'hero'>('sections');
  const [placementFilter, setPlacementFilter] = useState<string>('all');
  const [showPlacementRef, setShowPlacementRef] = useState(false);

  const load = async () => {
    const [sRes, hRes] = await Promise.all([
      fetch('/api/admin/homepage-sections', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/homepage-hero', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const s = sRes.ok ? await sRes.json() : [];
    const h = hRes.ok ? await hRes.json() : [];
    setSections(Array.isArray(s) ? [...s].sort((a: any, b: any) => a.sortOrder - b.sortOrder) : []);
    setHeroSlides(Array.isArray(h) ? [...h].sort((a: any, b: any) => a.sortOrder - b.sortOrder) : []);
  };
  useEffect(() => { load(); }, []);

  const saveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    if (editSection) {
      await fetch(`/api/admin/homepage-sections/${editSection.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...data, sortOrder: parseInt(data.sortOrder as string) || 0 }) });
    } else {
      await fetch('/api/admin/homepage-sections', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...data, sortOrder: sections.length }) });
    }
    setShowSectionForm(false); setEditSection(null); load();
  };

  const removeSection = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    await fetch(`/api/admin/homepage-sections/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const saveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    if (editSlide) {
      await fetch(`/api/admin/homepage-hero/${editSlide.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...data, sortOrder: parseInt(data.sortOrder as string) || 0 }) });
    } else {
      await fetch('/api/admin/homepage-hero', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...data, sortOrder: heroSlides.length }) });
    }
    setShowSlideForm(false); setEditSlide(null); load();
  };

  const removeSlide = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    await fetch(`/api/admin/homepage-hero/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const moveItem = async (items: any[], setItems: any, id: string, dir: number) => {
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx === -1) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    copy.forEach((item: any, idx2: number) => item.sortOrder = idx2);
    setItems(copy);
    for (let si = 0; si < copy.length; si++) {
      try {
        const r = await fetch(`/api/admin/homepage-sections/${copy[si].id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sortOrder: si }) });
        if (!r.ok) throw new Error(await r.text());
      } catch {
        const { toast } = await import('../../lib/toastStore');
        toast.error('Failed to save reorder. Try again.');
      }
    }
  };

  const sectionLabels: Record<string, string> = {};
  SECTION_TYPES.forEach(st => { sectionLabels[st.value] = st.label; });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Homepage Builder</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5">
            <button onClick={() => setTab('sections')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${tab === 'sections' ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500'}`}>Sections</button>
            <button onClick={() => setTab('hero')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${tab === 'hero' ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm' : 'text-slate-500'}`}>Hero Slides</button>
          </div>
        </div>
      </div>

      {tab === 'sections' && (
        <>
          <div className="space-y-2">
            {sections.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveItem(sections, setSections, s.id, -1)} disabled={i === 0} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"><MoveUp className="h-3 w-3" /></button>
                  <button onClick={() => moveItem(sections, setSections, s.id, 1)} disabled={i === sections.length - 1} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"><MoveDown className="h-3 w-3" /></button>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{s.title || sectionLabels[s.sectionType] || s.sectionType}</p>
                  <p className="text-[10px] text-slate-400">{sectionLabels[s.sectionType] || s.sectionType} · Order {s.sortOrder}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{s.isActive ? 'Active' : 'Off'}</span>
                <button onClick={() => { setEditSection(s); setShowSectionForm(true); }} className="p-1 text-slate-400 hover:text-[#0c5adb]"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => removeSection(s.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <button onClick={() => { setEditSection(null); setShowSectionForm(true); }} className="flex items-center gap-1.5 text-xs font-semibold text-[#0c5adb] hover:underline"><Plus className="h-3.5 w-3.5" /> Add Section</button>

          {showSectionForm && (
            <form onSubmit={saveSection} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Section Type</label>
                  <select name="sectionType" defaultValue={editSection?.sectionType} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0c5adb]">
                    <option value="">Select type...</option>
                    {SECTION_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                  </select>
                </div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Title</label><input name="title" defaultValue={editSection?.title} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900" /></div>
              </div>
              <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Subtitle</label><input name="subtitle" defaultValue={editSection?.subtitle} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600"><input name="isActive" type="checkbox" defaultChecked={editSection?.isActive ?? true} className="rounded border-slate-300 text-[#0c5adb]" /> Active</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg">{editSection ? 'Update' : 'Add'} Section</button>
                <button type="button" onClick={() => { setShowSectionForm(false); setEditSection(null); }} className="text-xs text-slate-500 px-4 py-2">Cancel</button>
              </div>
            </form>
          )}
        </>
      )}

      {tab === 'hero' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setShowPlacementRef(v => !v)} className="flex items-center gap-1.5 text-[11px] font-bold text-[#0c5adb] hover:text-blue-700 px-3 py-1.5 rounded-lg border border-[#0c5adb]/25 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors">
                <LayoutGrid className="h-3.5 w-3.5" /> {showPlacementRef ? 'Hide Placement Map' : 'Banner Placement Map'}
              </button>
              <select value={placementFilter} onChange={e => setPlacementFilter(e.target.value)} className="text-[11px] font-semibold border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200">
                <option value="all">All placements</option>
                {BANNER_PLACEMENTS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {showPlacementRef && (
            <div className="p-4 bg-[#F4F8FF] dark:bg-zinc-800/60 rounded-xl border border-[#246BFF]/15 space-y-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#246BFF]">How placements map to the homepage</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {BANNER_PLACEMENTS.map(p => (
                  <div key={p.key} className="bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-slate-800 dark:text-zinc-100">{p.label}</span>
                      <code className="text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{p.key}</code>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{p.description}</p>
                    <p className="text-[10px] font-semibold text-[#0c5adb] mt-2">Recommended: {p.recommended}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500"><MousePointerClick className="inline h-3 w-3 mr-1" />Each homepage slot reads its banner by placement key. A banner is used only when active and its image exists — otherwise the slot falls back to an auto-generated design.</p>
            </div>
          )}

          <div className="space-y-2">
            {heroSlides
              .filter(s => placementFilter === 'all' || s.placement === placementFilter)
              .map((slide, i) => {
                const key = (slide.placement || 'hero_main') as keyof typeof BANNER_PLACEMENT_MAP;
                const meta = BANNER_PLACEMENT_MAP[key];
                const now = Date.now();
                const active = slide.isActive &&
                  (!slide.start_date || new Date(slide.start_date).getTime() <= now) &&
                  (!slide.end_date || new Date(slide.end_date).getTime() >= now);
                return (
                  <div key={slide.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50">
                    <div className="w-20 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-900 shrink-0">
                      {slide.desktopImage ? <img src={proxyImageUrl(slide.desktopImage)} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">No img</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">{slide.heading || slide.title || 'No heading'}</p>
                      <p className="text-[10px] text-slate-400 truncate">{meta?.label || slide.placement || 'hero_main'} · Order {slide.sortOrder}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'Active' : 'Off'}</span>
                    <button onClick={() => { setEditSlide(slide); setShowSlideForm(true); }} className="p-1 text-slate-400 hover:text-[#0c5adb]"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeSlide(slide.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
          </div>
          <button onClick={() => { setEditSlide(null); setShowSlideForm(true); }} className="flex items-center gap-1.5 text-xs font-semibold text-[#0c5adb] hover:underline"><Plus className="h-3.5 w-3.5" /> Add Banner</button>

          {showSlideForm && (
            <form onSubmit={saveSlide} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Placement</label>
                  <select name="placement" defaultValue={editSlide?.placement || 'hero_main'} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">
                    {BANNER_PLACEMENTS.map(p => <option key={p.key} value={p.key}>{p.label} · {p.recommended}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">{BANNER_PLACEMENT_MAP[((editSlide?.placement || 'hero_main') as keyof typeof BANNER_PLACEMENT_MAP)]?.description}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Desktop Image URL</label>
                  <div className="flex gap-2 items-start">
                    <input name="desktopImage" defaultValue={editSlide?.desktopImage} required className="flex-1 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
                    <UploadBtn token={token} onUrl={(url) => { const inp = document.querySelector<HTMLInputElement>('[name="desktopImage"]'); if (inp) inp.value = url; }} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Mobile Image URL</label>
                  <div className="flex gap-2 items-start">
                    <input name="mobileImage" defaultValue={editSlide?.mobileImage} className="flex-1 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
                    <UploadBtn token={token} onUrl={(url) => { const inp = document.querySelector<HTMLInputElement>('[name="mobileImage"]'); if (inp) inp.value = url; }} />
                  </div>
                </div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Headline</label><input name="heading" defaultValue={editSlide?.heading} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Badge Text (e.g. “Limited Time”)</label><input name="badgeText" defaultValue={editSlide?.badgeText} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Sort Order</label><input name="sortOrder" type="number" defaultValue={editSlide?.sortOrder || 0} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
              </div>
              <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Subtitle</label><input name="subtitle" defaultValue={editSlide?.subtitle} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
              <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Description</label><textarea name="description" defaultValue={editSlide?.description} rows={2} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">CTA Text</label><input name="ctaText" defaultValue={editSlide?.ctaText} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">CTA Link</label><input name="ctaLink" defaultValue={editSlide?.ctaLink} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Start (optional)</label><input name="startDate" type="datetime-local" defaultValue={editSlide?.start_date ? new Date(editSlide.start_date).toISOString().slice(0, 16) : ''} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 block mb-1">End (optional)</label><input name="endDate" type="datetime-local" defaultValue={editSlide?.end_date ? new Date(editSlide.end_date).toISOString().slice(0, 16) : ''} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600"><input name="isActive" type="checkbox" defaultChecked={editSlide?.isActive ?? true} className="rounded border-slate-300 text-[#0c5adb]" /> Active</label>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg">{editSlide ? 'Update' : 'Add'} Banner</button>
                <button type="button" onClick={() => { setShowSlideForm(false); setEditSlide(null); }} className="text-xs text-slate-500 px-4 py-2">Cancel</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}
