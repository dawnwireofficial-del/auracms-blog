import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit2, Trash2, Eye, X, Upload, MoveUp, MoveDown, Save, Check,
  Image as ImageIcon, Palette, Sparkles, LayoutPanelTop, FolderTree,
} from 'lucide-react';
import { Category } from '../types';
import { proxyImageUrl } from '../utils/safeRender';
import { AnimatedCategoryIcon } from './common/AnimatedCategoryIcon';

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const NO_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="300" height="150" fill="#eef2f7"/><text x="150" y="80" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">No image</text></svg>'
);

const ANIM_STYLES = [
  { value: '', label: 'Default (no per-category animation)' },
  { value: 'none', label: 'Static — no animation' },
  { value: 'pulse', label: 'Pulse (breathing)' },
  { value: 'float', label: 'Float (gentle bob)' },
  { value: 'soft', label: 'Soft (subtle scale)' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'spin', label: 'Spin (slow rotate)' },
];

const ICON_GALLERY = [
  'ai-software-tools', 'automotive', 'baby-products', 'beauty-personal-care',
  'body-scrubs-treatments', 'business', 'electronics', 'fitness', 'gaming',
  'home-kitchen', 'lifestyle', 'office-productivity', 'seo-marketing',
  'sports-outdoors', 'technology', 'toys-games',
];

interface UploadBtnProps {
  token: string;
  onUrl: (url: string) => void;
  label?: string;
}

function UploadBtn({ token, onUrl, label = 'Upload' }: UploadBtnProps) {
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ base64, fileName: file.name }),
      });
      const data = await r.json();
      if (data.url) onUrl(data.url);
      else if (data.image) onUrl(data.image);
    } catch (e) { console.error('Upload failed', e); }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleFile} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
        className="text-[10px] font-bold text-[#0c5adb] hover:text-blue-700 shrink-0 px-2.5 py-1.5 rounded-lg border border-[#0c5adb]/30 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all flex items-center gap-1 bg-white dark:bg-zinc-900">
        {uploading ? <span className="w-3 h-3 border-2 border-[#0c5adb] border-t-transparent rounded-full animate-spin" /> : <Upload className="h-3 w-3" />}
        {uploading ? 'Uploading…' : label}
      </button>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0c5adb]';

function toastMsg(msg: string, isError = false) {
  // Deferred import to keep bundle lean
  import('../lib/toastStore').then(({ toast }) => {
    if (isError) toast.error(msg); else toast.success(msg);
  }).catch(() => {});
}

/* ================================================================== */
/* Tab 1 — Banners (Homepage Hero + Category Banners)                  */
/* ================================================================== */

