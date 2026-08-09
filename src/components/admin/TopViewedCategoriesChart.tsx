import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Category } from '../../types';

const CATEGORY_COLORS = [
  '#246BFF', '#0d9488', '#FF8A00', '#ea580c',
  '#e11d48', '#16a34a', '#0284c7', '#ca8a04',
  '#0A1F44', '#14b8a6',
];

interface CategoryViewData {
  name: string;
  views: number;
  color: string;
}

interface TopViewedCategoriesChartProps {
  categories?: Category[];
}

export const TopViewedCategoriesChart: React.FC<TopViewedCategoriesChartProps> = ({
  categories = [],
}) => {
  const [timeRange, setTimeRange] = useState<'30d' | '14d' | '7d'>('30d');
  const [chartData, setChartData] = useState<CategoryViewData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const days = timeRange === '30d' ? 30 : timeRange === '14d' ? 14 : 7;

  useEffect(() => {
    const token = localStorage.getItem('dawnwire_auth_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    fetch(`/api/admin/analytics/traffic?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.topPages || data.topPages.length === 0) {
          setChartData([]);
          return;
        }

        const catMap = new Map<string, number>();
        const catNameMap = new Map<string, string>();

        for (const cat of categories) {
          const lower = cat.name.toLowerCase();
          catMap.set(lower, 0);
          catNameMap.set(lower, cat.name);
        }

        for (const page of data.topPages) {
          const path = page.path.toLowerCase();
          for (const cat of categories) {
            const key = cat.name.toLowerCase();
            if (path.includes(key) || path.includes(key.replace(/[^a-z0-9]+/g, '-'))) {
              catMap.set(key, (catMap.get(key) || 0) + (page.views || 0));
              break;
            }
          }
        }

        const entries = Array.from(catMap.entries())
          .filter(([_, views]) => views > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([key, views], idx) => ({
            name: catNameMap.get(key) || key,
            views,
            color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          }));

        setChartData(entries);
      })
      .catch(() => setChartData([]))
      .finally(() => setIsLoading(false));
  }, [timeRange, days, categories]);

  const totalViews = chartData.reduce((acc, curr) => acc + curr.views, 0);
  const topCategory = chartData[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: CategoryViewData = payload[0].payload;
      const percentage = totalViews > 0 ? ((data.views / totalViews) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
          <div className="font-extrabold text-sm text-slate-100">{data.name}</div>
          <div className="text-slate-300 space-y-0.5 pt-1 border-t border-slate-800">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Page Views:</span>
              <strong className="text-white font-mono">{data.views.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Share of Traffic:</span>
              <strong className="text-amber-400 font-mono">{percentage}%</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-dw-blue/10 text-dw-blue dark:text-blue-400 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Editorial Insights
            </span>
            <span className="text-xs font-bold text-slate-500">
              • Category Traffic Distribution
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Top Viewed Categories</span>
            <span className="text-lg">📊</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated page views over the last 30 days to help prioritize editorial reviews and buying guide publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1">
            {(['30d', '14d', '7d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {range === '30d' ? 'Last 30 Days' : range === '14d' ? '14 Days' : '7 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          <p className="text-sm font-semibold">No traffic data yet</p>
          <p className="text-xs mt-1">Category views will appear here once visitors start browsing product pages.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total {timeRange === '30d' ? '30-Day' : timeRange === '14d' ? '14-Day' : '7-Day'} Category Views
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {totalViews.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Top Performing Category
              </span>
              <div className="text-lg font-black text-blue-600 dark:text-blue-400 truncate">
                {topCategory?.name || 'N/A'}
              </div>
              {topCategory && (
                <span className="text-[10px] text-slate-500 font-semibold">
                  {topCategory.views.toLocaleString()} views (
                  {((topCategory.views / totalViews) * 100).toFixed(1)}% of total)
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Categories Tracked
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {chartData.length}
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} />
                <Bar
                  dataKey="views"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {topCategory && (
          <div className="p-4 bg-dw-blue/10 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 rounded-2xl text-xs space-y-2">
            <div className="font-extrabold text-dw-blue dark:text-blue-300 flex items-center gap-1.5">
              <span>✍️ AI Editorial Recommendation:</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>{topCategory.name}</strong> leads in page views with <strong>{((topCategory.views / totalViews) * 100).toFixed(0)}%</strong> of total traffic.
              Consider scheduling more buying guides and comparison articles in this category to maximize affiliate yield.
            </p>
          </div>
          )}
        </>
      )}
    </div>
  );
};
