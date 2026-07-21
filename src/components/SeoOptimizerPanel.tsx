import React, { useState, useEffect, useCallback } from 'react';
import {
  Zap, Target, CheckCircle, AlertTriangle, XCircle, RefreshCw,
  FileText, Star, SlidersHorizontal, Eye, Play, Layers, DollarSign,
  TrendingUp, Search, Filter, X, ChevronDown, ChevronUp,
} from 'lucide-react';

interface OptimizationCandidate {
  id: string;
  type: 'post' | 'product';
  title: string;
  slug: string;
  currentScore: number;
  issues: string[];
  wordCount: number;
  focusKeyword: string;
  updatedAt: string;
  estImprovement: number;
}

interface OptimizerStats {
  totalItems: number;
  averageScore: number;
  belowThreshold: number;
  threshold: number;
  estimatedCostUsd: number;
}

interface OptimizedResult {
  success: boolean;
  improvements: string[];
  newScore: number;
  oldScore: number;
  changes?: Record<string, { before: string; after: string }>;
  error?: string;
}

interface PreviewResult {
  original: { title: string; content: string; seoTitle: string; seoDescription: string; score: number };
  optimized: { content?: string; seoTitle?: string; seoDescription?: string; improvements: string[]; estimatedNewScore: number };
}

interface BulkResult {
  total: number;
  optimized: number;
  failed: number;
  results: { id: string; title: string; success: boolean; error?: string; improvements?: string[] }[];
}

