import React, { useEffect, useMemo, useState } from 'react';

interface ShoppingEvent {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  emoji?: string | null;
  hero_image?: string | null;
  theme_color?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  featured?: boolean;
  sort_order?: number;
  keywords?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}

interface ProductLite {
  id: string;
  product_name: string;
  brand?: string;
  price?: number;
  editor_score?: number;
  status?: string;
}

const emptyDraft = (): Partial<ShoppingEvent> => ({
  name: '', slug: '', tagline: '', description: '', emoji: '🎉', theme_color: '#246BFF',
  start_date: '', end_date: '', is_active: false, featured: false, sort_order: 100, keywords: '',
});

export default function EventsManager({ token }: { token: string }) {
  const [events, setEvents] = useState<ShoppingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<ShoppingEvent> | null>(null);
  const [isNew, setIsNew] = useState(false);
  // Product curation modal state
  const [curating, setCurating] = useState<ShoppingEvent | null>(null);
  const [products, setProducts] = useState<ProductLite[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [productQuery, setProductQuery] = useState('');
  const [savingProducts, setSavingProducts] = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/events', { headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const patchEvent = async (id: string, patch: Partial<ShoppingEvent>) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(patch) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => e.id === id ? updated : e));
    } catch (e: any) { setError(e.message); }
    setSavingId(null);
  };

  const saveDraft = async () => {
    if (!draft?.name?.trim()) return;
    setSavingId(draft.id || 'new');
    try {
      const payload = { ...draft, slug: draft.slug || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') };
      const res = await fetch(draft.id ? `/api/admin/events/${draft.id}` : '/api/admin/events', {
        method: draft.id ? 'PUT' : 'POST', headers: authHeaders, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      setDraft(null); setIsNew(false);
      await load();
    } catch (e: any) { setError(e.message); }
    setSavingId(null);
  };

  const removeEvent = async (ev: ShoppingEvent) => {
    if (!window.confirm(`Delete "${ev.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    } catch (e: any) { setError(e.message); }
  };

  // ===== Product curation =====
  const openCurator = async (ev: ShoppingEvent) => {
    setCurating(ev); setSelectedIds(new Set()); setProducts([]);
    try {
      const [prodRes, idsRes] = await Promise.all([
        fetch('/api/admin/seo/product-reviews?limit=200', { headers: authHeaders }),
        fetch(`/api/admin/events/${ev.id}/products`, { headers: authHeaders }),
      ]);
      if (idsRes.ok) {
        const d = await idsRes.json();
        setSelectedIds(new Set(d.productIds || []));
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        const rows = Array.isArray(d) ? d : d.data || [];
        setProducts(rows.map((r: any) => ({
          id: r.id, product_name: r.productName || r.product_name, brand: r.brand,
          price: Number(r.price || 0), editor_score: r.editorScore != null ? Number(r.editorScore) : (r.editor_score != null ? Number(r.editor_score) : undefined),
          status: r.status,
        })).filter((p: ProductLite) => !!p.product_name));
      }
    } catch {}
  };

  const saveCuration = async () => {
    if (!curating) return;
    setSavingProducts(true);
    try {
      const res = await fetch(`/api/admin/events/${curating.id}/products`, {
        method: 'PUT', headers: authHeaders, body: JSON.stringify({ productIds: [...selectedIds] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCurating(null);
    } catch (e: any) { setError(e.message); }
    setSavingProducts(false);
  };

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 60);
    return products.filter((p) => p.product_name.toLowerCase().includes(q)).slice(0, 60);
  }, [products, productQuery]);

  const inputCls = "w-full bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-700";
  const labelCls = "text-[11px] font-bold text-slate-500 block mb-1";

  if (loading) return <div className="py-10 text-center text-sm font-bold text-slate-400 animate-pulse">Loading events…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">🗓️ Shopping Events</h2>
          <p className="text-xs text-slate-500">Enable an event and it instantly appears on <a href="/events" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">/events</a> with its own landing page.</p>
        </div>
        <button onClick={() => { setDraft(emptyDraft()); setIsNew(true); }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm transition-colors">
          + New Event
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-bold text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(events.length ? events : []).map((ev) => (
          <div key={ev.id} className={`rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 transition-all ${ev.is_active ? 'border-emerald-300 dark:border-emerald-700 shadow-sm' : 'border-slate-200/80 dark:border-slate-800 opacity-90'}`}>
            <div className="h-16 flex items-center px-4 gap-3" style={{ background: `linear-gradient(120deg, ${ev.theme_color || '#0A1F44'} 0%, #0A1F44 130%)` }}>
              <span className="text-2xl drop-shadow">{ev.emoji || '🎉'}</span>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white truncate">{ev.name}</h3>
                <p className="text-[10px] text-white/70 truncate">/{ev.slug}</p>
              </div>
              {ev.featured && <span className="ml-auto text-xs" title="Featured">⭐</span>}
            </div>
            <div className="p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>{[ev.start_date, ev.end_date].filter(Boolean).join(' → ') || 'No dates'}</span>
                <span className="flex items-center gap-1">
                  {ev.is_active ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active</> : 'Inactive'}
                </span>
              </div>
              <button
                onClick={() => patchEvent(ev.id, { is_active: !ev.is_active })}
                disabled={savingId === ev.id}
                className={`w-full py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors ${ev.is_active ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-700'} disabled:opacity-50`}
              >
                {savingId === ev.id ? '…' : ev.is_active ? 'Disable' : 'Enable Event'}
              </button>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button onClick={() => { setDraft({ ...ev }); setIsNew(false); }} className="py-1.5 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors">Edit</button>
                <button onClick={() => openCurator(ev)} className="py-1.5 rounded-lg bg-violet-50 dark:bg-slate-800 text-violet-600 dark:text-violet-400 text-[11px] font-bold hover:bg-violet-100 dark:hover:bg-slate-700 transition-colors">Products</button>
                <a href={`/events/${ev.slug}`} target="_blank" rel="noreferrer" className="py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">View</a>
              </div>
              <button onClick={() => removeEvent(ev)} className="w-full text-[10px] font-bold text-red-500 hover:text-red-600 pt-0.5">Delete event</button>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Edit / Create modal ===== */}
      {draft && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setDraft(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 max-h-[88vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 dark:text-white text-sm">{isNew ? 'New Event' : `Edit — ${draft.name}`}</h3>
              <button onClick={() => setDraft(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className={labelCls}>Name *</label>
                <input className={inputCls} value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div><label className={labelCls}>Slug (auto)</label>
                <input className={inputCls} value={draft.slug || ''} placeholder="auto-from-name" onChange={(e) => setDraft({ ...draft, slug: e.target.value })} /></div>
              <div><label className={labelCls}>Tagline</label>
                <input className={inputCls} value={draft.tagline || ''} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} /></div>
              <div><label className={labelCls}>Emoji</label>
                <input className={inputCls} value={draft.emoji || ''} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} /></div>
              <div><label className={labelCls}>Start date</label>
                <input type="date" className={inputCls} value={draft.start_date || ''} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></div>
              <div><label className={labelCls}>End date</label>
                <input type="date" className={inputCls} value={draft.end_date || ''} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} /></div>
              <div><label className={labelCls}>Theme color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={draft.theme_color || '#246BFF'} onChange={(e) => setDraft({ ...draft, theme_color: e.target.value })}
                    className="w-10 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent" />
                  <input className={inputCls} value={draft.theme_color || ''} onChange={(e) => setDraft({ ...draft, theme_color: e.target.value })} />
                </div></div>
              <div><label className={labelCls}>Sort order (lower = first)</label>
                <input type="number" className={inputCls} value={String(draft.sort_order ?? 100)} onChange={(e) => setDraft({ ...draft, sort_order: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div><label className={labelCls}>Description</label>
              <textarea rows={2} className={inputCls} value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
            <div><label className={labelCls}>Auto-match keywords (category slugs or words, comma-separated)</label>
              <input className={inputCls} placeholder="electronics,gaming,toys-games" value={draft.keywords || ''} onChange={(e) => setDraft({ ...draft, keywords: e.target.value })} />
              <p className="text-[10px] text-slate-400 mt-1">Used to auto-fill products when no manual curation is saved.</p></div>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={!!draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                Active (visible on site)
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={!!draft.featured} onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} className="rounded text-blue-600 focus:ring-blue-500" />
                Featured ⭐
              </label>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button onClick={() => setDraft(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={saveDraft} disabled={savingId !== null || !draft.name?.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black disabled:opacity-50">
                {savingId ? 'Saving…' : isNew ? 'Create event' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Product curator modal ===== */}
      {curating && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setCurating(null)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-700 p-5 max-h-[88vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 pb-2">
              <h3 className="font-black text-slate-900 dark:text-white text-sm">🛍️ Curate products — {curating.name}</h3>
              <button onClick={() => setCurating(null)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
            </div>
            <input className={inputCls} placeholder="Search products…" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
            <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <label key={p.id} className="flex items-start gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                    checked={selectedIds.has(p.id)}
                    onChange={(e) => {
                      const next = new Set(selectedIds);
                      if (e.target.checked) next.add(p.id); else next.delete(p.id);
                      setSelectedIds(next);
                    }}
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{p.product_name}</span>
                    <span className="block text-[10px] text-slate-400">{p.brand || '—'} · ${Number(p.price || 0).toFixed(2)} · score {p.editor_score ?? '—'}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">{selectedIds.size} selected</span>
              <div className="flex gap-2">
                <button onClick={() => setCurating(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
                <button onClick={saveCuration} disabled={savingProducts}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black disabled:opacity-50">
                  {savingProducts ? 'Saving…' : 'Save collection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
