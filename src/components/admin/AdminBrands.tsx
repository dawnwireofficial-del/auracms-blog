import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Upload } from 'lucide-react';

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

interface Brand { id: string; name: string; slug: string; logo?: string; description?: string; website?: string; featured: boolean; status: string; }

export default function AdminBrands({ token }: { token: string }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [edit, setEdit] = useState<Brand | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const r = await fetch('/api/admin/brands', { headers: { Authorization: `Bearer ${token}` } });
    const data = r.ok ? await r.json() : [];
    setBrands(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    const url = edit ? `/api/admin/brands/${edit.id}` : '/api/admin/brands';
    const method = edit ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) });
    setShowForm(false); setEdit(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    await fetch(`/api/admin/brands/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const filtered = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">Brands</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands..." className="w-40 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0c5adb]" />
          </div>
          <button onClick={() => { setEdit(null); setShowForm(true); }} className="bg-[#0c5adb] text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#0a4db8] flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Brand</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={save} className="p-4 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Name</label><input name="name" defaultValue={edit?.name} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0c5adb]" /></div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Slug</label><input name="slug" defaultValue={edit?.slug} required className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0c5adb]" /></div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1">Logo URL</label>
              <div className="flex gap-2 items-start">
                <input name="logo" defaultValue={edit?.logo} className="flex-1 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
                <UploadBtn token={token} onUrl={(url) => { const inp = document.querySelector<HTMLInputElement>('[name="logo"]'); if (inp) inp.value = url; }} />
              </div>
            </div>
            <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Website</label><input name="website" defaultValue={edit?.website} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
          </div>
          <div><label className="text-[10px] font-bold text-slate-500 block mb-1">Description</label><textarea name="description" defaultValue={edit?.description} rows={2} className="w-full text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" /></div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" name="featured" defaultChecked={edit?.featured} className="rounded border-slate-300 text-[#0c5adb]" /> Featured</label>
            <select name="status" defaultValue={edit?.status || 'active'} className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-[#0c5adb] text-white text-xs font-bold px-4 py-2 rounded-lg">{edit ? 'Update' : 'Create'} Brand</button>
            <button type="button" onClick={() => { setShowForm(false); setEdit(null); }} className="text-xs text-slate-500 px-4 py-2">Cancel</button>
          </div>
        </form>
      )}

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-zinc-700 text-left">
            <th className="py-2 font-semibold text-slate-500">Name</th>
            <th className="py-2 font-semibold text-slate-500">Slug</th>
            <th className="py-2 font-semibold text-slate-500">Status</th>
            <th className="py-2 font-semibold text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(b => (
            <tr key={b.id} className="border-b border-slate-100 dark:border-zinc-800">
              <td className="py-2 font-medium text-slate-700 dark:text-zinc-200">{b.name}</td>
              <td className="py-2 text-slate-500">{b.slug}</td>
              <td className="py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{b.status}</span></td>
              <td className="py-2">
                <button onClick={() => { setEdit(b); setShowForm(true); }} className="p-1 text-slate-400 hover:text-[#0c5adb]"><Edit2 className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(b.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
