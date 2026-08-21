import React, { useState, useEffect } from 'react';
import {
  Target, Link2, FileText, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, ExternalLink, RefreshCw, Trash2, Plus, Edit3,
  BookOpen, ShoppingBag, Briefcase, BarChart3, HelpCircle, Settings, Star, Clipboard,
  Clock, Zap, Shield, Layers, Image, Sparkles
} from 'lucide-react';
import { Redirect, Error404Log } from '../types';
import ContentManager from './ContentManager';
import SeoOptimizerPanel from './SeoOptimizerPanel';
import { proxyImageUrl } from '../utils/safeRender';

interface SeoDashboardProps {
  token: string;
  baseUrl: string;
}

type TabType = 'dashboard' | 'redirects' | '404' | 'keywords' | 'briefs' | 'faqs' | 'reviews' | 'portfolio' | 'services' | 'comparisons' | 'freshness' | 'structured-data' | 'bulk-seo' | 'auto-link' | 'optimizer';

export default function SeoDashboard({ token, baseUrl }: SeoDashboardProps) {
  const [tab, setTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data lists
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [errorLogs, setErrorLogs] = useState<Error404Log[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  // Content freshness state
  const [freshnessData, setFreshnessData] = useState<any[]>([]);
  const [structData, setStructData] = useState<any>(null);
  const [bulkIssues, setBulkIssues] = useState<any>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [bulkRefreshing, setBulkRefreshing] = useState(false);
  const [autoLinkPosts, setAutoLinkPosts] = useState<any[]>([]);
  const [autoLinkResults, setAutoLinkResults] = useState<Record<string, any>>({});
  const [autoLinkAllLoading, setAutoLinkAllLoading] = useState(false);
  const [autoLinkApplying, setAutoLinkApplying] = useState<string | null>(null);

  // Redirect form state
  const [showRedirectForm, setShowRedirectForm] = useState(false);
  const [redirectForm, setRedirectForm] = useState({ source_url: '', target_url: '', redirect_type: '301' });

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const api = (path: string, opts?: RequestInit) => fetch(`${baseUrl}/api/admin/seo${path}`, { ...opts, headers: { ...headers, ...opts?.headers } });

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await api('/dashboard');
      if (res.ok) setStats(await res.json());
      setError('');
    } catch { setError('Failed to load dashboard'); }
    setLoading(false);
  }

  useEffect(() => { loadDashboard(); }, []);

  async function loadList(list: string, setter: any) {
    try {
      const res = await api(`/${list}`);
      if (res.ok) { const body = await res.json(); setter(Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : []); }
    } catch (e) { console.error(e) }
  }

  async function loadFreshness() {
    try {
      const [freshRes, structRes, issueRes] = await Promise.all([
        api('/content-freshness'), api('/structured-data-check'), api('/bulk-seo-issues'),
      ]);
      if (freshRes.ok) setFreshnessData(await freshRes.json());
      if (structRes.ok) setStructData(await structRes.json());
      if (issueRes.ok) setBulkIssues(await issueRes.json());
    } catch (e) { console.error(e) }
  }

  async function loadStructData() {
    try {
      const res = await api('/structured-data-check');
      if (res.ok) setStructData(await res.json());
    } catch (e) { console.error(e) }
  }

  async function loadBulkIssues() {
    try {
      const res = await api('/bulk-seo-issues');
      if (res.ok) setBulkIssues(await res.json());
    } catch (e) { console.error(e) }
  }

  async function refreshPost(postId: string) {
    setRefreshing(postId);
    try {
      const res = await api(`/refresh-content/${postId}`, { method: 'POST' });
      if (res.ok) { alert('Content refreshed successfully!'); loadFreshness(); }
      else { const err = await res.json(); alert('Error: ' + (err.error || 'Unknown')); }
    } catch { alert('Failed to refresh content'); }
    setRefreshing(null);
  }

  async function bulkRefresh() {
    if (!confirm('Refresh all stale posts? This will use AI credits.')) return;
    setBulkRefreshing(true);
    try {
      const res = await api('/bulk-refresh', { method: 'POST', body: JSON.stringify({ maxPosts: 10 }) });
      if (res.ok) { const data = await res.json(); alert(`Refreshed ${data.refreshed} posts. ${data.failed} failed.`); loadFreshness(); }
      else { const err = await res.json(); alert('Error: ' + (err.error || 'Unknown')); }
    } catch { alert('Bulk refresh failed'); }
    setBulkRefreshing(false);
  }

  async function applyBulkFix(fixType: string, postIds: string[]) {
    if (!confirm(`Apply fix "${fixType}" to ${postIds.length} posts?`)) return;
    try {
      const res = await api('/bulk-fix', { method: 'POST', body: JSON.stringify({ fixType, postIds }) });
      if (res.ok) { const data = await res.json(); alert(`Fixed ${data.fixed} posts.`); loadBulkIssues(); loadStructData(); }
      else { const err = await res.json(); alert('Error: ' + (err.error || 'Unknown')); }
    } catch { alert('Bulk fix failed'); }
  }

  async function fixSinglePost(fixType: string, postId: string) {
    try {
      const res = await api('/bulk-fix', { method: 'POST', body: JSON.stringify({ fixType, postIds: [postId] }) });
      if (res.ok) { const data = await res.json(); if (data.fixed > 0) { loadStructData(); } else { alert('Nothing to fix'); } }
      else { const err = await res.json(); alert('Error: ' + (err.error || 'Unknown')); }
    } catch { alert('Fix failed'); }
  }

  function switchTab(t: TabType) {
    setTab(t);
    if (t === 'redirects') loadList('redirects', setRedirects);
    if (t === '404') loadList('404-logs', setErrorLogs);
    if (t === 'keywords') loadList('keywords', setKeywords);
    if (t === 'briefs') loadList('content-briefs', setBriefs);
    if (t === 'faqs') loadList('faqs', setFaqs);
    if (t === 'freshness') loadFreshness();
    if (t === 'structured-data') loadStructData();
    if (t === 'bulk-seo') loadBulkIssues();
    if (t === 'auto-link') loadAutoLinkData();
    if (t === 'optimizer') {}  // SeoOptimizerPanel loads its own data
  }

  async function loadAutoLinkData() {
    try {
      const res = await fetch('/api/admin/posts?limit=1000', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const body = await res.json();
        const posts = body.data || body || [];
        setAutoLinkPosts(posts.filter((p: any) => p.status === 'published' && p.content));
      }
    } catch (e) { console.error(e) }
  }

  // CRUD helpers
  async function deleteItem(list: string, id: string, setter: any) {
    await api(`/${list}/${id}`, { method: 'DELETE' });
    loadList(list, setter);
  }

  const tabs: { key: TabType; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'freshness', label: 'Freshness', icon: Clock },
    { key: 'structured-data', label: 'Schema', icon: Shield },
    { key: 'bulk-seo', label: 'Bulk SEO', icon: Layers },
    { key: 'redirects', label: 'Redirects', icon: Link2 },
    { key: '404', label: '404 Logs', icon: AlertTriangle },
    { key: 'keywords', label: 'Keywords', icon: Target },
    { key: 'briefs', label: 'Briefs', icon: FileText },
    { key: 'faqs', label: 'FAQs', icon: HelpCircle },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { key: 'services', label: 'Services', icon: Settings },
    { key: 'comparisons', label: 'Comparisons', icon: ShoppingBag },
    { key: 'auto-link', label: 'Auto Link', icon: Link2 },
    { key: 'optimizer', label: 'AI Optimizer', icon: Sparkles },
  ];

  const tabBaseStyle = 'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap';
  const tabActiveStyle = 'bg-[#246BFF] text-white shadow-lg shadow-[#246BFF]/25';
  const tabInactiveStyle = 'text-slate-800/60 dark:text-zinc-100/60 hover:text-slate-800 dark:hover:text-zinc-100 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50';

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 sticky top-0 z-10">
        {tabs.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)} className={`${tabBaseStyle} ${tab === t.key ? tabActiveStyle : tabInactiveStyle}`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {loading && <div className="text-center py-12 text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400">Loading dashboard...</div>}
          {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl">{error}</div>}
          {!loading && stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Published Posts', value: stats.totalPublishedPosts, icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Published Pages', value: stats.totalPages, icon: FileText, color: 'text-dw-blue bg-dw-blue/10 dark:bg-blue-900/20' },
                  { label: 'Product Reviews', value: stats.totalProducts, icon: Star, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'Portfolio Projects', value: stats.totalPortfolio, icon: Briefcase, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                  { label: 'Active Redirects', value: stats.totalRedirects, icon: Link2, color: 'text-dw-orange bg-dw-orange/10 dark:bg-orange-900/20' },
                  { label: 'Keywords Tracked', value: stats.totalKeywords, icon: Target, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
                  { label: 'Affiliate Clicks', value: stats.totalAffiliateClicks, icon: TrendingUp, color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20' },
                  { label: '404 Errors', value: stats.total404Errors, icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
                ].map(s => (
                  <div key={s.label} className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl p-5">
                    <div className={`inline-flex p-2.5 rounded-xl ${s.color} mb-3`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-zinc-100 dark:text-white">{s.value}</div>
                    <div className="text-sm text-slate-800/60 dark:text-zinc-100/60 dark:text-zinc-400">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* SEO Health Warnings */}
              <div className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold text-slate-800 dark:text-zinc-100 dark:text-white mb-4">SEO Health</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Posts missing SEO title', count: stats.missingSeoTitles, warn: true },
                    { label: 'Posts missing meta description', count: stats.missingSeoDescriptions, warn: true },
                    { label: 'Posts missing focus keyword', count: stats.missingFocusKeywords, warn: true },
                    { label: 'Posts missing featured image', count: stats.missingFeaturedImages, warn: true },
                    { label: 'Posts outdated (>6 months)', count: stats.outdatedContent, warn: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-200/50 dark:border-zinc-700/50 dark:border-zinc-700/50 last:border-0">
                      <span className="text-sm text-slate-800/70 dark:text-zinc-100/70 dark:text-zinc-300">{item.label}</span>
                      <span className={`text-sm font-semibold ${item.count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                        {item.count > 0 ? <XCircle className="w-4 h-4 inline mr-1" /> : <CheckCircle className="w-4 h-4 inline mr-1" />}
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Redirects Tab */}
      {tab === 'redirects' && (
        <div className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg font-bold text-slate-800 dark:text-zinc-100 dark:text-white">Redirects</h3>
            <button onClick={() => { setShowRedirectForm(true); setRedirectForm({ source_url: '', target_url: '', redirect_type: '301' }); }} className="flex items-center gap-2 px-4 py-2 bg-[#246BFF] text-white rounded-xl text-sm font-medium hover:bg-[#246BFF]/90 transition-all">
              <Plus className="w-4 h-4" /> Add Redirect
            </button>
          </div>
          {/* Add Redirect Form */}
          {showRedirectForm && (
            <div className="mb-6 bg-slate-50 dark:bg-zinc-900 dark:bg-zinc-900/50 rounded-xl p-5 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700">
              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 dark:text-white mb-4">New Redirect</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1">Source URL</label>
                  <input type="text" value={redirectForm.source_url} onChange={e => setRedirectForm(f => ({ ...f, source_url: e.target.value }))} placeholder="/old-page" className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 p-2.5 text-xs bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#246BFF]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1">Target URL</label>
                  <input type="text" value={redirectForm.target_url} onChange={e => setRedirectForm(f => ({ ...f, target_url: e.target.value }))} placeholder="/new-page" className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 p-2.5 text-xs bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#246BFF]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1">Type</label>
                  <select value={redirectForm.redirect_type} onChange={e => setRedirectForm(f => ({ ...f, redirect_type: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 p-2.5 text-xs bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#246BFF]">
                    <option value="301">301 (Permanent)</option>
                    <option value="302">302 (Temporary)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={async () => {
                  if (!redirectForm.source_url || !redirectForm.target_url) return alert('Source and target URLs required');
                  try {
                    const res = await api('/redirects', { method: 'POST', body: JSON.stringify(redirectForm) });
                    if (res.ok) { setShowRedirectForm(false); loadList('redirects', setRedirects); }
                    else { const d = await res.json(); alert(d.error || 'Failed to create'); }
                  } catch { alert('Network error'); }
                }} className="bg-[#246BFF] hover:bg-[#246BFF]/90 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all">Save Redirect</button>
                <button onClick={() => setShowRedirectForm(false)} className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 text-xs font-semibold px-4 py-2 rounded-lg transition-all">Cancel</button>
              </div>
            </div>
          )}

          {redirects.length === 0 ? (
            <p className="text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400 text-center py-8">No redirects configured</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-700 dark:border-zinc-700">
                    <th className="pb-3 font-medium">Source URL</th>
                    <th className="pb-3 font-medium">Target URL</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Hits</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {redirects.map(r => (
                    <tr key={r.id} className="border-b border-slate-200/50 dark:border-zinc-700/50 dark:border-zinc-700/50">
                      <td className="py-3 text-slate-800 dark:text-zinc-100 dark:text-zinc-200 font-mono text-xs">{r.source_url}</td>
                      <td className="py-3 text-slate-800 dark:text-zinc-100 dark:text-zinc-200 font-mono text-xs">{r.target_url}</td>
                      <td className="py-3"><span className="px-2 py-0.5 text-xs rounded-md bg-[#246BFF]/10 text-[#246BFF]">{r.redirect_type || 301}</span></td>
                      <td className="py-3 text-slate-800/60 dark:text-zinc-100/60 dark:text-zinc-400">{r.hit_count || 0}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 dark:hover:bg-zinc-700 text-slate-800/50 dark:text-zinc-100/50 hover:text-[#246BFF]" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteItem('redirects', r.id, setRedirects)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-800/50 dark:text-zinc-100/50 hover:text-red-500" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 404 Logs Tab */}
      {tab === '404' && (
        <div className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display text-lg font-bold text-slate-800 dark:text-zinc-100 dark:text-white">404 Error Logs</h3>
            <button onClick={() => deleteItem('404-logs', 'all', setErrorLogs)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all">
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
          {errorLogs.length === 0 ? (
            <p className="text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400 text-center py-8">No 404 errors logged</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-700 dark:border-zinc-700">
                    <th className="pb-3 font-medium">URL</th>
                    <th className="pb-3 font-medium">Hits</th>
                    <th className="pb-3 font-medium">First Seen</th>
                    <th className="pb-3 font-medium">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {errorLogs.map(e => (
                    <tr key={e.id} className="border-b border-slate-200/50 dark:border-zinc-700/50 dark:border-zinc-700/50">
                      <td className="py-3 text-slate-800 dark:text-zinc-100 dark:text-zinc-200 font-mono text-xs">{e.url}</td>
                      <td className="py-3"><span className="px-2 py-0.5 text-xs rounded-md bg-red-50 dark:bg-red-900/20 text-red-500">{e.hit_count}</span></td>
                      <td className="py-3 text-slate-800/60 dark:text-zinc-100/60 dark:text-zinc-400">{new Date(e.first_seen).toLocaleDateString()}</td>
                      <td className="py-3 text-slate-800/60 dark:text-zinc-100/60 dark:text-zinc-400">{new Date(e.last_seen).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Keywords Tab */}
      {tab === 'keywords' && (
        <ContentManager title="Keywords" apiPath="/api/admin/seo/keywords" token={token}
          fields={[
            { name: 'keyword', label: 'Keyword', type: 'text', required: true, placeholder: 'e.g. affiliate marketing' },
            { name: 'search_volume', label: 'Search Volume', type: 'number', placeholder: '1000' },
            { name: 'difficulty', label: 'Difficulty (1-100)', type: 'number', placeholder: '45' },
            { name: 'intent', label: 'Intent', type: 'select', options: [{value:'informational',label:'Informational'},{value:'commercial',label:'Commercial'},{value:'transactional',label:'Transactional'},{value:'navigational',label:'Navigational'}] },
            { name: 'status', label: 'Status', type: 'select', options: [{value:'active',label:'Active'},{value:'tracking',label:'Tracking'},{value:'completed',label:'Completed'}], required: true },
          ]}
        />
      )}

      {/* Content Briefs Tab */}
      {tab === 'briefs' && (
        <ContentManager title="Content Briefs" apiPath="/api/admin/seo/content-briefs" token={token}
          fields={[
            { name: 'title', label: 'Brief Title', type: 'text', required: true, placeholder: 'How to start affiliate marketing' },
            { name: 'target_keyword', label: 'Target Keyword', type: 'text', placeholder: 'affiliate marketing guide' },
            { name: 'outline', label: 'Outline / Notes', type: 'textarea', placeholder: 'Key points to cover...' },
            { name: 'status', label: 'Status', type: 'select', options: [{value:'draft',label:'Draft'},{value:'active',label:'Active'},{value:'completed',label:'Completed'}], required: true },
          ]}
        />
      )}

      {/* FAQs Tab */}
      {tab === 'faqs' && (
        <ContentManager title="FAQs" apiPath="/api/admin/seo/faqs" token={token}
          fields={[
            { name: 'question', label: 'Question', type: 'text', required: true, placeholder: 'What is...' },
            { name: 'answer', label: 'Answer', type: 'textarea', required: true },
            { name: 'display_order', label: 'Display Order', type: 'number', placeholder: '1' },
            { name: 'status', label: 'Status', type: 'select', options: [{value:'published',label:'Published'},{value:'draft',label:'Draft'}], required: true },
          ]}
        />
      )}

      {/* Product Reviews Tab */}
      {tab === 'reviews' && (
        <ContentManager title="Product Reviews" apiPath="/api/admin/seo/product-reviews" token={token}
          fields={[
            { name: 'productName', label: 'Product Name', type: 'text', required: true, placeholder: 'Product XYZ' },
            { name: 'brand', label: 'Brand', type: 'text', placeholder: 'Brand Name' },
            { name: 'productImage', label: 'Main Image URL', type: 'url', placeholder: 'https://...' },
            { name: 'galleryImages', label: 'Additional Images (one URL per line)', type: 'textarea', placeholder: 'https://...\nhttps://...' },
            { name: 'videoUrl', label: 'Video URL (YouTube or MP4)', type: 'url', placeholder: 'https://youtube.com/watch?v=...' },
            { name: 'affiliateUrl', label: 'Affiliate URL', type: 'url', placeholder: 'https://...' },
            { name: 'price', label: 'Price', type: 'text', placeholder: '$49.99' },
            { name: 'rating', label: 'Rating', type: 'number', placeholder: '4.5' },
            { name: 'bestFor', label: 'Best For', type: 'text', placeholder: 'Beginners, professionals...' },
            { name: 'pros', label: 'Pros (comma separated)', type: 'tags', placeholder: 'Easy to use, Affordable' },
            { name: 'cons', label: 'Cons (comma separated)', type: 'tags', placeholder: 'Limited features, No API' },
            { name: 'keyFeatures', label: 'Key Features (comma separated)', type: 'tags', placeholder: 'Feature A, Feature B' },
            { name: 'ctaText', label: 'CTA Button Text', type: 'text', placeholder: 'Check Price on Amazon' },
            { name: 'reviewSummary', label: 'Review Summary', type: 'textarea' },
            { name: 'finalVerdict', label: 'Final Verdict', type: 'textarea' },
            { name: 'status', label: 'Status', type: 'select', options: [{value:'draft',label:'Draft'},{value:'published',label:'Published'}], required: true },
          ]}
          initialForm={() => ({ rating: 4, ctaText: 'Check Price on Amazon', pros: [], cons: [], keyFeatures: [], status: 'draft', schemaEnabled: true, galleryImages: '' })}
          transformForm={(item) => {
            const specs: any = item.specs || {};
            const gallery: string[] = specs.gallery || [];
            return {
              productName: item.product_name || '',
              brand: item.brand || '',
              productImage: item.product_image || '',
              galleryImages: gallery.filter((u: string) => u !== item.product_image).join('\n'),
              videoUrl: specs.video_url || '',
              affiliateUrl: item.affiliate_url || '',
              price: item.price || '',
              rating: item.rating ?? 4,
              bestFor: item.best_for || '',
              pros: item.pros || [],
              cons: item.cons || [],
              keyFeatures: item.key_features || [],
              ctaText: item.cta_text || 'Check Price on Amazon',
              reviewSummary: item.review_summary || '',
              finalVerdict: item.final_verdict || '',
              status: item.status || 'draft',
              schemaEnabled: item.schema_enabled ?? true,
            };
          }}
          transformPayload={(form) => {
            const mainImage = form.productImage || '';
            const extraImages = (form.galleryImages || '').split('\n').map((s: string) => s.trim()).filter(Boolean);
            const allImages = [mainImage, ...extraImages].filter(Boolean);
            const gallery = allImages.slice(0, 8);
            return {
              product_name: form.productName,
              brand: form.brand,
              product_image: mainImage,
              affiliate_url: form.affiliateUrl,
              price: form.price,
              rating: parseFloat(form.rating) || 0,
              best_for: form.bestFor,
              pros: form.pros || [],
              cons: form.cons || [],
              key_features: form.keyFeatures || [],
              cta_text: form.ctaText || 'Check Price on Amazon',
              review_summary: form.reviewSummary,
              final_verdict: form.finalVerdict,
              slug: form.productName ? form.productName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') || 'product' : undefined,
              status: form.status || 'draft',
              schema_enabled: form.schemaEnabled ?? true,
              specs: (() => {
                const s: Record<string, any> = { gallery };
                if (form.videoUrl) s.video_url = form.videoUrl;
                return s;
              })(),
              gallery,
            };
          }}
          listRender={(item, onEdit, onDelete) => {
            const specs: any = item.specs || {};
            const gallery: string[] = specs.gallery || [];
            const allImgs = [item.product_image, ...gallery].filter(Boolean);
            return (
            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-all">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex -space-x-2 shrink-0">
                  {allImgs.slice(0, 3).map((img, i) => (
                    <img key={i} src={proxyImageUrl(img)} alt="" className={`w-8 h-8 rounded-lg object-cover bg-white border-2 border-white ${i > 0 ? '-ml-2' : ''}`} referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ))}
                  {allImgs.length > 3 && <div className="w-8 h-8 rounded-lg bg-slate-100 border-2 border-white -ml-2 flex items-center justify-center text-[9px] font-bold text-slate-400">+{allImgs.length - 3}</div>}
                  {allImgs.length === 0 && <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[9px] text-slate-300">No img</div>}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{item.product_name || 'Untitled'}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex gap-2">
                    <span className={item.status === 'published' ? 'text-green-500' : 'text-amber-500'}>{item.status || 'draft'}</span>
                    {item.price && <span>{item.price}</span>}
                    {item.rating > 0 && <span>⭐ {item.rating}/5</span>}
                    {item.brand && <span>{item.brand}</span>}
                    {allImgs.length > 1 && <span>🖼️ {allImgs.length}</span>}
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
                <div className="flex gap-1 ml-4">
                  {item.status === 'published' && (
                    <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/products/' + item.id); }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-green-600 transition-all" title="Copy review URL"><Clipboard className="w-3.5 h-3.5" /></button>
                  )}
                  <button
                    onClick={async () => {
                      const btn = document.getElementById(`gen-article-${item.id}`);
                      if (btn) { btn.textContent = 'Generating...'; (btn as HTMLButtonElement).disabled = true; }
                      try {
                        const res = await fetch(`/api/admin/seo/product-reviews/generate-article/${item.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                        const data = await res.json();
                        if (res.ok) {
                          alert(`✅ Article generated!\n\nTitle: ${data.post.title}\nSlug: ${data.post.slug}\nSimilar products matched: ${data.similarCount}\n\nIt's saved as a draft in the editor.`);
                        } else {
                          alert('❌ ' + (data.error || 'Generation failed'));
                        }
                      } catch (e: any) { alert('❌ ' + e.message); }
                      if (btn) { btn.textContent = 'Gen Article'; (btn as HTMLButtonElement).disabled = false; }
                    }}
                    className="p-1.5 hover:bg-dw-blue/10 rounded-lg text-slate-400 hover:text-dw-blue transition-all text-[10px] font-bold flex items-center gap-1"
                    title="Generate full article with AI"
                    id={`gen-article-${item.id}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Gen Article
                  </button>
                  <button onClick={() => onEdit(item)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#246BFF] transition-all" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>
            );
          }}
        />
      )}

      {/* Portfolio Tab */}
      {tab === 'portfolio' && (
        <ContentManager title="Portfolio Projects" apiPath="/api/admin/seo/portfolio" token={token}
          fields={[
            { name: 'title', label: 'Project Title', type: 'text', required: true, placeholder: 'Project Name' },
            { name: 'client', label: 'Client', type: 'text', placeholder: 'Client Name' },
            { name: 'industry', label: 'Industry', type: 'text', placeholder: 'Technology' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'projectUrl', label: 'Project URL', type: 'url', placeholder: 'https://...' },
            { name: 'imageUrl', label: 'Image URL', type: 'url', placeholder: 'https://...' },
            { name: 'technologies', label: 'Technologies (comma separated)', type: 'tags', placeholder: 'React, Node.js' },
            { name: 'status', label: 'Status', type: 'select', options: [{value:'draft',label:'Draft'},{value:'published',label:'Published'}], required: true },
          ]}
          initialForm={() => ({ status: 'draft', technologies: [] })}
          transformForm={(item) => ({
            title: item.title || '',
            client: item.client || '',
            industry: item.industry || '',
            description: item.short_description || '',
            projectUrl: item.website_url || '',
            imageUrl: item.image || '',
            technologies: item.tools_used || [],
            status: item.status || 'draft',
          })}
          transformPayload={(form) => ({
            title: form.title,
            client: form.client,
            industry: form.industry,
            short_description: form.description,
            website_url: form.projectUrl,
            image: form.imageUrl,
            tools_used: form.technologies || [],
            status: form.status || 'draft',
          })}
        />
      )}

      {/* Services Tab */}
      {tab === 'services' && (
        <ContentManager title="Services" apiPath="/api/admin/seo/services" token={token}
          fields={[
            { name: 'title', label: 'Service Title', type: 'text', required: true, placeholder: 'Consulting Service' },
            { name: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'consulting-service' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'icon', label: 'Icon Name', type: 'text', placeholder: 'Laptop' },
            { name: 'features', label: 'What\'s Included (comma separated)', type: 'tags', placeholder: 'Feature 1, Feature 2' },
            { name: 'status', label: 'Status', type: 'select', options: [{value:'draft',label:'Draft'},{value:'published',label:'Published'}], required: true },
          ]}
          initialForm={() => ({ status: 'draft', features: [] })}
          transformForm={(item) => ({
            title: item.title || '',
            slug: item.slug || '',
            description: item.overview || '',
            icon: item.icon || '',
            features: item.includes || [],
            status: item.status || 'draft',
          })}
          transformPayload={(form) => ({
            title: form.title,
            slug: form.slug,
            overview: form.description,
            icon: form.icon,
            includes: form.features || [],
            status: form.status || 'draft',
          })}
        />
      )}

      {/* Comparisons Tab */}
      {tab === 'comparisons' && (
        <ContentManager title="Comparison Tables" apiPath="/api/admin/seo/comparison-tables" token={token}
          fields={[
            { name: 'title', label: 'Table Title', type: 'text', required: true, placeholder: 'Product A vs Product B' },
            { name: 'status', label: 'Status', type: 'select', options: [{value:'draft',label:'Draft'},{value:'published',label:'Published'}], required: true },
          ]}
          initialForm={() => ({ status: 'draft' })}
          transformForm={(item) => ({
            title: item.title || '',
            status: item.status || 'draft',
          })}
          transformPayload={(form) => ({
            title: form.title,
            status: form.status || 'draft',
          })}
        />
      )}

      {/* Content Freshness Tab */}
      {tab === 'freshness' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-800 dark:text-zinc-100 dark:text-white">Content Freshness</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-zinc-400 dark:text-zinc-400">
                {freshnessData.length > 0 && `${freshnessData.filter((p: any) => p.isStale).length} stale of ${freshnessData.length} published`}
              </span>
              <button onClick={bulkRefresh} disabled={bulkRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-[#246BFF] text-white rounded-xl text-xs font-bold hover:bg-[#1A5AD6] transition-all disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${bulkRefreshing ? 'animate-spin' : ''}`} />
                {bulkRefreshing ? 'Refreshing...' : 'Bulk Refresh Stale'}
              </button>
            </div>
          </div>

          {/* Age distribution summary */}
          {freshnessData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '≤ 30 days', count: freshnessData.filter((p: any) => p.ageDays <= 30).length, color: 'bg-green-500' },
                { label: '31-90 days', count: freshnessData.filter((p: any) => p.ageDays > 30 && p.ageDays <= 90).length, color: 'bg-blue-500' },
                { label: '91-180 days', count: freshnessData.filter((p: any) => p.ageDays > 90 && p.ageDays <= 180).length, color: 'bg-amber-500' },
                { label: '>180 days (stale)', count: freshnessData.filter((p: any) => p.ageDays > 180).length, color: 'bg-red-500' },
              ].map(b => (
                <div key={b.label} className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl p-4 text-center">
                  <div className={`w-3 h-3 rounded-full ${b.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-slate-800 dark:text-zinc-100 dark:text-white">{b.count}</p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 dark:text-zinc-400 font-medium uppercase tracking-wider">{b.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Posts table */}
          <div className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-700 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 dark:bg-zinc-900/50">
                    <th className="p-3 font-medium">Title</th>
                    <th className="p-3 font-medium">Age</th>
                    <th className="p-3 font-medium">Words</th>
                    <th className="p-3 font-medium">SEO</th>
                    <th className="p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {freshnessData.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400">No data</td></tr>
                  )}
                  {freshnessData.map((p: any) => (
                    <tr key={p.id} className={`border-b border-slate-200/50 dark:border-zinc-700/50 dark:border-zinc-700/50 ${p.isStale ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}>
                      <td className="p-3">
                        <a href={`/post/${p.slug}`} target="_blank" className="text-slate-800 dark:text-zinc-100 dark:text-zinc-200 font-medium hover:text-[#246BFF] text-xs line-clamp-1">
                          {p.title}
                        </a>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.ageDays > 180 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                          p.ageDays > 90 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                          'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                          {p.ageDays}d
                        </span>
                      </td>
                      <td className="p-3 text-slate-800/60 dark:text-zinc-100/60 dark:text-zinc-400 text-xs">{p.wordCount?.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          {!p.hasSeoTitle && <span className="text-[8px] bg-red-100 dark:bg-red-900/30 text-red-500 px-1.5 py-0.5 rounded font-bold" title="Missing SEO Title">T</span>}
                          {!p.hasSeoDescription && <span className="text-[8px] bg-red-100 dark:bg-red-900/30 text-red-500 px-1.5 py-0.5 rounded font-bold" title="Missing Meta Description">D</span>}
                          {!p.hasFeaturedImage && <span className="text-[8px] bg-amber-100 dark:bg-amber-900/30 text-amber-500 px-1.5 py-0.5 rounded font-bold" title="No Featured Image">I</span>}
                          {p.hasSeoTitle && p.hasSeoDescription && <span className="text-[8px] bg-green-100 dark:bg-green-900/30 text-green-500 px-1.5 py-0.5 rounded font-bold">OK</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        {p.isStale && (
                          <button onClick={() => refreshPost(p.id)} disabled={refreshing === p.id}
                            className="flex items-center gap-1 text-[10px] font-bold text-[#246BFF] hover:text-[#1A5AD6] transition-all disabled:opacity-50">
                            <RefreshCw className={`w-3 h-3 ${refreshing === p.id ? 'animate-spin' : ''}`} />
                            {refreshing === p.id ? 'Refreshing...' : 'AI Refresh'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Structured Data Check Tab */}
      {tab === 'structured-data' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-800 dark:text-zinc-100 dark:text-white">Structured Data Coverage</h3>
            {structData && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-zinc-400 dark:text-zinc-400">Avg Score:</span>
                <span className={`text-lg font-bold ${structData.averageScore >= 70 ? 'text-green-500' : structData.averageScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                  {structData.averageScore}%
                </span>
                <button onClick={loadStructData} className="text-[10px] font-bold text-[#246BFF] hover:text-[#1A5AD6] transition-all" aria-label="Refresh schema data">
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Refresh
                </button>
              </div>
            )}
          </div>

          {/* Summary cards */}
          {structData?.posts?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Missing H1', count: structData.posts.filter((p: any) => !p.checks.hasH1).length, color: 'bg-red-500' },
                { label: 'No H2 Headings', count: structData.posts.filter((p: any) => !p.checks.hasH2).length, color: 'bg-amber-500' },
                { label: 'Missing FAQ Schema', count: structData.posts.filter((p: any) => !p.checks.hasFaqSchema).length, color: 'bg-amber-500' },
                { label: 'No Meta Description', count: structData.posts.filter((p: any) => !p.checks.hasMetaDescription).length, color: 'bg-red-500' },
                { label: 'No Featured Image', count: structData.posts.filter((p: any) => !p.checks.hasFeaturedImage).length, color: 'bg-amber-500' },
                { label: 'Passing (≥70%)', count: structData.posts.filter((p: any) => p.score >= 70).length, color: 'bg-green-500' },
              ].map(card => (
                <div key={card.label} className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-slate-800 dark:text-zinc-100 dark:text-white">{card.count}</p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 dark:text-zinc-400 font-medium uppercase tracking-wider">{card.label}</p>
                </div>
              ))}
            </div>
          )}

          {structData?.posts?.length > 0 && (
            <div className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-700 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 dark:bg-zinc-900/50">
                      <th className="p-3 font-medium">Post</th>
                      <th className="p-3 font-medium">Score</th>
                      <th className="p-3 font-medium">H1</th>
                      <th className="p-3 font-medium">H2</th>
                      <th className="p-3 font-medium">FAQ</th>
                      <th className="p-3 font-medium">Meta</th>
                      <th className="p-3 font-medium">Image</th>
                      <th className="p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structData.posts.map((p: any) => {
                      const missingMeta = !p.checks.hasMetaDescription;
                      const missingSeoTitle = !p.checks.hasHowToSchema;
                      return (
                      <tr key={p.id} className={`border-b border-slate-200/50 dark:border-zinc-700/50 dark:border-zinc-700/50 ${p.score < 40 ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                        <td className="p-3 max-w-[200px]">
                          <a href={`/post/${p.slug}`} target="_blank" className="text-slate-800 dark:text-zinc-100 dark:text-zinc-200 hover:text-[#246BFF] text-xs font-medium line-clamp-1 block">{p.title}</a>
                          <a href={`/api/admin/posts/${p.id}`} target="_blank" className="text-[9px] text-slate-500 dark:text-zinc-400 dark:text-zinc-500 hover:text-[#246BFF]" rel="noopener noreferrer">Edit &nearr;</a>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.score >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                            p.score >= 40 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
                            'bg-red-100 dark:bg-red-900/30 text-red-600'
                          }`}>{p.score}%</span>
                        </td>
                        <td className="p-3">{p.checks.hasH1 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span title="No H1 heading found"><XCircle className="w-4 h-4 text-red-500" /></span>}</td>
                        <td className="p-3">{p.checks.hasH2 ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span title="No H2 headings"><XCircle className="w-4 h-4 text-amber-500" /></span>}</td>
                        <td className="p-3">{p.checks.hasFaqSchema ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span title="Missing FAQPage schema"><XCircle className="w-4 h-4 text-amber-500" /></span>}</td>
                        <td className="p-3">{p.checks.hasMetaDescription ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span title="Missing meta description"><XCircle className="w-4 h-4 text-red-500" /></span>}</td>
                        <td className="p-3">{p.checks.hasFeaturedImage ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span title="No featured image"><XCircle className="w-4 h-4 text-amber-500" /></span>}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            {missingMeta && (
                              <button
                                onClick={() => fixSinglePost('missingMetaDescription', p.id)}
                                className="text-[9px] font-bold text-[#246BFF] bg-[#246BFF]/5 px-2 py-1 rounded-lg hover:bg-[#246BFF]/10 transition-all whitespace-nowrap"
                                aria-label={`Fix meta description for ${p.title}`}
                              >
                                Fix Meta
                              </button>
                            )}
                            {missingSeoTitle && (
                              <button
                                onClick={() => fixSinglePost('missingSeoTitle', p.id)}
                                className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg hover:bg-amber-100 transition-all whitespace-nowrap"
                                aria-label={`Fix SEO title for ${p.title}`}
                              >
                                Fix Title
                              </button>
                            )}
                            {p.checks.hasH1 && p.checks.hasMetaDescription && p.checks.hasFeaturedImage && p.checks.hasFaqSchema && (
                              <span className="text-[9px] text-green-500 font-medium">OK</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk SEO Tab */}
      {tab === 'bulk-seo' && bulkIssues && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-slate-800 dark:text-zinc-100 dark:text-white">Bulk SEO Corrections</h3>
            {bulkIssues && (
              <span className="text-xs text-slate-500 dark:text-zinc-400 dark:text-zinc-400">
                {Object.values(bulkIssues as Record<string, any[]>).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)} total issues
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'missingMetaDescription', label: 'Missing Meta Description', count: bulkIssues.missingMetaDescription?.length || 0, color: 'red' },
              { key: 'missingSeoTitle', label: 'Missing SEO Title', count: bulkIssues.missingSeoTitle?.length || 0, color: 'red' },
              { key: 'missingFeaturedImage', label: 'No Featured Image', count: bulkIssues.missingFeaturedImage?.length || 0, color: 'amber' },
              { key: 'missingExcerpt', label: 'Missing Excerpt', count: bulkIssues.missingExcerpt?.length || 0, color: 'amber' },
              { key: 'shortContent', label: 'Short Content (<300 words)', count: bulkIssues.shortContent?.length || 0, color: 'amber' },
              { key: 'noHeadings', label: 'No Headings', count: bulkIssues.noHeadings?.length || 0, color: 'red' },
            ].map(card => (
              <div key={card.key} className={`bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl p-4 ${card.count > 0 ? 'border-l-4 border-l-' + card.color + '-500' : ''}`}>
                <p className="text-2xl font-bold text-slate-800 dark:text-zinc-100 dark:text-white">{card.count}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 dark:text-zinc-400 font-medium">{card.label}</p>
                {(card.key === 'missingMetaDescription' || card.key === 'missingSeoTitle' || card.key === 'missingExcerpt') && card.count > 0 && (
                  <button
                    onClick={() => applyBulkFix(card.key, bulkIssues[card.key].map((p: any) => p.id))}
                    className="mt-3 text-[10px] font-bold text-[#246BFF] hover:text-[#1A5AD6] transition-all"
                  >
                    Auto-fix all ({card.count}) &rarr;
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Issue detail sections */}
          {[
            { key: 'missingMetaDescription', label: 'Missing Meta Description', icon: FileText, desc: 'Posts without a meta description. Auto-fix will use excerpt or first paragraph.' },
            { key: 'missingSeoTitle', label: 'Missing SEO Title', icon: FileText, desc: 'Posts without an SEO title. Auto-fix will use the post title.' },
            { key: 'missingFeaturedImage', label: 'No Featured Image', icon: Image, desc: 'Posts without a featured image. Manual upload required.' },
            { key: 'missingExcerpt', label: 'Missing Excerpt', icon: FileText, desc: 'Posts without an excerpt. Auto-fix will use the first paragraph.' },
            { key: 'shortContent', label: 'Short Content', icon: FileText, desc: 'Posts with fewer than 300 words of content.' },
            { key: 'noHeadings', label: 'No Headings Found', icon: FileText, desc: 'Posts without any H1/H2/H3 headings in content.' },
          ].map(section => {
            const items = bulkIssues[section.key] || [];
            if (items.length === 0) return null;
            return (
              <div key={section.key} className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-200/50 dark:border-zinc-700/50 dark:border-zinc-700/50 bg-slate-50/30 dark:bg-zinc-900/30 dark:bg-zinc-900/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100 dark:text-white">{section.label} ({items.length})</h4>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 dark:text-zinc-400 mt-0.5">{section.desc}</p>
                    </div>
                    {(section.key === 'missingMetaDescription' || section.key === 'missingSeoTitle' || section.key === 'missingExcerpt') && (
                      <button
                        onClick={() => applyBulkFix(section.key, items.map((p: any) => p.id))}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#246BFF] hover:text-[#1A5AD6] transition-all px-3 py-1.5 rounded-lg bg-[#246BFF]/5 hover:bg-[#246BFF]/10"
                      >
                        <Zap className="w-3 h-3" /> Auto-fix all
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400 border-b border-slate-200/50 dark:border-zinc-700/50 dark:border-zinc-700/50 text-[10px] uppercase tracking-wider">
                        <th className="p-3 font-medium">Post</th>
                        <th className="p-3 font-medium">Slug</th>
                        {section.key === 'shortContent' && <th className="p-3 font-medium">Words</th>}
                        <th className="p-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p: any) => (
                        <tr key={p.id} className="border-b border-slate-200/30 dark:border-zinc-700/30 dark:border-zinc-700/30 last:border-0 hover:bg-slate-50/30 dark:hover:bg-zinc-900/30 dark:hover:bg-zinc-900/30 transition-all">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${section.key === 'missingMetaDescription' || section.key === 'missingSeoTitle' || section.key === 'noHeadings' ? 'bg-red-400' : 'bg-amber-400'}`} />
                              <span className="text-xs text-slate-800 dark:text-zinc-100 dark:text-zinc-200 font-medium line-clamp-1">{p.title}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <a href={`/post/${p.slug}`} target="_blank" className="text-[10px] text-slate-500 dark:text-zinc-400 dark:text-zinc-500 hover:text-[#246BFF] font-mono" rel="noopener noreferrer">
                              /{p.slug} <ExternalLink className="w-2.5 h-2.5 inline ml-0.5" />
                            </a>
                          </td>
                          {section.key === 'shortContent' && (
                            <td className="p-3">
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{p.wordCount}w</span>
                            </td>
                          )}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {(section.key === 'missingMetaDescription' || section.key === 'missingSeoTitle' || section.key === 'missingExcerpt') && (
                                <button
                                  onClick={() => fixSinglePost(section.key, p.id)}
                                  className="text-[9px] font-bold text-[#246BFF] bg-[#246BFF]/5 px-2 py-1 rounded-lg hover:bg-[#246BFF]/10 transition-all"
                                >
                                  Fix
                                </button>
                              )}
                              <a
                                href={`/api/admin/posts/${p.id}`}
                                target="_blank"
                                className="text-[9px] text-slate-500 dark:text-zinc-400 dark:text-zinc-500 hover:text-[#246BFF] px-2 py-1"
                                rel="noopener noreferrer"
                              >
                                Edit
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto Link Tab */}
      {tab === 'auto-link' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-slate-800 dark:text-zinc-100 dark:text-white">Auto Internal Linking</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 dark:text-zinc-400 mt-0.5">Scan content and automatically inject internal links to related posts</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-zinc-400 dark:text-zinc-400">{autoLinkPosts.length} published posts</span>
              <button
                onClick={async () => {
                  setAutoLinkAllLoading(true);
                  try {
                    const res = await fetch('/api/admin/seo/auto-link-all', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                      const data = await res.json();
                      alert(`Applied ${data.totalLinksApplied} links across ${data.postsWithLinks} posts`);
                      loadAutoLinkData();
                    }
                  } catch { alert('Failed to process'); }
                  setAutoLinkAllLoading(false);
                }}
                disabled={autoLinkAllLoading || autoLinkPosts.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#246BFF] text-white rounded-xl text-xs font-bold hover:bg-[#1A5AD6] transition-all disabled:opacity-50"
                aria-label="Apply auto-links to all published posts"
              >
                <Zap className="w-4 h-4" />
                {autoLinkAllLoading ? 'Processing...' : `Auto-Link All (${autoLinkPosts.length})`}
              </button>
            </div>
          </div>

          {autoLinkPosts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-500 dark:text-zinc-400 dark:text-zinc-400">No published posts with content found.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 dark:border-zinc-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-800/50 dark:text-zinc-100/50 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-700 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900/50 dark:bg-zinc-900/50">
                      <th className="p-3 font-medium">Post</th>
                      <th className="p-3 font-medium">Suggestions</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {autoLinkPosts.map(p => {
                      const result = autoLinkResults[p.id];
                      return (
                        <tr key={p.id} className="border-b border-slate-200/50 dark:border-zinc-700/50 dark:border-zinc-700/50 hover:bg-slate-50/30 dark:hover:bg-zinc-900/30 dark:hover:bg-zinc-900/30 transition-all">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-800 dark:text-zinc-100 dark:text-zinc-200 font-medium line-clamp-1">{p.title}</span>
                              <a href={`/post/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-zinc-400 hover:text-[#246BFF] shrink-0">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </td>
                          <td className="p-3">
                            {result ? (
                              <span className={`text-[10px] font-bold ${result.totalSuggestions > 0 ? 'text-green-600' : 'text-slate-400'}`}>
                                {result.totalSuggestions} link{result.totalSuggestions !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 dark:text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={async () => {
                                  const res = await fetch(`/api/admin/seo/auto-link/${p.id}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (res.ok) {
                                    const data = await res.json();
                                    setAutoLinkResults(prev => ({ ...prev, [p.id]: data }));
                                    if (data.totalSuggestions > 0) {
                                      alert(data.suggestions.map((s: any) => `→ ${s.targetTitle}`).join('\n'));
                                    } else {
                                      alert('No link suggestions found for this post.');
                                    }
                                  }
                                }}
                                className="text-[9px] font-bold text-[#246BFF] hover:text-[#1A5AD6] transition-all px-2 py-1 rounded-lg bg-[#246BFF]/5 hover:bg-[#246BFF]/10"
                                aria-label={`Preview links for ${p.title}`}
                              >
                                Preview
                              </button>
                              <button
                                onClick={async () => {
                                  setAutoLinkApplying(p.id);
                                  try {
                                    const res = await fetch(`/api/admin/seo/auto-link/${p.id}/apply`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      alert(`Applied ${data.applied} link${data.applied !== 1 ? 's' : ''}`);
                                      setAutoLinkResults(prev => ({ ...prev, [p.id]: { ...prev[p.id], totalSuggestions: 0 } }));
                                    }
                                  } catch { alert('Failed to apply'); }
                                  setAutoLinkApplying(null);
                                }}
                                disabled={autoLinkApplying === p.id}
                                className="text-[9px] font-bold text-green-600 hover:text-green-700 transition-all px-2 py-1 rounded-lg bg-green-50 hover:bg-green-100 disabled:opacity-50"
                                aria-label={`Apply links for ${p.title}`}
                              >
                                {autoLinkApplying === p.id ? '...' : 'Apply'}
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
          )}
        </div>
      )}

      {/* AI Optimizer Tab */}
      {tab === 'optimizer' && (
        <SeoOptimizerPanel token={token} baseUrl={baseUrl} />
      )}
    </div>
  );
}
