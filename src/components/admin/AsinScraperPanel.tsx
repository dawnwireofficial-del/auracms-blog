import React, { useEffect, useState } from 'react';

export default function AsinScraperPanel({ token }: { token: string }) {
  const [associateTag, setAssociateTag] = useState('dawnwire-20');
  const [asinInput, setAsinInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSuccessMsg, setScrapeSuccessMsg] = useState('');
  const [tagUpdatedMsg, setTagUpdatedMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('dawnwire_associate_tag');
    if (saved) setAssociateTag(saved);
  }, []);

  const handleSimulateScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asinInput.trim()) return;
    setIsScraping(true);
    setScrapeSuccessMsg('');
    try {
      const res = await fetch('/api/admin/products/import-from-asin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ asin: asinInput.trim() }),
      });
      if (res.ok) {
        setScrapeSuccessMsg(`Successfully imported ASIN ${asinInput.toUpperCase()} from Amazon!`);
        setAsinInput('');
      } else {
        const err = await res.json();
        setScrapeSuccessMsg(`Import failed: ${err.error || 'Unknown error'}`);
      }
    } catch {
      setScrapeSuccessMsg('Import failed. Check that Amazon PA-API credentials are configured.');
    }
    setIsScraping(false);
  };

  const handleBulkUpdateTag = async () => {
    localStorage.setItem('dawnwire_associate_tag', associateTag);
    try {
      const res = await fetch('/api/admin/seo/product-reviews?limit=1000', { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      const items = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
      let updated = 0;
      for (const p of items) {
        const asin = p.asin || p.specs?.asin || '';
        if (!asin) continue;
        const affiliateUrl = `https://www.amazon.com/dp/${asin}?tag=${associateTag}`;
        const upd = await fetch(`/api/admin/seo/product-reviews/${p.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ affiliate_url: affiliateUrl }),
        });
        if (upd.ok) updated++;
      }
      setTagUpdatedMsg(`Updated ${updated} products with Amazon Associate Tag "${associateTag}"!`);
    } catch {
      setTagUpdatedMsg('Bulk tag update failed. Check API connection.');
    }
    setTimeout(() => setTagUpdatedMsg(''), 4000);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Amazon Product Advertising API & ASIN Sync Engine</h2>
        <p className="text-xs text-slate-500 mt-1">Import product metadata, images, and live prices automatically by entering an Amazon ASIN code.</p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Global Amazon Associate Tracking ID</span>
          <span className="text-[11px] text-slate-500">Appended to all outbound buy buttons on Amazon US.</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={associateTag}
            onChange={(e) => setAssociateTag(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold"
          />
          <button onClick={handleBulkUpdateTag} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs">Bulk Apply Tag</button>
        </div>
      </div>

      {tagUpdatedMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-bold">{tagUpdatedMsg}</div>
      )}

      <form onSubmit={handleSimulateScrape} className="flex gap-3 max-w-md">
        <input
          type="text"
          placeholder="Enter Amazon ASIN (e.g. B0CHWRXH8B)"
          value={asinInput}
          onChange={(e) => setAsinInput(e.target.value)}
          className="flex-1 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-mono outline-none border border-slate-200 dark:border-slate-700"
        />
        <button
          type="submit"
          disabled={isScraping || !asinInput.trim()}
          className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors shadow"
        >
          {isScraping ? 'Syncing Amazon...' : 'Fetch ASIN'}
        </button>
      </form>

      {scrapeSuccessMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs font-bold">{scrapeSuccessMsg}</div>
      )}

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Recent Price Synchronization Logs</h3>
        <p className="text-xs text-slate-400">Full sync history, price-drop alerts, and per-product sync controls live in the <strong>Amazon Sync</strong> tab.</p>
      </div>
    </div>
  );
}
