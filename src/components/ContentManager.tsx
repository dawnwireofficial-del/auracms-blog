import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Star } from 'lucide-react';

interface ContentField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'tags' | 'url' | 'stars' | 'image';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface ContentManagerProps {
  title: string;
  apiPath: string;
  token: string;
  fields: ContentField[];
  listRender?: (item: any, onEdit: (item: any) => void, onDelete: (id: string) => void) => React.ReactNode;
  transformPayload?: (form: Record<string, any>) => Record<string, any>;
  transformForm?: (item: any) => Record<string, any>;
  initialForm?: () => Record<string, any>;
}

export default function ContentManager({ title, apiPath, token, fields, listRender, transformPayload, transformForm, initialForm }: ContentManagerProps) {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(initialForm ? initialForm() : {});
  const [loading, setLoading] = useState(true);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(apiPath, { headers });
      if (res.ok) { const body = await res.json(); setItems(Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : []); }
    } catch (e) { console.error(e) }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleEdit(item: any) {
    setEditing(item);
    setIsCreating(false);
    if (transformForm) setForm(transformForm(item));
    else {
      const f: Record<string, any> = {};
      fields.forEach(fld => { f[fld.name] = (item as any)[fld.name] || ''; });
      setForm(f);
    }
  }

  function handleNew() {
    setEditing(null);
    setIsCreating(true);
    setForm(initialForm ? initialForm() : {});
  }

  function handleCancel() {
    setEditing(null);
    setIsCreating(false);
    setForm(initialForm ? initialForm() : {});
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = transformPayload ? transformPayload(form) : form;
    const url = editing ? `${apiPath}/${editing.id}` : apiPath;
    const method = editing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) {
        handleCancel();
        load();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save');
      }
    } catch { alert('Network error'); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item?')) return;
    await fetch(`${apiPath}/${id}`, { method: 'DELETE', headers });
    load();
  }

  function setField(name: string, value: any) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  return (
    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl br-card border border-slate-100 dark:border-zinc-700 shadow-sm" id={`admin-manager-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="p-4 border-b border-slate-100 dark:border-zinc-700 flex items-center justify-between">
        <h3 className="font-display font-bold text-slate-800 dark:text-zinc-100 text-sm">{title}</h3>
        <button onClick={handleNew} className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold px-4 py-2 rounded-xl br-btn transition-all flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Form */}
        {(isCreating || editing) && (
          <div className="lg:col-span-1 p-4 border-r border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/30">
            <form onSubmit={handleSave} className="space-y-3">
              <h4 className="text-xs font-bold text-slate-600 dark:text-zinc-300">{editing ? 'Edit' : 'Create'} {title}</h4>
              {fields.map(fld => (
                <div key={fld.name}>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase mb-1">{fld.label}</label>
                  {fld.type === 'textarea' ? (
                    <textarea
                      value={form[fld.name] || ''}
                      onChange={e => setField(fld.name, e.target.value)}
                      rows={3}
                      placeholder={fld.placeholder}
                      className="w-full rounded-lg border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800 dark:text-zinc-100 br-input"
                      required={fld.required}
                    />
                  ) : fld.type === 'select' ? (
                    <select
                      value={form[fld.name] || ''}
                      onChange={e => setField(fld.name, e.target.value)}
                      className="w-full rounded-lg border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800 dark:text-zinc-100 br-input"
                      required={fld.required}
                    >
                      <option value="">Select...</option>
                      {fld.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : fld.type === 'number' ? (
                    <input
                      type="number"
                      value={form[fld.name] || ''}
                      onChange={e => setField(fld.name, e.target.value)}
                      placeholder={fld.placeholder}
                      className="w-full rounded-lg border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800 dark:text-zinc-100 br-input"
                      required={fld.required}
                    />
                  ) : fld.type === 'stars' ? (
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setField(fld.name, n)} className={`p-1 rounded cursor-pointer transition-all ${(form[fld.name] || 0) >= n ? 'text-amber-400' : 'text-slate-300'}`}>
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  ) : fld.type === 'tags' ? (
                    <input
                      type="text"
                      value={Array.isArray(form[fld.name]) ? (form[fld.name] as string[]).join(', ') : (form[fld.name] || '')}
                      onChange={e => setField(fld.name, e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                      placeholder={fld.placeholder || 'comma, separated'}
                      className="w-full rounded-lg border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800 dark:text-zinc-100 br-input"
                    />
                  ) : (
                    <input
                      type={fld.type === 'url' ? 'url' : 'text'}
                      value={form[fld.name] || ''}
                      onChange={e => setField(fld.name, e.target.value)}
                      placeholder={fld.placeholder}
                      className="w-full rounded-lg border-slate-200 dark:border-zinc-700 p-2 text-xs focus:outline-none bg-white dark:bg-zinc-800 dark:text-zinc-100 br-input"
                      required={fld.required}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-semibold py-2 rounded-xl br-btn transition-all">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={handleCancel} className="px-3 py-2 bg-slate-100 text-slate-600 dark:text-zinc-300 text-xs rounded-xl br-btn hover:bg-slate-200 transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        <div className={`${isCreating || editing ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">No {title.toLowerCase()} found</div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto no-scrollbar">
              {items.map(item => listRender ? listRender(item, handleEdit, handleDelete) : (
                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{item.title || item.productName || item.name || item.keyword || item.question || item.id}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.status || 'draft'} · {new Date(item.created_at || item.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#246BFF] transition-all" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
