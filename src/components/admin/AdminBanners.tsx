import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, X, Image as ImageIcon } from 'lucide-react';
import { Category } from '../../types';
import { proxyImageUrl } from '../../utils/safeRender';

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
        {uploading ? <span className="w-3 h-3 border-2 border-[#0c5adb] border-t-transparent rounded-full animate-spin" /> : '+'}
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
    </>
  );
}

export default function AdminBanners({ token, categories }: { token: string; categories: Category[] }) {
  const [selectedCat, setSelectedCat] = useState('');
  const [banners, setBanners] = useState<any[]>([]);
  const [edit, setEdit] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const desktopRef = React.useRef<HTMLInputElement>(null);
  const mobileRef = React.useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!selectedCat) return;
    const r = await fetch(`/api/admin/category-banners/${selectedCat}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = r.ok ? await r.json() : [];
    setBanners(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, [selectedCat]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data: any = { categoryId: selectedCat };
    const fd = new FormData(form);
    for (const [key, val] of fd.entries()) {
      if (key === 'isActive') data[key] = true;
      else data[key] = val;
    }
    if (edit) await fetch(`/api/admin/category-banners/${edit.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    else await fetch('/api/admin/category-banners', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    setShowForm(false); setEdit(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await fetch(`/api/admin/category-banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const topCats = categories.filter((c: any) => !c.parentId && c.status === 'active');

  const previewBanner = (b: any) => {
    setPreview(b);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Category Banners</h3>
        <div className="flex items-center gap-2">
          <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0c5adb]">
            <option value="">Select category...</option>
            {topCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedCat && <button onClick={() => { setEdit(null); setShowForm(true); }} className="bg-[#0c5adb] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#0a4db8] flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Banner</button>}
        </div>
      </div>

      {!selectedCat && <p className="text-xs text-slate-400 text-center py-8">Select a category to manage its banners</p>}

      {showForm && (
        <form onSubmit={save} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Desktop Image URL</label>
              <div className="flex gap-2 items-start">
                <input ref={desktopRef} name="desktopImage" defaultValue={edit?.desktopImage} required className="flex-1 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none" />
                <UploadBtn token={token} onUrl={(url) => { if (desktopRef.current) desktopRef.current.value = url; }} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Mobile Image URL</label>
              <div className="flex gap-2 items-start">
                <input ref={mobileRef} name="mobileImage" defaultValue={edit?.mobileImage} className="flex-1 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none" />
                <UploadBtn token={token} onUrl={(url) => { if (mobileRef.current) mobileRef.current.value = url; }} />
              </div>
            </div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Heading</label><input name="heading" defaultValue={edit?.heading} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Sort Order</label><input name="sortOrder" type="number" defaultValue={edit?.sortOrder || 0} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
          </div>
          <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Description</label><textarea name="description" defaultValue={edit?.description} rows={2} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">CTA Text</label><input name="ctaText" defaultValue={edit?.ctaText} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">CTA Link</label><input name="ctaLink" defaultValue={edit?.ctaLink} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Start Date</label><input name="startDate" type="datetime-local" defaultValue={edit?.startDate || ''} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">End Date</label><input name="endDate" type="datetime-local" defaultValue={edit?.endDate || ''} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2" /></div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-600"><input name="isActive" type="checkbox" defaultChecked={edit?.isActive ?? true} className="rounded border-slate-300 text-[#0c5adb]" /> Active</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg">{edit ? 'Update' : 'Create'} Banner</button>
            <button type="button" onClick={() => { setShowForm(false); setEdit(null); }} className="text-xs text-slate-500 px-4 py-2">Cancel</button>
          </div>
        </form>
      )}

      {/* Banner list */}
      {selectedCat && (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50">
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-zinc-900 shrink-0">
                {b.desktopImage ? <img src={proxyImageUrl(b.desktopImage)} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="h-6 w-6" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">{b.heading || 'No heading'}</p>
                <p className="text-[10px] text-slate-400">Order: {b.sortOrder} | {b.isActive ? <span className="text-green-500">Active</span> : <span className="text-slate-400">Inactive</span>}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => previewBanner(b)} className="p-1.5 text-slate-400 hover:text-[#0c5adb]" title="Preview"><Eye className="h-3.5 w-3.5" /></button>
                <button onClick={() => { setEdit(b); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-[#0c5adb]"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(b.id)} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {banners.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No banners for this category yet.</p>}
        </div>
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
