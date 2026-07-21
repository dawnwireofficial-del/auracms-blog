import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2, Search, Star, X, Save, RefreshCw } from 'lucide-react';

interface TestimonialItem {
  id: string;
  name: string;
  role?: string;
  company?: string;
  text: string;
  rating: number;
  avatar_url?: string;
  display_order: number;
  status: string;
  created_at: string;
}

export default function TestimonialManager({ token }: { token: string }) {
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [filtered, setFiltered] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<TestimonialItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/testimonials', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      setFiltered(list);
    } catch { setItems([]); setFiltered([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(items); return; }
    const q = search.toLowerCase();
    setFiltered(items.filter(t => t.name.toLowerCase().includes(q) || (t.text || '').toLowerCase().includes(q) || (t.company || '').toLowerCase().includes(q)));
  }, [search, items]);

  const openNew = () => {
    setEditing({ id: '', name: '', role: '', company: '', text: '', rating: 5, display_order: items.length, status: 'published', created_at: '' });
    setIsNew(true);
  };

  const openEdit = (t: TestimonialItem) => { setEditing({ ...t }); setIsNew(false); };

  const closeForm = () => { setEditing(null); setIsNew(false); setMsg(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.name.trim() || !editing.text.trim()) { setMsg('Name and review text are required.'); return; }
    setSaving(true);
    setMsg(null);
    try {
      if (isNew) {
        const res = await fetch('/api/admin/testimonials', { method: 'POST', headers, body: JSON.stringify(editing) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to create'); }
      } else {
        const res = await fetch(`/api/admin/testimonials/${editing.id}`, { method: 'PUT', headers, body: JSON.stringify(editing) });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update'); }
      }
      await fetchAll();
      closeForm();
    } catch (err: any) { setMsg(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { setItems(prev => prev.filter(t => t.id !== id)); setFiltered(prev => prev.filter(t => t.id !== id)); }
    } catch (e) { console.error(e) }
  };

  const renderStars = (r: number) => (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />)}
    </span>
  );

  const statusBadge = (s: string) => (
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${s === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{s}</span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white">Testimonial Manager</h2>
          <p className="text-xs text-gray-500">Manage client reviews shown on the Portfolio page.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search testimonials..." className="w-56 pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF]" />
          </div>
          <button onClick={fetchAll} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all" aria-label="Refresh"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 bg-[#246BFF] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> Add Testimonial
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Name</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Rating</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Review</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Company / Role</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Order</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-xs text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-xs text-gray-400">{search ? 'No testimonials match your search.' : 'No testimonials yet. Click "Add Testimonial" to create one.'}</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#246BFF] to-blue-400 flex items-center justify-center text-white font-bold text-[10px] shrink-0">{t.name.charAt(0)}</div>
                      <span className="font-semibold text-gray-800 text-xs">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{renderStars(t.rating)}</td>
                  <td className="px-4 py-3 max-w-[250px]"><p className="text-xs text-gray-500 line-clamp-2 italic">&ldquo;{t.text}&rdquo;</p></td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-500">{t.company || '-'}{t.role ? <span className="text-gray-400"> / {t.role}</span> : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{t.display_order}</td>
                  <td className="px-4 py-3">{statusBadge(t.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#246BFF] transition-all cursor-pointer" aria-label="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all cursor-pointer" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Modal */}
      {editing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-display font-bold text-slate-900 dark:text-white">{isNew ? 'Add Testimonial' : 'Edit Testimonial'}</h3>
              <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all cursor-pointer"><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {msg && <div className="bg-red-50 text-red-600 text-xs font-semibold px-4 py-2 rounded-lg">{msg}</div>}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Name *</label>
                <input type="text" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Client Partner" className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF]" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Role</label>
                  <input type="text" value={editing.role || ''} onChange={e => setEditing({ ...editing, role: e.target.value })} placeholder="e.g. CEO" className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Company</label>
                  <input type="text" value={editing.company || ''} onChange={e => setEditing({ ...editing, company: e.target.value })} placeholder="e.g. Acme Inc." className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF]" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Avatar URL</label>
                <input type="text" value={editing.avatar_url || ''} onChange={e => setEditing({ ...editing, avatar_url: e.target.value })} placeholder="https://example.com/avatar.jpg" className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Review Text *</label>
                <textarea value={editing.text} onChange={e => setEditing({ ...editing, text: e.target.value })} rows={3} placeholder="Client testimonial..." className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF] resize-none" required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Rating (1-5)</label>
                  <input type="number" min={1} max={5} step={1} value={editing.rating} onChange={e => setEditing({ ...editing, rating: parseInt(e.target.value) || 5 })} className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Order</label>
                  <input type="number" min={0} value={editing.display_order} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Status</label>
                  <select value={editing.status} onChange={e => setEditing({ ...editing, status: e.target.value })} className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#246BFF]">
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-[#246BFF] rounded-lg hover:bg-blue-600 transition-all cursor-pointer disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
