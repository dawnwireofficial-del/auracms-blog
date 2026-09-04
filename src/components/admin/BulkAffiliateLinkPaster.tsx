import React, { useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, MinusCircle, FileDown, Loader2, Trash2 } from 'lucide-react';

interface BulkResult {
  url: string;
  asin: string | null;
  matched: boolean;
  product?: string;
  slug?: string;
  changed?: boolean;
  note?: string;
}

export default function BulkAffiliateLinkPaster({ token }: { token: string }) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [results, setResults] = useState<BulkResult[] | null>(null);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const run = async (apply: boolean) => {
    const links = input.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (!links.length) {
      setMessage({ type: 'error', text: 'Paste at least one Amazon link first (one per line).' });
      return;
    }
    setBusy(true);
    setMessage(null);
    setApplied(false);
    try {
      const res = await fetch('/api/admin/affiliate/bulk-link', {
        method: 'POST',
        headers,
        body: JSON.stringify({ links, dryRun: !apply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setResults(data.results || []);
      setApplied(apply && !data.dryRun);
      const updated = (data.results || []).filter((r: BulkResult) => r.matched && r.changed).length;
      const unmatched = (data.results || []).filter((r: BulkResult) => !r.matched).length;
      if (apply) {
        setMessage({
          type: 'success',
          text: apply && data.dryRun === false
            ? `Applied: ${updated} product link(s) updated, ${data.unchanged || 0} already current, ${unmatched} unmatched.`
            : 'Preview complete.',
        });
      } else {
        setMessage({
          type: 'success',
          text: `Preview complete — ${updated} would update, ${data.unchanged || 0} already current, ${unmatched} unmatched. Click “Apply” to write.`,
        });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Request failed' });
    } finally {
      setBusy(false);
    }
  };

  const exportUnmatched = () => {
    if (!results) return;
    const unmatched = results.filter((r) => !r.matched);
    if (!unmatched.length) return;
    const csv = unmatched.map((r) => `"${r.url.replace(/"/g, '""')}","${(r.note || '').replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([`"link","reason"\n${csv}`], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'unmatched-affiliate-links.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const counts = results
    ? {
        update: results.filter((r) => r.matched && r.changed).length,
        current: results.filter((r) => r.matched && !r.changed).length,
        unmatched: results.filter((r) => !r.matched).length,
      }
    : null;

  return (
    <div className="space-y-4" id="admin-workspace-bulk-affiliate-links">
      {message && (
        <div className={`rounded-xl px-4 py-2.5 text-sm font-medium ${message.type === 'success'
          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 font-display font-bold text-slate-800 dark:text-zinc-100 text-sm">
              <ClipboardList className="h-4 w-4 text-[#246BFF]" />
              Bulk Paste — Amazon SiteStripe Affiliate Links
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-3xl leading-relaxed">
              Paste links exactly as Amazon's SiteStripe “Copy affiliate link” gives them — one per line.
              Full links (with <code className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-700 px-1 rounded">linkCode</code> /{' '}
              <code className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-700 px-1 rounded">linkId</code>), plain{' '}
              <code className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-700 px-1 rounded">?tag=</code> links, and{' '}
              <code className="font-mono text-[10px] bg-slate-100 dark:bg-zinc-700 px-1 rounded">amzn.to</code> short links all work.
              Each link is matched to its DawnWire product by ASIN and stored <strong>exactly as pasted</strong> — no rewriting, so
              Amazon's own tokens pass through untouched on every redirect.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setInput(''); setResults(null); setMessage(null); }}
            className="shrink-0 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-700"
            title="Clear"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setResults(null); setMessage(null); }}
          placeholder={'Paste Amazon links here, one per line…\nhttps://www.amazon.com/dp/B0GX9BTPB3?th=1&linkCode=ll2&tag=dawnwire-20&linkId=8a6be934fa1f21531448adba144ec5bf&language=en_US&ref_=as_li_ss_tl\nhttps://www.amazon.com/dp/B0GX9BTPB3?tag=dawnwire-20\nhttps://amzn.to/4x39eOr'}
          className="w-full h-44 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/60 p-3 text-xs font-mono text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#246BFF] br-input resize-y"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => run(false)}
            disabled={busy || !input.trim()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-700 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-600 disabled:opacity-50 transition-all"
          >
            {busy && !applied ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Preview matches
          </button>
          <button
            onClick={() => run(true)}
            disabled={busy || !input.trim() || !results}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#246BFF] px-4 py-2 rounded-lg hover:bg-[#246BFF]/90 disabled:opacity-50 transition-all"
          >
            {busy && applied ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Apply updates
          </button>
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 ml-auto">
            Tip: open the Amazon Associates toolbar → <strong>Get Link</strong> → select products → Copy affiliate link (Full Link format)
          </span>
        </div>
      </div>

      {counts && results && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/60 rounded-xl p-3 flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-[11px] text-green-700 dark:text-green-400 font-bold">To update</p>
              <p className="text-lg font-black text-green-700 dark:text-green-300">{counts.update}</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 flex items-center gap-2.5">
            <MinusCircle className="h-5 w-5 text-slate-500 dark:text-zinc-400 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-bold">Already current</p>
              <p className="text-lg font-black text-slate-700 dark:text-zinc-200">{counts.current}</p>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">Unmatched</p>
                <p className="text-lg font-black text-amber-700 dark:text-amber-300">{counts.unmatched}</p>
              </div>
            </div>
            {counts.unmatched > 0 && (
              <button onClick={exportUnmatched} className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1.5 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800/50">
                <FileDown className="h-3 w-3" /> CSV
              </button>
            )}
          </div>
        </div>
      )}

      {results && (
        <div className="bg-white dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700/50 shadow-sm overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                <tr>
                  <th className="text-left font-bold px-4 py-2.5">Product</th>
                  <th className="text-left font-bold px-4 py-2.5 w-1/3">New affiliate URL</th>
                  <th className="text-left font-bold px-4 py-2.5">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-700/60">
                {results.map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-4 py-2.5">
                      {r.matched && r.product ? (
                        <div>
                          <p className="font-semibold text-slate-700 dark:text-zinc-200 leading-snug">{r.product}</p>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">{r.slug}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-500 font-mono text-[11px] break-all">{r.url}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <p className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 break-all leading-relaxed">{r.url}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      {!r.matched ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-full">
                          <XCircle className="h-3 w-3" /> {r.note}
                        </span>
                      ) : r.changed === false ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-700 px-2 py-1 rounded-full">
                          <MinusCircle className="h-3 w-3" /> Already stored
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> {applied ? 'Updated' : 'Will update'}
                        </span>
                      )}
                      {r.matched && r.note && r.note !== 'Already the stored link' && r.note !== 'Stored exactly as pasted' && (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">{r.note}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
