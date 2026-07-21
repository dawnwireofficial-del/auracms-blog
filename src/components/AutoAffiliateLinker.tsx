import React, { useState } from 'react';
import { Link2, Loader2, Check, X, AlertCircle, RefreshCw } from 'lucide-react';

interface Change {
  title: string;
  slug: string;
  count: number;
}

interface AutoLinkResult {
  original: string;
  modified: string;
  changes: Change[];
}

interface Props {
  token: string;
  postId: string;
  content: string;
  onContentUpdate: (content: string) => void;
}

export default function AutoAffiliateLinker({ token, content, onContentUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AutoLinkResult | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');

  async function analyze() {
    if (!content) return;
    setLoading(true);
    setError('');
    setResult(null);
    setApplied(false);
    try {
      const res = await fetch('/api/admin/seo/auto-affiliate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.changes) {
        setResult(data);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!result) return;
    onContentUpdate(result.modified);
    setApplied(true);
  }

  return (
    <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/60 dark:border-amber-800/40 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          Auto Affiliate Linker
        </h4>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {!result && !loading && (
        <button
          onClick={analyze}
          disabled={!content}
          className="w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all"
        >
          <Link2 className="h-3.5 w-3.5" />
          Scan for Affiliate Opportunities
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-3 text-xs text-amber-600 dark:text-amber-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Scanning content against active affiliate links...
        </div>
      )}

      {result && !applied && (
        <div className="space-y-2">
          {result.changes.length > 0 ? (
            <>
              <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                Found {result.changes.length} affiliate match{result.changes.length > 1 ? 'es' : ''}:
              </p>
              <div className="space-y-1">
                {result.changes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between bg-white dark:bg-zinc-800/50 rounded-lg px-3 py-2 border border-amber-100 dark:border-amber-800/30">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-700 dark:text-zinc-200 truncate">{c.title}</p>
                      <p className="text-[9px] text-slate-400">Slug: {c.slug}</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      {c.count} mention{c.count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={apply}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                Apply {result.changes.length} Link{result.changes.length > 1 ? 's' : ''}
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-zinc-400 text-center py-3">
              No matching product mentions found in this post.
            </p>
          )}
        </div>
      )}

      {applied && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
            {result?.changes.length} affiliate link{result?.changes.length !== 1 ? 's' : ''} applied. Save the post to persist changes.
          </p>
        </div>
      )}
    </div>
  );
}