interface SeoOptimizerPanelProps {
  token: string;
  baseUrl: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
  if (score >= 50) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
  return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function getTypeIcon(type: 'post' | 'product') {
  return type === 'post' ? FileText : Star;
}

function getTypeLabel(type: 'post' | 'product') {
  return type === 'post' ? 'Article' : 'Product';
}

export default function SeoOptimizerPanel({ token, baseUrl }: SeoOptimizerPanelProps) {
  const [candidates, setCandidates] = useState<OptimizationCandidate[]>([]);
  const [stats, setStats] = useState<OptimizerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [bulkOptimizing, setBulkOptimizing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<BulkResult | null>(null);
  const [previewItem, setPreviewItem] = useState<{ candidate: OptimizationCandidate; preview: PreviewResult } | null>(null);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(70);
  const [filterType, setFilterType] = useState<'all' | 'post' | 'product'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'title' | 'type'>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const api = (path: string, opts?: RequestInit) => fetch(`${baseUrl}/api/admin/seo/optimization${path}`, { ...opts, headers: { ...headers, ...opts?.headers } });

  const showMessage = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, candidatesRes] = await Promise.all([
        api('/stats'), api('/candidates'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (candidatesRes.ok) setCandidates(await candidatesRes.json());
    } catch { showMessage('error', 'Failed to load optimization data'); }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handlePreview(candidate: OptimizationCandidate) {
    setPreviewLoading(candidate.id);
    try {
      const res = await api(`/preview/${candidate.type}/${candidate.id}`, { method: 'POST' });
      if (res.ok) {
        const preview: PreviewResult = await res.json();
        setPreviewItem({ candidate, preview });
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Preview failed');
      }
    } catch { showMessage('error', 'Preview request failed'); }
    setPreviewLoading(null);
  }

  async function handleApply(candidate: OptimizationCandidate) {
    if (!confirm(`Apply AI optimization to "${candidate.title}"? This will modify the content.`)) return;
    setOptimizing(candidate.id);
    try {
      const res = await api(`/apply/${candidate.type}/${candidate.id}`, { method: 'POST' });
      if (res.ok) {
        const result: OptimizedResult = await res.json();
        if (result.success) {
          showMessage('success', `"${candidate.title}" optimized: ${result.oldScore}% → ${result.newScore}%`);
          await loadData();
        } else {
          showMessage('error', result.error || 'Optimization failed');
        }
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Apply failed');
      }
    } catch { showMessage('error', 'Request failed'); }
    setOptimizing(null);
    setPreviewItem(null);
  }

  async function handleBulkOptimize() {
    const count = candidates.filter(c => c.currentScore < threshold && (filterType === 'all' || c.type === filterType)).length;
    if (count === 0) { showMessage('info', 'No items below threshold to optimize'); return; }
    if (!confirm(`Optimize ${count} items below ${threshold}% score? This will use AI credits.`)) return;

    setBulkOptimizing(true);
    setBulkProgress(null);
    try {
      const res = await api('/bulk', {
        method: 'POST',
        body: JSON.stringify({ threshold, types: filterType === 'all' ? ['post', 'product'] : [filterType], maxItems: 100 }),
      });
      if (res.ok) {
        const result: BulkResult = await res.json();
        setBulkProgress(result);
        showMessage('success', `Bulk optimize complete: ${result.optimized} optimized, ${result.failed} failed`);
        await loadData();
      } else {
        const err = await res.json();
        showMessage('error', err.error || 'Bulk optimize failed');
      }
    } catch { showMessage('error', 'Bulk request failed'); }
    setBulkOptimizing(false);
  }

  const filtered = candidates
    .filter(c => filterType === 'all' || c.type === filterType)
    .filter(c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'score') return sortAsc ? a.currentScore - b.currentScore : b.currentScore - a.currentScore;
      if (sortBy === 'title') return sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      if (sortBy === 'type') return sortAsc ? a.type.localeCompare(b.type) : b.type.localeCompare(a.type);
      return 0;
    });

  const belowThresholdCount = filtered.filter(c => c.currentScore < threshold).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-[#246BFF]" />
        <span className="ml-3 text-sm text-slate-600/60 dark:text-zinc-400/80">Loading optimizer...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
          'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">AI SEO Optimizer</h3>
            <p className="text-sm text-slate-600/60 dark:text-zinc-400/80">Optimize all content for higher Google rankings using AI</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Content', value: stats.totalItems, icon: Layers, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Avg SEO Score', value: `${stats.averageScore}%`, icon: Target, color: stats.averageScore >= 70 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Needs Optimization', value: stats.belowThreshold, icon: AlertTriangle, color: stats.belowThreshold > 0 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20' },
            { label: 'Est. AI Cost', value: `$${stats.estimatedCostUsd}`, icon: DollarSign, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-2xl p-5">
              <div className={`inline-flex p-2.5 rounded-xl ${s.color} mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
              <div className="text-sm text-slate-600/60 dark:text-zinc-400/80">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-2xl">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400/40" />
          <span className="text-xs font-medium text-slate-600/60 dark:text-zinc-400/80">Threshold:</span>
          <input
            type="range"
            min={30}
            max={95}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-24 h-1.5 accent-[#246BFF]"
          />
          <span className="text-xs font-bold text-slate-900 dark:text-white w-8">{threshold}%</span>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700" />

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400/40" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="text-xs border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200"
          >
            <option value="all">All Types</option>
            <option value="post">Articles Only</option>
            <option value="product">Products Only</option>
          </select>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700" />

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search content..."
            className="w-full text-xs border-0 bg-transparent focus:outline-none text-slate-800 dark:text-zinc-200 placeholder:text-slate-300/30"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-300/30 hover:text-slate-600/60 dark:hover:text-zinc-400/80">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-500/50 dark:text-zinc-400/80">
            {belowThresholdCount} of {filtered.length} below {threshold}%
          </span>
          <button
            onClick={handleBulkOptimize}
            disabled={bulkOptimizing || belowThresholdCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#246BFF] text-white rounded-xl text-xs font-bold hover:bg-[#1A5AD6] transition-all disabled:opacity-50"
          >
            {bulkOptimizing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {bulkOptimizing ? 'Optimizing...' : `Optimize ${belowThresholdCount > 0 ? `All ${belowThresholdCount}` : 'All'}`}
          </button>
        </div>
      </div>

      {/* Bulk progress */}
      {bulkProgress && (
        <div className="p-4 bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Bulk Optimization Results</span>
            <button onClick={() => setBulkProgress(null)} className="text-slate-300/30 hover:text-slate-600/60 dark:hover:text-zinc-400/80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-green-600 dark:text-green-400">{bulkProgress.optimized} optimized</span>
            <span className="text-red-600 dark:text-red-400">{bulkProgress.failed} failed</span>
            <span className="text-slate-500/50 dark:text-zinc-400/80">{bulkProgress.total} total</span>
          </div>
          {bulkProgress.failed > 0 && (
            <div className="mt-2 space-y-1">
              {bulkProgress.results.filter(r => !r.success).map(r => (
                <div key={r.id} className="text-xs text-red-500">- {r.title}: {r.error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content table */}
      <div className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500/50 dark:text-zinc-400/80 border-b border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50">
                <th className="p-3 font-medium">
                  <button onClick={() => { setSortBy('type'); setSortAsc(!sortAsc); }} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-zinc-200">
                    Type {sortBy === 'type' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </button>
                </th>
                <th className="p-3 font-medium">
                  <button onClick={() => { setSortBy('title'); setSortAsc(!sortAsc); }} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-zinc-200">
                    Title {sortBy === 'title' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </button>
                </th>
                <th className="p-3 font-medium">
                  <button onClick={() => { setSortBy('score'); setSortAsc(!sortAsc); }} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-zinc-200">
                    Score {sortBy === 'score' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </button>
                </th>
                <th className="p-3 font-medium">Issues</th>
                <th className="p-3 font-medium">Words</th>
                <th className="p-3 font-medium">Est.</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center text-slate-500/50 dark:text-zinc-400/80">No content found matching filters</td></tr>
              )}
              {filtered.map(c => {
                const TypeIcon = getTypeIcon(c.type);
                const needsOpt = c.currentScore < threshold;
                return (
                  <tr key={`${c.type}-${c.id}`} className={`border-b border-slate-200/50 dark:border-zinc-700/50 ${needsOpt ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                    <td className="p-3">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${
                        c.type === 'post' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                      }`}>
                        <TypeIcon className="w-3 h-3" />
                        {getTypeLabel(c.type)}
                      </div>
                    </td>
                    <td className="p-3 max-w-[250px]">
                      <a
                        href={c.type === 'post' ? `/post/${c.slug}` : `/review/${c.slug}`}
                        target="_blank"
                        className="text-slate-800 dark:text-zinc-200 font-medium hover:text-[#246BFF] text-xs line-clamp-1 block"
                      >
                        {c.title}
                      </a>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getScoreColor(c.currentScore)}`}>
                          {c.currentScore}%
                        </span>
                        <div className="w-16 bg-slate-100 dark:bg-zinc-700 rounded-full h-1.5">
                          <div className={`h-full rounded-full ${getScoreBarColor(c.currentScore)}`} style={{ width: `${c.currentScore}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {c.issues.length > 0 ? c.issues.map(issue => (
                          <span key={issue} className="text-[8px] bg-red-100 dark:bg-red-900/30 text-red-500 px-1.5 py-0.5 rounded font-bold" title={issue}>
                            {issue}
                          </span>
                        )) : (
                          <span className="text-[8px] bg-green-100 dark:bg-green-900/30 text-green-500 px-1.5 py-0.5 rounded font-bold">OK</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-600/60 dark:text-zinc-400/80">{c.wordCount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold ${c.estImprovement > c.currentScore ? 'text-green-600 dark:text-green-400' : 'text-slate-400/40 dark:text-zinc-500'}`}>
                        +{Math.max(0, c.estImprovement - c.currentScore)}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handlePreview(c)}
                          disabled={previewLoading === c.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#246BFF] bg-[#246BFF]/5 hover:bg-[#246BFF]/10 transition-all disabled:opacity-50"
                          title="Preview changes"
                        >
                          {previewLoading === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                          Preview
                        </button>
                        <button
                          onClick={() => handleApply(c)}
                          disabled={optimizing === c.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#246BFF] hover:bg-[#1A5AD6] transition-all disabled:opacity-50"
                          title="Apply optimization"
                        >
                          {optimizing === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                          Optimize
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPreviewItem(null)}>
          <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-700 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Preview Optimization</h4>
                  <p className="text-xs text-slate-500/50 dark:text-zinc-400/80">{previewItem.candidate.title}</p>
                </div>
              </div>
              <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-all">
                <X className="w-4 h-4 text-slate-500/50 dark:text-zinc-400/80" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Score comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl text-center">
                  <p className="text-[10px] font-medium text-red-500 uppercase tracking-wider mb-1">Current Score</p>
                  <p className="text-3xl font-black text-red-500">{previewItem.preview.original.score}%</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl text-center">
                  <p className="text-[10px] font-medium text-green-500 uppercase tracking-wider mb-1">Estimated Score</p>
                  <p className="text-3xl font-black text-green-500">{previewItem.preview.optimized.estimatedNewScore}%</p>
                </div>
              </div>

              {/* Improvements */}
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Improvements Planned</h5>
                <div className="space-y-1">
                  {previewItem.preview.optimized.improvements.map((imp, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3 h-3 shrink-0" />
                      {imp}
                    </div>
                  ))}
                </div>
              </div>

              {/* SEO Title diff */}
              {previewItem.preview.optimized.seoTitle && previewItem.preview.optimized.seoTitle !== previewItem.preview.original.seoTitle && (
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-2">SEO Title</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-[10px] text-red-500 font-medium mb-1">Before</p>
                      <p className="text-xs text-slate-700/70 dark:text-zinc-300/80">{previewItem.preview.original.seoTitle || '(empty)'}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <p className="text-[10px] text-green-500 font-medium mb-1">After</p>
                      <p className="text-xs text-green-700 dark:text-green-400">{previewItem.preview.optimized.seoTitle}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SEO Description diff */}
              {previewItem.preview.optimized.seoDescription && previewItem.preview.optimized.seoDescription !== previewItem.preview.original.seoDescription && (
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Meta Description</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-[10px] text-red-500 font-medium mb-1">Before</p>
                      <p className="text-xs text-slate-700/70 dark:text-zinc-300/80">{previewItem.preview.original.seoDescription || '(empty)'}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <p className="text-[10px] text-green-500 font-medium mb-1">After</p>
                      <p className="text-xs text-green-700 dark:text-green-400">{previewItem.preview.optimized.seoDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Content diff preview */}
              {previewItem.preview.optimized.content && (
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-2">Content Preview (first 500 chars)</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-[10px] text-red-500 font-medium mb-1">Before</p>
                      <p className="text-xs text-slate-700/70 dark:text-zinc-300/80 whitespace-pre-wrap font-mono leading-relaxed">
                        {previewItem.preview.original.content.substring(0, 500)}...
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <p className="text-[10px] text-green-500 font-medium mb-1">After</p>
                      <p className="text-xs text-green-700 dark:text-green-400 whitespace-pre-wrap font-mono leading-relaxed">
                        {previewItem.preview.optimized.content.substring(0, 500)}...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Apply button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-700">
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600/60 dark:text-zinc-400/80 hover:text-slate-900 dark:hover:text-zinc-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApply(previewItem.candidate)}
                  disabled={optimizing === previewItem.candidate.id}
                  className="flex items-center gap-2 px-5 py-2 bg-[#246BFF] text-white rounded-xl text-xs font-bold hover:bg-[#1A5AD6] transition-all disabled:opacity-50"
                >
                  {optimizing === previewItem.candidate.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Apply Optimization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
