import React, { useState, useEffect, useCallback } from 'react';
import { proxyImageUrl } from '../utils/safeRender';
import { RefreshCw, Play, Pause, Settings, AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown, DollarSign, Package, Search, Filter, ChevronDown, ExternalLink, BarChart3, Activity } from 'lucide-react';

interface SyncStats {
  totalConnected: number;
  successfullySynced: number;
  pending: number;
  missingAsin: number;
  invalidAsin: number;
  duplicateAsins: number;
  duplicateAsinList: { asin: string; productIds: string[] }[];
  unavailableProducts: number;
  changedPrices: number;
  expiredDeals: number;
  apiErrors: number;
  lastSuccessfulSync: string | null;
  nextScheduledSync: string | null;
  apiRequestsToday: number;
  apiRequestLimit: number;
  isPaused: boolean;
  isRunning: boolean;
}

interface SyncProduct {
  id: string;
  productId: string;
  asin: string;
  marketplaceCode: string;
  syncStatus: string;
  currentPrice: number | null;
  previousPrice: number | null;
  currency: string | null;
  availability: string | null;
  isAvailable: boolean;
  isDeal: boolean;
  lastSyncAt: string | null;
  lastSuccessfulSyncAt: string | null;
  errorCount: number;
  lastErrorMessage: string | null;
  productTitle: string | null;
  brand: string | null;
  mainImage: string | null;
  productName?: string;
}

interface Props {
  token: string;
}

