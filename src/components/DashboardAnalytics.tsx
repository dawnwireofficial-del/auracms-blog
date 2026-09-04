import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Eye, MousePointerClick, Globe, ExternalLink, FileText, MessageSquare, Mail, BookOpen, AlertTriangle, CalendarDays, RefreshCw, Download, Search, ArrowUpDown, DollarSign, Activity, Clock, Zap, ShoppingBag } from 'lucide-react';

interface DailyView {
  date: string;
  views: number;
  visitors: number;
}

interface TopPage {
  path: string;
  views: number;
  visitors: number;
}

interface TopReferrer {
  referrer: string;
  count: number;
}

interface TopLink {
  title: string;
  clicks: number;
  url: string;
}

interface TrafficData {
  dailyViews: DailyView[];
  totalViews: number;
  totalVisitors: number;
  topPages: TopPage[];
  topReferrers: TopReferrer[];
  avgTimeOnPage: number;
}

interface ClickData {
  totalClicks: number;
  todayClicks: number;
  dailyClicks: { date: string; clicks: number }[];
  byPlacement: { placement: string; clicks: number }[];
  topLinks: TopLink[];
  botClicks?: number;
  todayBotClicks?: number;
}

// Human vs bot/test traffic note — every click is classified at log time, so
// the "Affiliate Clicks" cards show REAL human clicks only.
function botNote(clicks: ClickData | null): string | undefined {
  const humans = clicks?.todayClicks || 0;
  const bots = clicks?.todayBotClicks || 0;
  if (humans === 0 && bots === 0) return undefined;
  return bots > 0 ? `${humans} human · ${bots} bot/test filtered today` : `${humans} human today`;
}

interface EngagementData {
  totalComments: number;
  totalSubscribers: number;
  totalPosts: number;
  postsWithNoViews: number;
}

interface ContentPerformanceItem {
  title: string;
  slug: string;
  views: number;
  visitors: number;
  lastViewed: string | null;
}

interface ContentPerformanceData {
  posts: ContentPerformanceItem[];
  totalPosts: number;
}

interface RecentActivityData {
  pageViews: { path: string; time: string; sessionId: string }[];
  comments: { text: string; author: string; time: string }[];
  subscriptions: { email: string; time: string }[];
  messages: { name: string; subject: string; time: string }[];
}

const COLORS = ['#246BFF', '#f97316', '#10b981', '#FF8A00', '#ec4899', '#14b8a6', '#f59e0b', '#0A1F44'];

