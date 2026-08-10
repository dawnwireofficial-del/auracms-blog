import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Filter, ExternalLink, Copy, Check, PenLine, Eye, CheckCircle, XCircle, AlertTriangle, Clock, Link2, Package, FileWarning, BadgeCheck } from 'lucide-react';

interface HealthRow {
  id: string;
  product_name: string;
  slug: string;
  status: string;
  category_name: string;
  asin: string | null;
  affiliate_url: string | null;
  amazon_url: string | null;
  public_url: string | null;
  generated_url: string | null;
  validation_status: string;
  note: string;
  product_image: string | null;
  rating: number | null;
  editor_score: number | null;
  brand: string;
  created_at: string;
  click_count: number;
  marked_for_update: boolean;
  manual_note: string;
  marked_at: string | null;
  last_checked_at: string | null;
  checked_by: string | null;
}

interface Counts {
  total: number;
  healthy_pct: number;
  healthy: number;
  fixable: number;
  system_generated: number;
  broken: number;
  missing_links: number;
  missing_asins: number;
  marked: number;
  draft: number;
  published: number;
  last_audit: string | null;
  affiliate_tag: string;
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'needs-update', label: 'Needs Fix' },
  { key: 'fixable', label: 'Fixable' },
  { key: 'system-generated', label: 'System Generated' },
  { key: 'broken', label: 'Broken' },
  { key: 'healthy', label: 'Healthy' },
  { key: 'no-asin', label: 'No ASIN' },
  { key: 'marked', label: 'Marked for Update' },
  { key: 'draft', label: 'Draft' },
  { key: 'recent', label: 'Recently Added' },
  { key: 'not-checked', label: 'Not Checked' },
];