export default function AmazonSyncDashboard({ token }: Props) {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [products, setProducts] = useState<SyncProduct[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'settings' | 'credentials'>('overview');
  const [syncSettings, setSyncSettings] = useState<any>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const headers = { Authorization: `Bearer ${token}` };
  const limit = 25;

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/amazon-sync/stats', { headers });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), offset: String(page * limit) });
      if (statusFilter) params.set('sync_status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/admin/amazon-sync/products?${params}`, { headers });
      const data = await res.json();
      if (data.data) {
        setProducts(data.data.map((p: any) => ({ ...p, productName: p.productTitle || p.productName || '' })));
        setProductsTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [page, statusFilter, searchQuery]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/amazon-sync/settings', { headers });
      if (res.ok) setSyncSettings(await res.json());
    } catch {}
  }, []);

  const loadCredentials = useCallback(async () => {
    try {
      const [credsRes, marketsRes] = await Promise.all([
        fetch('/api/admin/amazon-sync/credentials', { headers }),
        fetch('/api/admin/amazon-sync/marketplaces', { headers }),
      ]);
      if (credsRes.ok) setCredentials(await credsRes.json());
      if (marketsRes.ok) setMarketplaces(await marketsRes.json());
    } catch {}
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { if (activeTab === 'settings') loadSettings(); }, [activeTab, loadSettings]);
  useEffect(() => { if (activeTab === 'credentials') loadCredentials(); }, [activeTab, loadCredentials]);

  const doAction = async (url: string, body?: any, successMsg?: string) => {
    setActionLoading(url);
    try {
      const res = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json();
      if (res.ok) {
        if (successMsg) showMessage('success', successMsg);
        loadStats();
        loadProducts();
      } else {
        showMessage('error', data.error || 'Action failed');
      }
    } catch (e: any) {
      showMessage('error', e.message);
    }
    setActionLoading(null);
  };

  const syncOne = (productId: string) => doAction('/api/admin/amazon-sync/sync-one', { productId }, 'Product synced');
  const syncSelected = (ids: string[]) => doAction('/api/admin/amazon-sync/sync-selected', { productIds: ids }, `${ids.length} products synced`);
  const syncCategory = (catId: string) => doAction('/api/admin/amazon-sync/sync-category', { categoryId: catId }, 'Category synced');
  const syncFeatured = () => doAction('/api/admin/amazon-sync/sync-featured', undefined, 'Featured products synced');
  const syncAll = () => doAction('/api/admin/amazon-sync/sync-all', undefined, 'All products queued for sync');
  const doPause = () => doAction('/api/admin/amazon-sync/pause', undefined, 'Sync paused');
  const doResume = () => doAction('/api/admin/amazon-sync/resume', undefined, 'Sync resumed');
  const doInitialize = () => doAction('/api/admin/amazon-sync/initialize', undefined, 'Existing products initialized');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'Never';
    const date = new Date(d);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
    <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-zinc-400">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-zinc-100">{typeof value === 'number' ? value.toLocaleString() : value || '—'}</p>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={syncAll} disabled={actionLoading !== null} className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#246BFF] px-4 py-2 rounded-lg hover:bg-[#246BFF]/90 disabled:opacity-50 transition-all">
            <RefreshCw className={`h-3.5 w-3.5 ${actionLoading === '/api/admin/amazon-sync/sync-all' ? 'animate-spin' : ''}`} /> Sync All
          </button>
          <button onClick={syncFeatured} disabled={actionLoading !== null} className="flex items-center gap-1.5 text-xs font-bold text-[#246BFF] bg-[#246BFF]/5 px-3 py-2 rounded-lg hover:bg-[#246BFF]/10 disabled:opacity-50 transition-all">
            <Package className="h-3.5 w-3.5" /> Sync Featured
          </button>
          {stats?.isPaused ? (
            <button onClick={doResume} disabled={actionLoading !== null} className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-all">
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
          ) : (
            <button onClick={doPause} disabled={actionLoading !== null} className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-all">
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
          )}
          <button onClick={doInitialize} disabled={actionLoading !== null} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-all ml-auto">
            <Settings className="h-3.5 w-3.5" /> Initialize
          </button>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={Package} label="Total" value={stats?.totalConnected || 0} color="bg-blue-500" />
        <StatCard icon={CheckCircle} label="Synced" value={stats?.successfullySynced || 0} color="bg-green-500" />
        <StatCard icon={Clock} label="Pending" value={stats?.pending || 0} color="bg-amber-500" />
        <StatCard icon={AlertTriangle} label="Missing ASIN" value={stats?.missingAsin || 0} color="bg-orange-500" />
        <StatCard icon={XCircle} label="Invalid ASIN" value={stats?.invalidAsin || 0} color="bg-red-500" />
        <StatCard icon={BarChart3} label="Duplicate ASINs" value={stats?.duplicateAsins || 0} color="bg-dw-blue" />
        <StatCard icon={XCircle} label="Unavailable" value={stats?.unavailableProducts || 0} color="bg-red-500" />
        <StatCard icon={TrendingUp} label="Price Changes" value={stats?.changedPrices || 0} color="bg-emerald-500" />
        <StatCard icon={Activity} label="Expired Deals" value={stats?.expiredDeals || 0} color="bg-pink-500" />
        <StatCard icon={AlertTriangle} label="API Errors" value={stats?.apiErrors || 0} color="bg-red-600" />
      </div>

      {/* API Usage & Sync info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 p-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#246BFF]" /> API Usage Today
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full bg-[#246BFF] rounded-full transition-all" style={{ width: `${Math.min(100, ((stats?.apiRequestsToday || 0) / (stats?.apiRequestLimit || 8640)) * 100)}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                <span>{stats?.apiRequestsToday || 0} requests</span>
                <span>Limit: {stats?.apiRequestLimit?.toLocaleString() || 8640}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700/50 p-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#246BFF]" /> Sync Schedule
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Last sync:</span>
              <span className="text-slate-700 dark:text-zinc-200">{formatDate(stats?.lastSuccessfulSync ?? null)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Next sync:</span>
              <span className="text-slate-700 dark:text-zinc-200">{formatDate(stats?.nextScheduledSync ?? null)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">Status:</span>
              <span className={`font-bold ${stats?.isPaused ? 'text-amber-500' : stats?.isRunning ? 'text-green-500' : 'text-slate-500'}`}>
                {stats?.isPaused ? 'Paused' : stats?.isRunning ? 'Running' : 'Idle'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate ASINs warning */}
      {stats && stats?.duplicateAsinList?.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">Duplicate ASINs Detected</h3>
          <div className="space-y-1">
            {stats.duplicateAsinList!.map((d: any, i: number) => (
              <p key={i} className="text-xs text-red-600 dark:text-red-400">
                ASIN <strong>{d.asin}</strong> is used by {d.productIds.length} products
              </p>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
        </div>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-slate-100 dark:border-zinc-700/50 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(0); }} placeholder="Search products or ASIN..." className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:ring-2 focus:ring-[#246BFF]/30 focus:border-[#246BFF] outline-none" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="queued">Queued</option>
          <option value="syncing">Syncing</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="paused">Paused</option>
        </select>
        {selectedIds.length > 0 && (
          <button onClick={() => syncSelected(selectedIds)} disabled={actionLoading !== null} className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#246BFF] px-3 py-2 rounded-lg hover:bg-[#246BFF]/90 disabled:opacity-50">
            <RefreshCw className="h-3.5 w-3.5" /> Sync {selectedIds.length}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            <tr>
              <th className="p-3 text-left"><input type="checkbox" onChange={e => { if (e.target.checked) setSelectedIds(products.map(p => p.productId)); else setSelectedIds([]); }} checked={selectedIds.length === products.length && products.length > 0} className="rounded border-slate-300" /></th>
              <th className="p-3 text-left">Product / ASIN</th>
              <th className="p-3 text-left">Marketplace</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Current Price</th>
              <th className="p-3 text-right">Previous Price</th>
              <th className="p-3 text-left">Availability</th>
              <th className="p-3 text-left">Deal</th>
              <th className="p-3 text-left">Last Sync</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-700/50">
            {loading ? (
              <tr><td colSpan={10} className="p-8 text-center text-slate-400">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={10} className="p-8 text-center text-slate-400">No products found</td></tr>
            ) : products.map(p => (
              <tr key={p.productId || p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-700/30 transition-colors">
                <td className="p-3">
                  <input type="checkbox" checked={selectedIds.includes(p.productId)} onChange={() => toggleSelect(p.productId)} className="rounded border-slate-300" />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {p.mainImage && <img src={proxyImageUrl(p.mainImage)} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                    <div>
                      <p className="font-medium text-slate-700 dark:text-zinc-200 truncate max-w-[200px]">{p.productName || p.productTitle || '—'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.asin}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-slate-500">{p.marketplaceCode}</td>
                <td className="p-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor(p.syncStatus)}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDotColor(p.syncStatus)}`} />
                    {p.syncStatus}
                  </span>
                </td>
                <td className="p-3 text-right font-medium text-slate-700 dark:text-zinc-200">
                  {p.currentPrice != null ? `${p.currency || '$'}${Number(p.currentPrice).toFixed(2)}` : '—'}
                </td>
                <td className="p-3 text-right text-slate-400">
                  {p.previousPrice != null ? `${p.currency || '$'}${Number(p.previousPrice).toFixed(2)}` : '—'}
                </td>
                <td className="p-3">
                  <span className={`text-[10px] font-bold ${p.isAvailable === false ? 'text-red-500' : 'text-green-600'}`}>
                    {p.isAvailable === false ? 'Out of Stock' : p.availability || 'Available'}
                  </span>
                </td>
                <td className="p-3">
                  {p.isDeal ? <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">Deal</span> : '—'}
                </td>
                <td className="p-3 text-[10px] text-slate-400">{p.lastSuccessfulSyncAt ? formatDate(p.lastSuccessfulSyncAt) : '—'}</td>
                <td className="p-3 text-center">
                  <button onClick={() => syncOne(p.productId)} disabled={actionLoading !== null} className="text-[#246BFF] hover:text-[#246BFF]/80 disabled:opacity-50" title="Sync now">
                    <RefreshCw className={`h-3.5 w-3.5 ${actionLoading === '/api/admin/amazon-sync/sync-one' ? 'animate-spin' : ''}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 dark:border-zinc-700/50 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {page * limit + 1}-{Math.min((page + 1) * limit, productsTotal)} of {productsTotal}</span>
        <div className="flex gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 disabled:opacity-30 dark:hover:bg-zinc-700">Previous</button>
          <button disabled={(page + 1) * limit >= productsTotal} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 disabled:opacity-30 dark:hover:bg-zinc-700">Next</button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-4">Sync Configuration</h3>
        {syncSettings ? (
          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const data: Record<string, any> = Object.fromEntries(new FormData(form));
            data.fields_to_sync = JSON.stringify((data.fields_to_sync as string || '').split(',').map(s => s.trim()));
            data.fields_auto_overwrite = JSON.stringify((data.fields_auto_overwrite as string || '').split(',').map(s => s.trim()));
            data.auto_sync_enabled = form.querySelector<HTMLInputElement>('[name=auto_sync_enabled]')?.checked || false;
            try {
              const res = await fetch('/api/admin/amazon-sync/settings', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
              if (res.ok) { showMessage('success', 'Settings saved'); loadSettings(); }
              else showMessage('error', 'Failed to save');
            } catch (e: any) { showMessage('error', e.message); }
          }}>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" name="auto_sync_enabled" defaultChecked={syncSettings?.auto_sync_enabled} className="rounded border-slate-300" />
                <span className="text-xs text-slate-700 dark:text-zinc-200">Enable automatic synchronization</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Sync interval (min)</label>
                  <input type="number" name="sync_interval_minutes" defaultValue={syncSettings?.sync_interval_minutes || 60} className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Fast sync interval (min) — high priority</label>
                  <input type="number" name="fast_sync_interval_minutes" defaultValue={syncSettings?.fast_sync_interval_minutes || 15} className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Deal sync interval (min)</label>
                  <input type="number" name="deal_sync_interval_minutes" defaultValue={syncSettings?.deal_sync_interval_minutes || 30} className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Batch size</label>
                  <input type="number" name="batch_size" defaultValue={syncSettings?.batch_size || 10} min={1} max={10} className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Max retries</label>
                  <input type="number" name="max_retries" defaultValue={syncSettings?.max_retries || 3} className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Freshness period (days)</label>
                  <input type="number" name="freshness_days" defaultValue={syncSettings?.freshness_days || 7} className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Fields to sync (comma-separated)</label>
                <input type="text" name="fields_to_sync" defaultValue={(syncSettings?.fields_to_sync || []).join(', ')} className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Fields that auto-overwrite (comma-separated)</label>
                <input type="text" name="fields_auto_overwrite" defaultValue={(syncSettings?.fields_auto_overwrite || []).join(', ')} className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-mono" />
              </div>
              <label className="flex items-center gap-3">
                <input type="checkbox" name="notify_on_failure" defaultChecked={syncSettings?.notify_on_failure} className="rounded border-slate-300" />
                <span className="text-xs text-slate-700 dark:text-zinc-200">Notify on sync failures</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" name="notify_on_price_change" defaultChecked={syncSettings?.notify_on_price_change} className="rounded border-slate-300" />
                <span className="text-xs text-slate-700 dark:text-zinc-200">Notify on price changes</span>
              </label>
            </div>
            <button type="submit" className="mt-6 text-xs font-bold text-white bg-[#246BFF] px-6 py-2.5 rounded-lg hover:bg-[#246BFF]/90 transition-all">Save Settings</button>
          </form>
        ) : <p className="text-xs text-slate-400">Loading settings...</p>}
      </div>
    </div>
  );

  const renderCredentials = () => (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 dark:text-zinc-200 mb-4">API Credentials</h3>
        <p className="text-xs text-slate-500 mb-4">
          Enter your Amazon Product Advertising API 5.0 credentials (Access Key, Secret Key, and Partner Tag) for each marketplace.
          These are stored encrypted in the database. You need credentials for at least the US marketplace.
        </p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const data = Object.fromEntries(new FormData(form));
          try {
            const res = await fetch('/api/admin/amazon-sync/credentials', {
              method: 'PUT',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                marketplaceCode: data.marketplace_code,
                accessKey: data.access_key,
                secretKey: data.secret_key,
                partnerTag: data.partner_tag,
              }),
            });
            if (res.ok) { showMessage('success', 'Credentials saved'); loadCredentials(); }
            else showMessage('error', 'Failed to save');
          } catch (e: any) { showMessage('error', e.message); }
        }}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Marketplace</label>
              <select name="marketplace_code" required className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">
                <option value="">Select marketplace...</option>
                {marketplaces.map((m: any) => <option key={m.code} value={m.code}>{m.name} ({m.code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">AWS Access Key ID</label>
              <input type="text" name="access_key" required placeholder="AKIA..." className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">AWS Secret Access Key</label>
              <input type="password" name="secret_key" required placeholder="••••••••" className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Amazon Associate Tag (Partner Tag)</label>
              <input type="text" name="partner_tag" required placeholder="dawnwire-20" className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 font-mono" />
            </div>
          </div>
          <button type="submit" className="mt-4 text-xs font-bold text-white bg-[#246BFF] px-6 py-2.5 rounded-lg hover:bg-[#246BFF]/90 transition-all">Save Credentials</button>
        </form>

        {/* Existing credentials */}
        {credentials.length > 0 && (
          <div className="mt-6 border-t border-slate-100 dark:border-zinc-700/50 pt-4">
            <h4 className="text-xs font-bold text-slate-600 dark:text-zinc-300 mb-3">Saved Credentials</h4>
            <div className="space-y-2">
              {credentials.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-900/50 rounded-lg">
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-zinc-200">{c.marketplaceCode}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Partner tag: {c.partnerTag}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-1">
        {[
          { key: 'overview', icon: BarChart3, label: 'Overview' },
          { key: 'products', icon: Package, label: 'Products' },
          { key: 'settings', icon: Settings, label: 'Settings' },
          { key: 'credentials', icon: Activity, label: 'Credentials' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.key ? 'bg-[#246BFF] text-white shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200'}`}>
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'products' && renderProducts()}
      {activeTab === 'settings' && renderSettings()}
      {activeTab === 'credentials' && renderCredentials()}
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'success': return 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
    case 'failed': return 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
    case 'syncing': return 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30';
    case 'queued': return 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
    case 'paused': return 'text-slate-600 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-800';
    default: return 'text-slate-600 bg-slate-100 dark:text-zinc-400 dark:bg-zinc-800';
  }
}

function statusDotColor(status: string): string {
  switch (status) {
    case 'success': return 'bg-green-500';
    case 'failed': return 'bg-red-500';
    case 'syncing': return 'bg-blue-500';
    case 'queued': return 'bg-amber-500';
    default: return 'bg-slate-400';
  }
}
