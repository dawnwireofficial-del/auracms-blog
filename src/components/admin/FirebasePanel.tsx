import React, { useState } from 'react';

export default function FirebasePanel({ token }: { token: string }) {
  const [msg, setMsg] = useState<string | null>(null);

  const handleExportJson = async () => {
    try {
      const res = await fetch('/api/admin/seo/product-reviews?limit=1000', { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      const items = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `dawnwire-catalog-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setMsg(`Exported ${items.length} products. A .json backup has been downloaded.`);
    } catch {
      setMsg('Export failed. Check API connection.');
    }
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      <h2 className="text-lg font-extrabold">Firebase Firestore Database & Data Backup Tools</h2>

      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-2">
        <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Firebase Project Provisioned & Active
        </div>
        <p className="text-emerald-800 dark:text-emerald-300">
          Database ID: <code className="font-mono">ai-studio-dawnwire-7393d8c5-f907-4e40-a2e2-fe5cd88ab624</code><br />
          Security Rules: Deployed and enforcing admin roles and public read access.<br />
          Super Admin Email: <code className="font-mono">medicaltradehub@gmail.com</code>
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Catalog Data Backup & Export</h3>
        <div className="flex gap-3">
          <button onClick={handleExportJson} className="bg-[#0A1F44] hover:bg-blue-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow">
            Download Full Catalog Backup (.json)
          </button>
        </div>
        {msg && <p className="text-xs font-bold text-emerald-600">{msg}</p>}
      </div>
    </div>
  );
}