const STATUS_STYLES: Record<string, { label: string; cls: string; dot: string }> = {
  healthy: { label: 'Healthy', cls: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30', dot: 'bg-green-500' },
  fixable: { label: 'Fixable', cls: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30', dot: 'bg-amber-500' },
  system_generated: { label: 'System Gen', cls: 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30', dot: 'bg-blue-500' },
  broken: { label: 'Broken', cls: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30', dot: 'bg-red-500' },
  unavailable: { label: 'Unavailable', cls: 'text-slate-600 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-800', dot: 'bg-zinc-400' },
  pending: { label: 'Pending', cls: 'text-slate-600 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-800', dot: 'bg-zinc-400' },
};

interface Props {
  token: string;
}

export default function AffiliateHealthDashboard({ token }: Props) {
  const headers = { Authorization: `Bearer ${token}` };
  const [rows, setRows] = useState<HealthRow[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const limit = 25;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (filter) params.set('filter', filter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/affiliate/health?${params}`, { headers });
      const data = await res.json();
      if (data.data) {
        setRows(data.data);
        setTotal(data.total || 0);
        setCounts(data.counts || null);
      } else if (data.error) {
        showMessage('error', data.error);
      }
    } catch (e: any) {
      showMessage('error', e.message);
    }
    setLoading(false);
  }, [page, filter, search]);

  useEffect(() => { load(); }, [load]);

  const runAudit = async (applyDraft = false) => {
    setActionLoading('audit');
    try {
      const res = await fetch('/api/admin/affiliate/audit', {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyDraft }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', `Audit complete: ${data.checked} products checked${data.draftResult ? `, ${data.draftResult.flipped} flipped to draft` : ''}`);
        load();
      } else showMessage('error', data.error || 'Audit failed');
    } catch (e: any) { showMessage('error', e.message); }
    setActionLoading(null);
  };

  const toggleMark = async (row: HealthRow) => {
    setActionLoading(row.id + ':mark');
    try {
      const res = await fetch(`/api/admin/affiliate/mark/${row.id}`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark: !row.marked_for_update }),
      });
      const data = await res.json();
      if (res.ok) { showMessage('success', row.marked_for_update ? 'Unmarked' : 'Marked for manual update'); load(); }
      else showMessage('error', data.error || 'Failed');
    } catch (e: any) { showMessage('error', e.message); }
    setActionLoading(null);
  };

  const saveLink = async (row: HealthRow) => {
    if (!editUrl.trim()) return showMessage('error', 'Paste the affiliate URL first');
    setActionLoading(row.id + ':save');
    try {
      const res = await fetch(`/api/admin/affiliate/link/${row.id}`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateUrl: editUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage('success', 'Affiliate link saved & product published');
        setEditId(null);
        setEditUrl('');
        load();
      } else showMessage('error', data.error || 'Save failed');
    } catch (e: any) { showMessage('error', e.message); }
    setActionLoading(null);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  };

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleString();
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
    <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${color}`}><Icon className="h-5 w-5 text-white" /></div>
      <div>
        <p className="text-xs text-slate-500 dark:text-zinc-400">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-zinc-100">{typeof value === 'number' ? value.toLocaleString() : value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {message && (
        <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-4 flex flex-wrap items-center gap-2">
        <button onClick={() => runAudit(false)} disabled={actionLoading !== null} className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#246BFF] px-4 py-2 rounded-lg hover:bg-[#246BFF]/90 disabled:opacity-50 transition-all">
          <RefreshCw className={`h-3.5 w-3.5 ${actionLoading === 'audit' ? 'animate-spin' : ''}`} /> Run Audit
        </button>
        <button onClick={() => runAudit(true)} disabled={actionLoading !== null} className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all">
          <FileWarning className="h-3.5 w-3.5" /> Audit + Mark Unlinked as Draft
        </button>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Search products, ASIN, brand..."
            className="pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 outline-none focus:ring-1 focus:ring-[#246BFF] w-56" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard icon={Package} label="Total" value={counts?.total || 0} color="bg-blue-500" />
        <StatCard icon={BadgeCheck} label="Healthy %" value={`${counts?.healthy_pct ?? 0}%`} color="bg-green-500" />
        <StatCard icon={Link2} label="Missing Links" value={counts?.missing_links || 0} color="bg-amber-500" />
        <StatCard icon={XCircle} label="Missing ASINs" value={counts?.missing_asins || 0} color="bg-red-500" />
        <StatCard icon={AlertTriangle} label="Broken" value={counts?.broken || 0} color="bg-orange-500" />
        <StatCard icon={PenLine} label="Marked" value={counts?.marked || 0} color="bg-purple-500" />
        <StatCard icon={Clock} label="Draft" value={counts?.draft || 0} color="bg-slate-500" />
        <StatCard icon={CheckCircle} label="Published" value={counts?.published || 0} color="bg-teal-500" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
        <span>Tag: <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono">{counts?.affiliate_tag || '…'}</code></span>
        <span>Last audit: {counts?.last_audit ? fmtDate(counts.last_audit) : 'Never'}</span>
        <span className="ml-auto">{total} products shown</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        <Filter className="h-3.5 w-3.5 text-slate-400 self-center" />
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${filter === f.key ? 'bg-[#246BFF] text-white' : 'bg-white dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700/50 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-zinc-700/50 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                <th className="px-3 py-3 font-bold">Product</th>
                <th className="px-3 py-3 font-bold">ASIN</th>
                <th className="px-3 py-3 font-bold">Status</th>
                <th className="px-3 py-3 font-bold">Affiliate Link</th>
                <th className="px-3 py-3 font-bold">Public URL</th>
                <th className="px-3 py-3 font-bold">Mark</th>
                <th className="px-3 py-3 font-bold">Last Checked</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-400">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-10 text-center text-slate-400">No products match this filter</td></tr>
              ) : rows.map((row) => {
                const st = STATUS_STYLES[row.validation_status] || STATUS_STYLES.pending;
                return (
                  <tr key={row.id} className="border-b border-slate-50 dark:border-zinc-800/60 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40">
                    <td className="px-3 py-3 align-top">
                      <div className="flex items-center gap-2">
                        {row.product_image && <img src={row.product_image} alt="" className="h-8 w-8 rounded-lg object-cover bg-slate-100" loading="lazy" />}
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-zinc-100 max-w-[220px] truncate">{row.product_name || '(no name)'}</p>
                          <p className="text-[10px] text-slate-400">
                            {row.brand} {row.category_name ? `· ${row.category_name}` : ''} · {row.status}
                            {row.marked_for_update && <span className="ml-1 text-purple-500 font-bold">★ marked</span>}
                          </p>
                          {row.manual_note && <p className="text-[10px] text-purple-500 italic">“{row.manual_note}”</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      {row.asin ? <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono">{row.asin}</code> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5 max-w-[140px]">{row.note}</p>
                    </td>
                    <td className="px-3 py-3 align-top">
                      {editId === row.id ? (
                        <div className="space-y-1.5">
                          <input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="Paste Amazon affiliate link…"
                            className="w-72 px-2.5 py-1.5 text-[11px] rounded-lg border border-[#246BFF] bg-slate-50 dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 outline-none font-mono" />
                          <div className="flex gap-1.5">
                            <button onClick={() => saveLink(row)} disabled={actionLoading === row.id + ':save'} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                              Save & Publish
                            </button>
                            <button onClick={() => { setEditId(null); setEditUrl(''); }} className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {row.affiliate_url ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 max-w-[220px] truncate inline-block">{row.affiliate_url}</span>
                              <button onClick={() => copy(row.affiliate_url || '', row.id + ':copy')} title="Copy" className="text-slate-400 hover:text-[#246BFF]">
                                {copied === row.id + ':copy' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          ) : <span className="text-slate-400">No affiliate link</span>}
                          {row.generated_url && !row.affiliate_url && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-blue-500">{row.generated_url}</span>
                              <button onClick={() => copy(row.generated_url || '', row.id + ':gen')} title="Copy generated" className="text-slate-400 hover:text-[#246BFF]">
                                {copied === row.id + ':gen' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          )}
                          <button onClick={() => { setEditId(row.id); setEditUrl(row.affiliate_url || ''); }}
                            className="text-[10px] font-bold text-[#246BFF] hover:underline inline-flex items-center gap-1">
                            <PenLine className="h-3 w-3" /> Paste/Edit link
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {row.public_url ? (
                        <div className="flex items-center gap-1.5">
                          <a href={row.public_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-zinc-300 hover:text-[#246BFF] bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
                            <ExternalLink className="h-3 w-3" /> Open
                          </a>
                          <button onClick={() => copy(row.public_url || '', row.id + ':pub')} title="Copy public URL" className="text-slate-400 hover:text-[#246BFF]">
                            {copied === row.id + ':pub' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <button onClick={() => toggleMark(row)} disabled={actionLoading === row.id + ':mark'}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all disabled:opacity-50 ${row.marked_for_update ? 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                        {row.marked_for_update ? 'Unmark' : 'Mark to Update'}
                      </button>
                      {row.slug && (
                        <a href={`/products/${row.slug}`} target="_blank" rel="noopener noreferrer" className="block mt-1 text-[10px] text-slate-400 hover:text-[#246BFF]">View page ↗</a>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-[10px] text-slate-400 whitespace-nowrap">
                      {fmtDate(row.last_checked_at)}
                      {row.checked_by && <span className="block text-[9px] text-slate-300">{row.checked_by}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-zinc-700/50">
            <span className="text-[11px] text-slate-500">{page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total} className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