type SortField = 'title' | 'views' | 'visitors' | 'lastViewed';
type SortDir = 'asc' | 'desc';

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function useAnalytics(token: string) {
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [clicks, setClicks] = useState<ClickData | null>(null);
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [contentPerf, setContentPerf] = useState<ContentPerformanceData | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityData | null>(null);
  const [productAnalytics, setProductAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  useEffect(() => { loadAll(); }, [days]);

  async function loadAll() {
    setLoading(true);
    setError('');
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('dawnwire_auth_token') : '') || '';
    const headers: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    try {
      const [trafficRes, clicksRes, engagementRes, perfRes, actRes, productRes] = await Promise.all([
        fetch(`/api/admin/analytics/traffic?days=${days}`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/analytics/clicks?days=${days}`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/analytics/engagement?days=${days}`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/analytics/content-performance?days=${days}`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/analytics/recent-activity?days=7`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/analytics/products?days=${days}`, { headers }).then(r => r.ok ? r.json() : null),
      ]);
      setTraffic(trafficRes || { totalViews: 0, totalVisitors: 0, dailyViews: [] });
      setClicks(clicksRes || { totalClicks: 0, todayClicks: 0, dailyClicks: [], byPlacement: [], topLinks: [], botClicks: 0, todayBotClicks: 0 });
      setEngagement(engagementRes || null);
      setContentPerf(perfRes || { totalPosts: 0, totalViews: 0, totalVisitors: 0, posts: [] });
      setRecentActivity(actRes || { pageViews: [], comments: [], subscriptions: [], messages: [] });
      setProductAnalytics(productRes || null);
    } catch {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }

  return { traffic, clicks, engagement, contentPerf, recentActivity, productAnalytics, loading, error, days, setDays, reload: loadAll };
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <motion.div
      className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 p-5 shadow-sm"
      whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        {sub && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">{sub}</span>
        )}
      </div>
      <div className="mt-3">
        <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium block">{label}</span>
        <span className="text-2xl font-display font-bold text-slate-800 dark:text-zinc-100 mt-1 block">{value}</span>
      </div>
    </motion.div>
  );
}

function SectionHeader({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: string }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-800/40 dark:to-zinc-800/10 border-b border-gray-100 dark:border-zinc-700 rounded-t-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-[#246BFF]">{icon}</div>
      <h3 className="font-display font-bold text-sm text-slate-800 dark:text-zinc-100">{title}</h3>
      {badge && (
        <span className="ml-auto text-[10px] font-semibold bg-[#246BFF]/10 text-[#246BFF] dark:bg-[#246BFF]/20 dark:text-blue-300 px-2 py-0.5 rounded-full">{badge}</span>
      )}
    </motion.div>
  );
}

export default function DashboardAnalytics({ token }: { token: string }) {
  const { traffic, clicks, engagement, contentPerf, recentActivity, productAnalytics, loading, error, days, setDays, reload } = useAnalytics(token);

  const [perfSearch, setPerfSearch] = useState('');
  const [perfSort, setPerfSort] = useState<SortField>('views');
  const [perfDir, setPerfDir] = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (perfSort === field) setPerfDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setPerfSort(field); setPerfDir('desc'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 text-[#246BFF] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl text-center">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-red-800 dark:text-red-300">{error}</h3>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">Make sure you are logged in as an admin.</p>
        <button onClick={reload} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors">
          Retry
        </button>
      </div>
    );
  }

  const posts = contentPerf?.posts || [];
  const filteredPosts = posts
    .filter(p => p.title.toLowerCase().includes(perfSearch.toLowerCase()) || p.slug.toLowerCase().includes(perfSearch.toLowerCase()))
    .sort((a, b) => {
      let aVal: any = (a as any)[perfSort];
      let bVal: any = (b as any)[perfSort];
      if (perfSort === 'lastViewed') {
        aVal = a.lastViewed ? new Date(a.lastViewed).getTime() : 0;
        bVal = b.lastViewed ? new Date(b.lastViewed).getTime() : 0;
      }
      if (aVal < bVal) return perfDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return perfDir === 'asc' ? 1 : -1;
      return 0;
    });

  const estimatedRevenue = (clicks?.totalClicks || 0) * 0.35;
  const estimatedCommissions = estimatedRevenue.toFixed(2);
  const revenuePerLink = clicks?.topLinks && clicks.topLinks.length > 0
    ? clicks.topLinks.reduce((s, l) => s + l.clicks * 0.35, 0).toFixed(2)
    : '0.00';

  const activityItems: { icon: React.ReactNode; text: string; time: string; color: string }[] = [];
  if (recentActivity && typeof recentActivity === 'object' && !(recentActivity as any).error) {
    const pageViews = Array.isArray((recentActivity as any).pageViews) ? (recentActivity as any).pageViews : [];
    const comments = Array.isArray((recentActivity as any).comments) ? (recentActivity as any).comments : [];
    const subscriptions = Array.isArray((recentActivity as any).subscriptions) ? (recentActivity as any).subscriptions : [];
    const messages = Array.isArray((recentActivity as any).messages) ? (recentActivity as any).messages : [];

    for (const v of pageViews.slice(0, 8)) {
      activityItems.push({ icon: <Eye className="h-3 w-3" />, text: `Page view: ${v.path}`, time: v.time, color: 'text-blue-500' });
    }
    for (const c of comments.slice(0, 5)) {
      activityItems.push({ icon: <MessageSquare className="h-3 w-3" />, text: `Comment by ${c.author}`, time: c.time, color: 'text-emerald-500' });
    }
    for (const s of subscriptions.slice(0, 5)) {
      activityItems.push({ icon: <Mail className="h-3 w-3" />, text: `New subscriber: ${s.email}`, time: s.time, color: 'text-dw-blue' });
    }
    for (const m of messages.slice(0, 5)) {
      activityItems.push({ icon: <MessageSquare className="h-3 w-3" />, text: `Contact: ${m.name} - ${m.subject}`, time: m.time, color: 'text-amber-500' });
    }
  }
  activityItems.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const seoHealthScore = engagement
    ? Math.round(((engagement.totalPosts - engagement.postsWithNoViews) / Math.max(engagement.totalPosts, 1)) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-zinc-100">Analytics Dashboard</h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Real-time traffic, engagement, and performance data</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const rows = [
                ['Metric', 'Value'],
                ['Total Views', String(traffic?.totalViews || 0)],
                ['Unique Visitors', String(traffic?.totalVisitors || 0)],
                ['Affiliate Clicks (period)', String(clicks?.totalClicks || 0)],
                ['Affiliate Clicks (today)', String(clicks?.todayClicks || 0)],
                ['Comments', String(engagement?.totalComments || 0)],
                ['Subscribers', String(engagement?.totalSubscribers || 0)],
                ['Published Posts', String(engagement?.totalPosts || 0)],
                ['Posts w/o Views', String(engagement?.postsWithNoViews || 0)],
                ['Period (days)', String(days)],
              ];
              downloadCSV(`dawnwire-analytics-${days}d.csv`, rows);
            }}
            className="bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-600 dark:text-zinc-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">Period:</span>
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                days === d
                  ? 'bg-[#246BFF] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-600'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* tf-section-4: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="Total Views"
          value={(traffic?.totalViews || 0).toLocaleString()}
          sub={traffic?.dailyViews?.length ? `+${traffic.dailyViews[traffic.dailyViews.length - 1]?.views || 0} today` : undefined}
          color="bg-blue-50 dark:bg-blue-900/30 text-[#246BFF]"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Unique Visitors"
          value={(traffic?.totalVisitors || 0).toLocaleString()}
          color="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"
        />
        <StatCard
          icon={<MousePointerClick className="h-5 w-5" />}
          label="Affiliate Clicks (human)"
          value={(clicks?.totalClicks || 0).toLocaleString()}
          sub={(clicks && (clicks.todayClicks > 0 || (clicks.todayBotClicks || 0) > 0))
            ? botNote(clicks)
            : 'No human clicks yet'}
          color="bg-amber-50 dark:bg-amber-900/30 text-amber-600"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Engagement"
          value={`${(engagement?.totalComments || 0) + (engagement?.totalSubscribers || 0)}`}
          sub={`${engagement?.totalComments || 0} comments, ${engagement?.totalSubscribers || 0} subs`}
          color="bg-dw-blue/10 dark:bg-blue-900/30 text-dw-blue"
        />
      </div>

      {/* tf-section-3: Traffic Chart + Revenue + SEO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          className="lg:col-span-2 bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <SectionHeader icon={<TrendingUp className="h-4 w-4" />} title="Traffic Overview" />
          <div className="p-5">
            {traffic?.dailyViews && traffic.dailyViews.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={traffic.dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="views" stroke="#246BFF" strokeWidth={2} dot={false} name="Views" />
                  <Line type="monotone" dataKey="visitors" stroke="#10b981" strokeWidth={2} dot={false} name="Visitors" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-sm">No traffic data yet.</div>
            )}
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Revenue Tracker */}
          <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
            <SectionHeader icon={<DollarSign className="h-4 w-4" />} title="Revenue Tracker (est.)" />
            <div className="p-5 space-y-4">
              <div className="text-center">
                <span className="text-xs text-slate-400 dark:text-zinc-500 block">Estimated Affiliate Earnings</span>
                <span className="text-4xl font-display font-bold text-slate-800 dark:text-zinc-100">${estimatedRevenue.toFixed(2)}</span>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Based on avg $0.35/click</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-zinc-700/50">
                <div className="text-center">
                  <span className="text-xs text-slate-400 dark:text-zinc-500 block">Total Clicks</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">{clicks?.totalClicks || 0}</span>
                </div>
                <div className="text-center">
                  <span className="text-xs text-slate-400 dark:text-zinc-500 block">Est./Link</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">${revenuePerLink}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Health */}
          <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
            <SectionHeader icon={<Activity className="h-4 w-4" />} title="SEO Health Score" />
            <div className="p-5 text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke={
                    seoHealthScore >= 80 ? '#10b981' : seoHealthScore >= 50 ? '#f59e0b' : '#ef4444'
                  } strokeWidth="3" strokeDasharray={`${seoHealthScore * 0.96} ${100 * 0.96}`} />
                </svg>
                <span className="absolute text-2xl font-display font-bold text-slate-800 dark:text-zinc-100">{seoHealthScore}%</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-2">
                {seoHealthScore >= 80 ? 'Great — most posts are getting traffic.' :
                 seoHealthScore >= 50 ? 'Fair — some posts need promotion.' :
                 'Needs attention — many posts with zero views.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-5 pb-5">
              <div className="text-center bg-slate-50 dark:bg-zinc-900/50 rounded-lg py-3">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Published</span>
                <span className="text-lg font-bold text-slate-800 dark:text-zinc-100">{engagement?.totalPosts || 0}</span>
              </div>
              <div className="text-center bg-slate-50 dark:bg-zinc-900/50 rounded-lg py-3">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">Unseen</span>
                <span className="text-lg font-bold text-amber-500">{engagement?.postsWithNoViews || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* tf-section-2: Top Pages + Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
          <SectionHeader icon={<FileText className="h-4 w-4" />} title="Top Pages" />
          <div className="p-5">
            {traffic?.topPages && traffic.topPages.length > 0 ? (
              <div className="space-y-1">
                {traffic.topPages.slice(0, 10).map((page, i) => (
                  <div key={page.path} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-zinc-700/30 last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 w-4">{i + 1}.</span>
                      <span className="text-xs text-slate-700 dark:text-zinc-200 truncate">{page.path || '/'}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-semibold text-[#246BFF]">{page.views} views</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">{page.visitors} visitors</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-sm">No page data yet.</div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
          <SectionHeader icon={<Globe className="h-4 w-4" />} title="Top Referrers" />
          <div className="p-5">
            {traffic?.topReferrers && traffic.topReferrers.length > 0 ? (
              <div className="space-y-2">
                {traffic.topReferrers.slice(0, 8).map((ref, i) => (
                  <div key={ref.referrer} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-slate-700 dark:text-zinc-200 truncate">{ref.referrer}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 shrink-0">{ref.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 dark:text-zinc-500 text-sm">No referrer data yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Content Performance Table */}
      <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-800/40 dark:to-zinc-800/10 border-b border-gray-100 dark:border-zinc-700 rounded-t-xl">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#246BFF]" />
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-zinc-100">Content Performance</h3>
            {contentPerf && <span className="text-[10px] text-slate-400 dark:text-zinc-500">({contentPerf.totalPosts} posts)</span>}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={perfSearch}
              onChange={e => setPerfSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-48 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#246BFF]"
            />
          </div>
        </div>
        <div className="p-5">
          {filteredPosts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-700/50">
                    {(['title', 'views', 'visitors', 'lastViewed'] as SortField[]).map(f => (
                      <th key={f} className="pb-3 text-left text-slate-400 dark:text-zinc-500 font-semibold cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300" onClick={() => toggleSort(f)}>
                        <span className="inline-flex items-center gap-1">
                          {f === 'title' ? 'Title' : f === 'views' ? 'Views' : f === 'visitors' ? 'Visitors' : 'Last Viewed'}
                          {perfSort === f && <ArrowUpDown className="h-3 w-3" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.slice(0, 25).map((p, idx) => (
                    <motion.tr
                      key={p.slug}
                      className="border-b border-slate-50 dark:border-zinc-700/30 hover:bg-slate-50 dark:hover:bg-zinc-700/20"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                    >
                      <td className="py-2.5 pr-4">
                        <span className="text-slate-700 dark:text-zinc-200 font-medium">{p.title}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="font-semibold text-[#246BFF]">{p.views}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="text-slate-600 dark:text-zinc-300">{p.visitors}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="text-slate-400 dark:text-zinc-500">{p.lastViewed ? new Date(p.lastViewed).toLocaleDateString() : '—'}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-sm">
              {contentPerf?.totalPosts === 0 ? 'No published posts yet.' : 'No posts match your search.'}
            </div>
          )}
        </div>
      </div>

      {/* tf-section-2: Affiliate Links + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
        >
          <SectionHeader icon={<ExternalLink className="h-4 w-4" />} title="Affiliate Link Performance" />
          <div className="p-5">
            {clicks?.topLinks && clicks.topLinks.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={clicks.topLinks.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="clicks" fill="#246BFF" radius={[4, 4, 0, 0]} name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-sm">No affiliate links yet.</div>
            )}
          </div>
        </motion.div>

        <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
          <SectionHeader icon={<Zap className="h-4 w-4" />} title="Recent Activity" badge={`${activityItems.length} events`} />
          <div className="p-5">
            {activityItems.length > 0 ? (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {activityItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 dark:border-zinc-700/30 last:border-0">
                    <div className={`mt-0.5 ${item.color}`}>{item.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 dark:text-zinc-200 truncate">{item.text}</p>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {new Date(item.time).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-sm">No recent activity.</div>
            )}
          </div>
        </div>
      </div>

      {/* Click sources: placement breakdown + daily trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
          <SectionHeader icon={<MousePointerClick className="h-4 w-4" />} title="Clicks by Placement" badge={`${days}d`} />
          <div className="p-5">
            {clicks?.byPlacement && clicks.byPlacement.length > 0 ? (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {clicks.byPlacement.map((p) => {
                  const max = clicks.byPlacement[0]?.clicks || 1;
                  const pct = Math.max(4, Math.round((p.clicks / max) * 100));
                  return (
                    <div key={p.placement} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-zinc-300 capitalize truncate pr-2">{p.placement.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-100 shrink-0">{p.clicks} <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">clicks</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-700/50 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#246BFF] to-[#10b981]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 dark:text-zinc-500 text-sm">
                No product clicks recorded yet — clicks start counting the moment visitors tap &quot;Check Price on Amazon&quot;.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
          <SectionHeader icon={<CalendarDays className="h-4 w-4" />} title="Daily Click Trend" badge={`${days}d`} />
          <div className="p-5">
            {clicks?.dailyClicks && clicks.dailyClicks.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={clicks.dailyClicks}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(val) => { const d = new Date(val); return `${d.getMonth() + 1}/${d.getDate()}`; }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} labelFormatter={(val) => new Date(val).toLocaleDateString()} />
                  <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} dot={false} name="Clicks" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-12 text-center text-slate-400 dark:text-zinc-500 text-sm">No click activity in this period.</div>
            )}
          </div>
        </div>
      </div>

      {/* Product Performance */}
      {productAnalytics && Array.isArray(productAnalytics.products) && productAnalytics.products.length > 0 && (
        <div className="bg-white dark:bg-zinc-800/80 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm">
          <SectionHeader icon={<ShoppingBag className="h-4 w-4" />} title="Product Performance" />
          <div className="p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4">
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase">Total Views</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{(productAnalytics?.totalViews || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4">
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase">Total Clicks</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{(productAnalytics?.totalClicks || 0).toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-900 rounded-xl p-4">
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold uppercase">Est. Earnings</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">${(productAnalytics?.totalEarnings || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase border-b border-slate-100 dark:border-zinc-700">
                    <th className="pb-2 pr-3">Product</th>
                    <th className="pb-2 pr-3">Views</th>
                    <th className="pb-2 pr-3">Clicks</th>
                    <th className="pb-2 pr-3">Conv. Rate</th>
                    <th className="pb-2 pr-3 text-right">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {(productAnalytics.products || []).slice(0, 10).map((p: any, idx: number) => (
                    <motion.tr
                      key={p.id}
                      className="border-b border-slate-50 dark:border-zinc-800 text-xs"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02, duration: 0.2 }}
                    >
                      <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-zinc-200">{p.product_name}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{p.page_views}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{p.click_count}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`font-semibold ${p.conversion_rate > 5 ? 'text-green-600' : p.conversion_rate > 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {p.conversion_rate}%
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-semibold text-green-600 dark:text-green-400">${p.estimated_earnings.toFixed(2)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={reload}
          className="bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-600 dark:text-zinc-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
        <button
          onClick={() => {
            const data = contentPerf?.posts || [];
            const rows = [
              ['Title', 'Slug', 'Views', 'Visitors', 'Last Viewed'],
              ...data.map(p => [p.title, p.slug, String(p.views), String(p.visitors), p.lastViewed || '']),
            ];
            downloadCSV(`dawnwire-content-performance-${days}d.csv`, rows);
          }}
          className="bg-slate-100 dark:bg-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-600 text-slate-600 dark:text-zinc-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
          Last loaded: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
