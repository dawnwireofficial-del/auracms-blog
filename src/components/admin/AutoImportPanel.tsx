import React, { useState, useEffect } from 'react';
import { RefreshCw, ShoppingBag, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

export default function AutoImportPanel({ token }: { token: string }) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const r = await fetch('/api/admin/products/auto-import-all-categories/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.ok) {
        const data = await r.json();
        setStatus(data.job);
      }
    } catch {} finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const startImport = async () => {
    if (!confirm('Start auto-importing products from Amazon for all categories? This may take several minutes.')) return;
    setLoading(true);
    try {
      const r = await fetch('/api/admin/products/auto-import-all-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ marketplace: 'US', maxPerCategory: 100 })
      });
      if (r.ok) {
        const data = await r.json();
        setStatus(data.job);
      } else {
        const err = await r.json();
        alert(err.error || 'Failed to start import');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to start import');
    } finally {
      setLoading(false);
    }
  };

  const isRunning = status?.status === 'running';
  const totalImported = status?.results?.reduce((s: number, r: any) => s + (r.imported || 0), 0) || 0;
  const totalSkipped = status?.results?.reduce((s: number, r: any) => s + (r.skipped || 0), 0) || 0;
  const totalFailed = status?.results?.reduce((s: number, r: any) => s + (r.failed || 0), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Auto-Import from Amazon</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Search Amazon for each category and import products automatically</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStatus}
            disabled={statusLoading}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={startImport}
            disabled={isRunning || loading}
            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-dw-navy to-dw-blue rounded-xl hover:from-dw-blue-700 hover:to-dw-blue-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Starting...</>
            ) : isRunning ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Running...</>
            ) : (
              <><ShoppingBag className="h-4 w-4" /> Start Auto-Import</>
            )}
          </button>
        </div>
      </div>

      {/* Status cards */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">Status</p>
            <p className="text-lg font-black text-blue-900 dark:text-blue-200 flex items-center gap-2">
              {status.status === 'running' ? <><RefreshCw className="h-4 w-4 animate-spin" /> Running</> : status.status === 'completed' ? <><CheckCircle className="h-4 w-4 text-green-600" /> Completed</> : <span className="capitalize">{status.status || 'Idle'}</span>}
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Imported</p>
            <p className="text-lg font-black text-green-900 dark:text-green-200">{totalImported}</p>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Skipped (duplicates)</p>
            <p className="text-lg font-black text-amber-900 dark:text-amber-200">{totalSkipped}</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800/50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">Failed</p>
            <p className="text-lg font-black text-red-900 dark:text-red-200">{totalFailed}</p>
          </div>
        </div>
      )}

      {/* Results table */}
      {status?.results && status.results.length > 0 && (
        <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-700">
                <th className="text-left p-3 font-bold text-slate-600 dark:text-zinc-300">Category</th>
                <th className="text-center p-3 font-bold text-slate-600 dark:text-zinc-300">Found</th>
                <th className="text-center p-3 font-bold text-green-600 dark:text-green-400">Imported</th>
                <th className="text-center p-3 font-bold text-amber-600 dark:text-amber-400">Skipped</th>
                <th className="text-center p-3 font-bold text-red-600 dark:text-red-400">Failed</th>
                <th className="text-center p-3 font-bold text-slate-600 dark:text-zinc-300">Error</th>
              </tr>
            </thead>
            <tbody>
              {status.results.map((r: any, i: number) => (
                <tr key={i} className="border-b border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/30">
                  <td className="p-3 font-medium text-slate-800 dark:text-zinc-200">{r.name}</td>
                  <td className="p-3 text-center text-slate-600 dark:text-zinc-400">{r.found}</td>
                  <td className="p-3 text-center text-green-600 dark:text-green-400 font-bold">{r.imported}</td>
                  <td className="p-3 text-center text-amber-600 dark:text-amber-400">{r.skipped}</td>
                  <td className="p-3 text-center text-red-600 dark:text-red-400">{r.failed}</td>
                  <td className="p-3 text-center text-red-500 max-w-[200px] truncate">{r.error || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!status && (
        <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-bold text-slate-600 dark:text-zinc-300 mb-2">No Import History</p>
          <p className="text-sm max-w-md mx-auto mb-6">Click "Start Auto-Import" to search Amazon for each product category and import up to 100 products per category.</p>
        </div>
      )}

      {status?.completedAt && (
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 text-center">
          Last completed: {new Date(status.completedAt).toLocaleString()} | 
          Categories: {status.totalCategories} | 
          Total imported: {status.totalImported}
        </p>
      )}
    </div>
  );
}