function HeroBannersTab({ token }: { token: string }) {
  const [slides, setSlides] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState<any>(null); // object while open
  const [preview, setPreview] = useState<any>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/homepage-hero', { headers: { Authorization: `Bearer ${token}` } });
    const d = r.ok ? await r.json() : [];
    setSlides((Array.isArray(d) ? d : []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
  }, [token]);
  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data: Record<string, any> = {};
    fd.forEach((v, k) => { if (k === 'isActive') data[k] = v !== 'false'; else data[k] = v; });
    data.sortOrder = parseInt(data.sortOrder as string) || 0;
    try {
      if (edit?.id) {
        const r = await fetch(`/api/admin/homepage-hero/${edit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error();
      } else {
        const r = await fetch('/api/admin/homepage-hero', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error();
      }
      toastMsg(edit ? 'Hero slide updated' : 'Hero slide created');
    } catch { toastMsg('Failed to save hero slide', true); }
    setForm(null); setEdit(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this hero slide?')) return;
    await fetch(`/api/admin/homepage-hero/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const toggleActive = async (s: any) => {
    await fetch(`/api/admin/homepage-hero/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isActive: !s.isActive }) });
    load();
  };

  const moveOrder = async (id: string, dir: number) => {
    const idx = slides.findIndex(s => s.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= slides.length) return;
    const copy = [...slides];
    [copy[idx], copy[ni]] = [copy[ni], copy[idx]];
    copy.forEach((s, i) => { s.sortOrder = i; });
    setSlides(copy);
    await Promise.all(copy.map(s => fetch(`/api/admin/homepage-hero/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sortOrder: s.sortOrder }) }).catch(() => {})));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Homepage Hero Banners</h4>
          <p className="text-[11px] text-slate-400">Slides that appear in the hero slider on the homepage.</p>
        </div>
        <button onClick={() => { setEdit(null); setForm({ isActive: true, sortOrder: slides.length }); }}
          className="bg-[#0c5adb] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#0a4db8] flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Hero Slide</button>
      </div>

      <div className="space-y-2">
        {slides.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveOrder(s.id, -1)} disabled={i === 0} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"><MoveUp className="h-3 w-3" /></button>
              <button onClick={() => moveOrder(s.id, 1)} disabled={i === slides.length - 1} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"><MoveDown className="h-3 w-3" /></button>
            </div>
            <div className="w-24 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-900 shrink-0">
              {s.desktopImage || s.desktop_image ? <img src={proxyImageUrl(s.desktopImage || s.desktop_image)} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-full h-full flex items-center justify-center text-slate-300 text-[10px]">No img</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">{s.heading || 'No heading'}</p>
              <p className="text-[10px] text-slate-400">Order {s.sortOrder} · {s.ctaLink ? `→ ${s.ctaLink}` : 'no CTA'}</p>
            </div>
            <button onClick={() => toggleActive(s)} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{s.isActive ? 'Active' : 'Off'}</button>
            <button onClick={() => setPreview(s)} className="p-1 text-slate-400 hover:text-[#0c5adb]"><Eye className="h-3.5 w-3.5" /></button>
            <button onClick={() => { setEdit(s); setForm(s); }} className="p-1 text-slate-400 hover:text-[#0c5adb]"><Edit2 className="h-3.5 w-3.5" /></button>
            <button onClick={() => remove(s.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {slides.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No hero slides yet. Add one to power the homepage hero.</p>}
      </div>

      {form && (
        <form onSubmit={save} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">{edit ? 'Edit' : 'New'} Hero Slide</h4>
            <button type="button" onClick={() => { setForm(null); setEdit(null); }} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Desktop Image">
              <div className="flex gap-2 items-start">
                <input name="desktopImage" defaultValue={form?.desktopImage || form?.desktop_image || ''} className={inputCls} placeholder="https://... or /uploads/..." required />
                <UploadBtn token={token} onUrl={(u) => { const inp = document.querySelector<HTMLInputElement>('[name="desktopImage"]'); if (inp) inp.value = u; }} />
              </div>
            </Field>
            <Field label="Mobile Image">
              <div className="flex gap-2 items-start">
                <input name="mobileImage" defaultValue={form?.mobileImage || form?.mobile_image || ''} className={inputCls} placeholder="Optional" />
                <UploadBtn token={token} onUrl={(u) => { const inp = document.querySelector<HTMLInputElement>('[name="mobileImage"]'); if (inp) inp.value = u; }} />
              </div>
            </Field>
            <Field label="Heading"><input name="heading" defaultValue={form?.heading || ''} className={inputCls} /></Field>
            <Field label="Badge / Eyebrow"><input name="badgeText" defaultValue={form?.badgeText || form?.badge_text || ''} className={inputCls} /></Field>
          </div>
          <Field label="Description"><textarea name="description" defaultValue={form?.description || ''} rows={2} className={inputCls} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="CTA Text"><input name="ctaText" defaultValue={form?.ctaText || form?.cta_text || ''} className={inputCls} /></Field>
            <Field label="CTA Link"><input name="ctaLink" defaultValue={form?.ctaLink || form?.cta_link || ''} className={inputCls} placeholder="/products?sort=rating" /></Field>
            <Field label="Sort Order"><input name="sortOrder" type="number" defaultValue={form?.sortOrder ?? slides.length} className={inputCls} /></Field>
            <Field label="Active">
              <select name="isActive" defaultValue={form?.isActive === false ? 'false' : 'true'} className={inputCls}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"><Save className="h-3.5 w-3.5" />{edit ? 'Update' : 'Create'} Slide</button>
            <button type="button" onClick={() => { setForm(null); setEdit(null); }} className="text-xs text-slate-500 px-4 py-2">Cancel</button>
          </div>
        </form>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreview(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-700">
              <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">Slide Preview</span>
              <button onClick={() => setPreview(null)}><X className="h-4 w-4 text-slate-400" /></button>
            </div>
            <div className="p-4">
              {preview.desktopImage || preview.desktop_image ? <img src={proxyImageUrl(preview.desktopImage || preview.desktop_image)} alt="" referrerPolicy="no-referrer" className="w-full rounded-lg border border-slate-200" /> : <div className="h-36 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">No desktop image</div>}
              <p className="text-xs font-bold text-slate-700 mt-3">{preview.heading}</p>
              <p className="text-[11px] text-slate-400">{preview.description}</p>
              {preview.ctaLink && <p className="text-[11px] font-bold text-[#0c5adb] mt-1">{preview.ctaText || 'CTA'} → {preview.ctaLink}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryBannersTab({ token, categories }: { token: string; categories: Category[] }) {
  const [selectedCat, setSelectedCat] = useState('');
  const [banners, setBanners] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState<any>(null);

  const load = useCallback(async () => {
    if (!selectedCat) { setBanners([]); return; }
    const r = await fetch(`/api/admin/category-banners/${selectedCat}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = r.ok ? await r.json() : [];
    setBanners((Array.isArray(d) ? d : []).sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
  }, [selectedCat, token]);
  useEffect(() => { load(); }, [load]);

  const topCats = categories.filter((c: any) => !c.parentId && c.status === 'active');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data: Record<string, any> = { categoryId: selectedCat };
    fd.forEach((v, k) => { if (k === 'isActive') data[k] = v !== 'false'; else data[k] = v; });
    data.sortOrder = parseInt(data.sortOrder as string) || 0;
    try {
      const url = edit?.id ? `/api/admin/category-banners/${edit.id}` : '/api/admin/category-banners';
      const r = await fetch(url, { method: edit?.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error();
      toastMsg(edit ? 'Banner updated' : 'Banner created');
    } catch { toastMsg('Failed to save banner', true); }
    setForm(null); setEdit(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await fetch(`/api/admin/category-banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const moveOrder = async (id: string, dir: number) => {
    const idx = banners.findIndex(b => b.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= banners.length) return;
    const copy = [...banners];
    [copy[idx], copy[ni]] = [copy[ni], copy[idx]];
    copy.forEach((b, i) => { b.sortOrder = i; });
    setBanners(copy);
    await Promise.all(copy.map(b => fetch(`/api/admin/category-banners/${b.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ sortOrder: b.sortOrder }) }).catch(() => {})));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Category / Promo Banners</h4>
          <p className="text-[11px] text-slate-400">Banner images + CTAs shown on each category landing page.</p>
        </div>
        <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">
          <option value="">Select category…</option>
          {topCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!selectedCat && <p className="text-xs text-slate-400 text-center py-8">Pick a category above to manage its banners.</p>}

      {selectedCat && (
        <>
          <div className="space-y-2">
            {banners.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveOrder(b.id, -1)} disabled={i === 0} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"><MoveUp className="h-3 w-3" /></button>
                  <button onClick={() => moveOrder(b.id, 1)} disabled={i === banners.length - 1} className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"><MoveDown className="h-3 w-3" /></button>
                </div>
                <div className="w-24 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-900 shrink-0">
                  {b.desktopImage ? <img src={proxyImageUrl(b.desktopImage)} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="h-5 w-5" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">{b.heading || 'No heading'}</p>
                  <p className="text-[10px] text-slate-400">Order {b.sortOrder}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{b.isActive ? 'Active' : 'Off'}</span>
                <button onClick={() => { setEdit(b); setForm(b); }} className="p-1 text-slate-400 hover:text-[#0c5adb]"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(b.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            {banners.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No banners for this category yet.</p>}
          </div>

          <button onClick={() => { setEdit(null); setForm({ isActive: true, sortOrder: banners.length }); }} className="flex items-center gap-1.5 text-xs font-semibold text-[#0c5adb] hover:underline"><Plus className="h-3.5 w-3.5" /> Add Banner</button>

          {form && (
            <form onSubmit={save} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">{edit ? 'Edit' : 'New'} Category Banner</h4>
                <button type="button" onClick={() => { setForm(null); setEdit(null); }} className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Desktop Image">
                  <div className="flex gap-2 items-start">
                    <input name="desktopImage" defaultValue={form?.desktopImage || ''} className={inputCls} placeholder="https://..." required />
                    <UploadBtn token={token} onUrl={(u) => { const inp = document.querySelector<HTMLInputElement>('[name="desktopImage"]'); if (inp) inp.value = u; }} />
                  </div>
                </Field>
                <Field label="Mobile Image">
                  <div className="flex gap-2 items-start">
                    <input name="mobileImage" defaultValue={form?.mobileImage || ''} className={inputCls} placeholder="Optional" />
                    <UploadBtn token={token} onUrl={(u) => { const inp = document.querySelector<HTMLInputElement>('[name="mobileImage"]'); if (inp) inp.value = u; }} />
                  </div>
                </Field>
                <Field label="Heading"><input name="heading" defaultValue={form?.heading || ''} className={inputCls} /></Field>
                <Field label="Sort Order"><input name="sortOrder" type="number" defaultValue={form?.sortOrder ?? banners.length} className={inputCls} /></Field>
              </div>
              <Field label="Description"><textarea name="description" defaultValue={form?.description || ''} rows={2} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="CTA Text"><input name="ctaText" defaultValue={form?.ctaText || ''} className={inputCls} /></Field>
                <Field label="CTA Link"><input name="ctaLink" defaultValue={form?.ctaLink || ''} className={inputCls} placeholder="/categories/..." /></Field>
                <Field label="Start Date"><input name="startDate" type="datetime-local" defaultValue={form?.startDate || ''} className={inputCls} /></Field>
                <Field label="End Date"><input name="endDate" type="datetime-local" defaultValue={form?.endDate || ''} className={inputCls} /></Field>
                <Field label="Active">
                  <select name="isActive" defaultValue={form?.isActive === false ? 'false' : 'true'} className={inputCls}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </Field>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5"><Save className="h-3.5 w-3.5" />{edit ? 'Update' : 'Create'} Banner</button>
                <button type="button" onClick={() => { setForm(null); setEdit(null); }} className="text-xs text-slate-500 px-4 py-2">Cancel</button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/* Tab 2 — Category Images & SVG Icons                                 */
/* ================================================================== */

function CategoryVisualsTab({ token, categories, onRefresh }: { token: string; categories: Category[]; onRefresh: () => void }) {
  const [selId, setSelId] = useState<string>('');
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selId && categories.length) setSelId(categories[0].id);
    if (selId) {
      const c = categories.find(x => x.id === selId);
      if (c) {
        setForm({
          name: c.name, slug: c.slug, description: c.description || '', status: c.status || 'active',
          image: c.image || '', icon: c.icon || '', desktopBanner: c.desktopBanner || '',
          mobileBanner: c.mobileBanner || '', animationStyle: c.animationStyle || '',
        });
      }
    }
  }, [selId, categories]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!selId || !form.name) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/categories/${selId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name, slug: form.slug, description: form.description, status: form.status,
          image: form.image || null, icon: form.icon || null, desktopBanner: form.desktopBanner || null,
          mobileBanner: form.mobileBanner || null, animationStyle: form.animationStyle || null,
        }),
      });
      if (r.ok) { toastMsg('Category visuals saved'); onRefresh(); }
      else { const d = await r.json().catch(() => ({})); toastMsg((d && d.error) || 'Save failed', true); }
    } catch { toastMsg('Network error saving category', true); }
    setSaving(false);
  };

  const active = categories.find(c => c.id === selId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
      {/* Category list */}
      <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 overflow-hidden h-fit">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-700/50 flex items-center gap-2">
          <FolderTree className="h-3.5 w-3.5 text-[#0c5adb]" />
          <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Categories</span>
        </div>
        <div className="max-h-[520px] overflow-y-auto p-2 space-y-1">
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelId(c.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${selId === c.id ? 'bg-blue-50 dark:bg-blue-950/40 ring-1 ring-[#0c5adb]/40' : 'hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
              <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                <AnimatedCategoryIcon slug={c.slug} icon={c.icon} image={c.image} animationStyle={c.animationStyle}
                  className="w-4 h-4 text-blue-500" imgClassName="w-8 h-8 object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-700 dark:text-zinc-200 truncate">{c.name}</span>
                <span className="block text-[10px] text-slate-400 truncate">{c.slug}</span>
              </span>
              <span className={`ml-auto shrink-0 text-[9px] px-1.5 py-0.5 rounded-full ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-4">
        {active && (
          <>
            <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-zinc-700">
                    <AnimatedCategoryIcon slug={active.slug} icon={form.icon} image={form.image}
                      animationStyle={form.animationStyle}
                      className="w-7 h-7 text-blue-500" imgClassName="w-14 h-14 object-contain" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">{form.name || active.name}</h4>
                    <p className="text-[10px] text-slate-400">Live icon preview — animation style shown live (respects reduced-motion)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Name"><input value={form.name || ''} onChange={e => set('name', e.target.value)} className={inputCls} /></Field>
                <Field label="Slug"><input value={form.slug || ''} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'))} className={inputCls} /></Field>
                <Field label="Status">
                  <select value={form.status || 'active'} onChange={e => set('status', e.target.value)} className={inputCls}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Description"><textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} className={inputCls} /></Field>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-[#0c5adb]" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">Category Images</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Tile / List Image (shown in category tiles & products)">
                  <div className="flex gap-2 items-start">
                    <input value={form.image || ''} onChange={e => set('image', e.target.value)} className={inputCls} placeholder="URL or /uploads/..." />
                    <UploadBtn token={token} onUrl={(u) => set('image', u)} />
                  </div>
                  {form.image && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 p-2">
                      <img src={proxyImageUrl(form.image) || NO_IMG} alt="preview" referrerPolicy="no-referrer" className="w-full h-28 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = NO_IMG; }} />
                    </div>
                  )}
                </Field>
                <Field label="Category Icon / Animated SVG (overrides tile image on icons)">
                  <div className="flex gap-2 items-start">
                    <input value={form.icon || ''} onChange={e => set('icon', e.target.value)} className={inputCls} placeholder="SVG path: /icons/categories/..." />
                    <UploadBtn token={token} onUrl={(u) => set('icon', u)} label="SVG" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Pick a preset below, or paste any SVG URL.</p>
                </Field>
                <Field label="Desktop Banner">
                  <div className="flex gap-2 items-start">
                    <input value={form.desktopBanner || ''} onChange={e => set('desktopBanner', e.target.value)} className={inputCls} placeholder="Wide banner for category page" />
                    <UploadBtn token={token} onUrl={(u) => set('desktopBanner', u)} />
                  </div>
                </Field>
                <Field label="Mobile Banner">
                  <div className="flex gap-2 items-start">
                    <input value={form.mobileBanner || ''} onChange={e => set('mobileBanner', e.target.value)} className={inputCls} placeholder="Taller banner for mobile" />
                    <UploadBtn token={token} onUrl={(u) => set('mobileBanner', u)} />
                  </div>
                </Field>
              </div>
            </div>

            {/* SVG icon gallery + animation */}
            <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0c5adb]" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">SVG Icon Gallery & Animation</h4>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {ICON_GALLERY.map(slugName => {
                  const path = `/icons/categories/${slugName}.svg`;
                  const isSel = form.icon === path;
                  return (
                    <button key={slugName} type="button" onClick={() => set('icon', path)}
                      className={`relative rounded-lg border p-2 bg-slate-50 dark:bg-zinc-900 flex flex-col items-center gap-1 transition-all ${isSel ? 'border-[#0c5adb] ring-2 ring-[#0c5adb]/30' : 'border-slate-200 dark:border-zinc-700 hover:border-[#0c5adb]/50'}`}>
                      {isSel && <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#0c5adb] text-white flex items-center justify-center"><Check className="w-2.5 h-2.5" /></span>}
                      <AnimatedCategoryIcon slug={slugName} icon={path} animationStyle={form.animationStyle}
                        className="w-5 h-5 text-blue-500" imgClassName="w-7 h-7 object-contain" />
                      <span className="text-[8px] text-slate-400 truncate w-full text-center leading-tight">{slugName}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Animation Style">
                  <select value={form.animationStyle || ''} onChange={e => set('animationStyle', e.target.value)} className={inputCls}>
                    {ANIM_STYLES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </Field>
                <Field label="Clear Icon / Use Generic">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => set('icon', '')} className="flex-1 text-[11px] font-bold text-slate-500 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800">Use default (generic icon)</button>
                    <button type="button" onClick={() => set('animationStyle', '')} className="flex-1 text-[11px] font-bold text-slate-500 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800">Reset animation</button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={save} disabled={saving}
                className="bg-[#0c5adb] hover:bg-[#0a4db8] text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50">
                {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Category Visuals
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* Tab 3 — Global Design & Animation Settings                          */
/* ================================================================== */

const DESIGN_DEFAULTS: Record<string, any> = {
  cursorEnabled: true,
  ambientCanvas: true,
  categoryIconAnimation: true,
  defaultCategoryAnimation: 'pulse',
  loaderStyle: 'default',
  heroMode: 'commerce',
};

function DesignSettingsTab({ token }: { token: string }) {
  const [form, setForm] = useState<Record<string, any>>(DESIGN_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/public/settings')
      .then(r => r.json())
      .then(s => {
        if (s && typeof s === 'object' && s.designSettings) {
          setForm({ ...DESIGN_DEFAULTS, ...(s.designSettings || {}) });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ designSettings: form }),
      });
      if (r.ok) { toastMsg('Design settings saved. Refresh the public site to apply.'); document.documentElement.dataset.catAnim = form.defaultCategoryAnimation || 'none'; }
      else toastMsg('Failed to save design settings', true);
    } catch { toastMsg('Network error saving design settings', true); }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-4 w-4 text-[#0c5adb]" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">Site-wide Animation & Motion</h4>
        </div>
        <p className="text-[11px] text-slate-400 mb-4">Global motion preferences. Per-category icons are configured in the “Category Images & SVG Icons” tab.</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-zinc-700 p-3">
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Animated SVG icons on categories</p>
              <p className="text-[10px] text-slate-400">Pulse/float/etc. on the category icon set (header & tiles)</p>
            </div>
            <label className="flex items-center gap-2">
              <select value={form.categoryIconAnimation ? 'on' : 'off'} onChange={e => set('categoryIconAnimation', e.target.value === 'on')} className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-slate-800">
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </label>
          </div>

          <Field label="Default category icon animation (when a category has no per-category style)">
            <select value={form.defaultCategoryAnimation || 'pulse'} onChange={e => set('defaultCategoryAnimation', e.target.value)} className={inputCls}>
              {[{ value: 'none', label: 'None' }, { value: 'pulse', label: 'Pulse' }, { value: 'float', label: 'Float' }, { value: 'soft', label: 'Soft' }, { value: 'bounce', label: 'Bounce' }, { value: 'spin', label: 'Spin' }].map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-zinc-700 p-3">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Custom cursor effects</p>
                <p className="text-[10px] text-slate-400">Gravity-flavoured mouse trail</p>
              </div>
              <button type="button" onClick={() => set('cursorEnabled', !form.cursorEnabled)}
                className={`w-10 h-5.5 h-6 rounded-full relative transition-colors ${form.cursorEnabled ? 'bg-[#0c5adb]' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.cursorEnabled ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-zinc-700 p-3">
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-zinc-200">Ambient background canvas</p>
                <p className="text-[10px] text-slate-400">Full-page subtle particle network</p>
              </div>
              <button type="button" onClick={() => set('ambientCanvas', !form.ambientCanvas)}
                className={`w-10 h-6 rounded-full relative transition-colors ${form.ambientCanvas ? 'bg-[#0c5adb]' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.ambientCanvas ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          <Field label="Page-loader animation">
            <select value={form.loaderStyle || 'default'} onChange={e => set('loaderStyle', e.target.value)} className={inputCls}>
              <option value="default">Default — animated ring</option>
              <option value="minimal">Minimal — thin bar</option>
              <option value="none">Off</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving || !loaded}
          className="bg-[#0c5adb] hover:bg-[#0a4db8] text-white text-xs font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50">
          {saving ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Design Settings
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Panel shell                                                         */
/* ================================================================== */

export default function CreativeAssetsPanel({ token, categories, onRefresh }: { token: string; categories: Category[]; onRefresh: () => void }) {
  const [tab, setTab] = useState<'banners' | 'category-visuals' | 'design'>('banners');
  const [sub, setSub] = useState<'hero' | 'category'>('hero');

  const tabs = [
    { key: 'banners' as const, label: 'Banners', icon: LayoutPanelTop },
    { key: 'category-visuals' as const, label: 'Category Images & SVG Icons', icon: FolderTree },
    { key: 'design' as const, label: 'Design & Animations', icon: Palette },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#0c5adb]" /> Design Studio
          </h3>
          <p className="text-[11px] text-slate-400">Manage banners, category images/icon animations, and site-wide motion.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key === 'banners') setSub('hero'); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${tab === t.key ? 'bg-[#0c5adb] text-white shadow-sm' : 'bg-white dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-[#0c5adb]/40'}`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'banners' && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5">
          <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 w-fit mb-4">
            <button onClick={() => setSub('hero')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-colors ${sub === 'hero' ? 'bg-white dark:bg-zinc-700 text-slate-800 shadow-sm' : 'text-slate-500'}`}>Homepage Hero</button>
            <button onClick={() => setSub('category')} className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-colors ${sub === 'category' ? 'bg-white dark:bg-zinc-700 text-slate-800 shadow-sm' : 'text-slate-500'}`}>Category Banners</button>
          </div>
          {sub === 'hero' ? <HeroBannersTab token={token} /> : <CategoryBannersTab token={token} categories={categories} />}
        </div>
      )}

      {tab === 'category-visuals' && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5">
          <CategoryVisualsTab token={token} categories={categories} onRefresh={onRefresh} />
        </div>
      )}

      {tab === 'design' && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5">
          <DesignSettingsTab token={token} />
        </div>
      )}
    </div>
  );
}