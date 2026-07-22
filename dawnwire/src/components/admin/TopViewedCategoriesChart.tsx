import React, { useState } from 'react';
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

interface TopViewedCategoriesChartProps {
  categories?: Category[];
}

interface CategoryViewData {
  name: string;
  shortName: string;
  views: number;
  clickThroughs: number;
  conversionRate: number;
  color: string;
  editorialPriority: 'High' | 'Medium' | 'Normal';
}

const DEFAULT_CATEGORY_METRICS: CategoryViewData[] = [
  {
    name: 'Audio & Headphones',
    shortName: 'Audio',
    views: 14250,
    clickThroughs: 3420,
    conversionRate: 24.0,
    color: '#2563eb', // Blue
    editorialPriority: 'High',
  },
  {
    name: 'Smart Home & IoT',
    shortName: 'Smart Home',
    views: 11800,
    clickThroughs: 2714,
    conversionRate: 23.0,
    color: '#0d9488', // Teal
    editorialPriority: 'High',
  },
  {
    name: 'Gaming & PC Gear',
    shortName: 'Gaming',
    views: 9450,
    clickThroughs: 2079,
    conversionRate: 22.0,
    color: '#7c3aed', // Purple
    editorialPriority: 'High',
  },
  {
    name: 'Laptops & Wearables',
    shortName: 'Laptops',
    views: 7900,
    clickThroughs: 1659,
    conversionRate: 21.0,
    color: '#ea580c', // Orange
    editorialPriority: 'Medium',
  },
  {
    name: 'Cameras & Imaging',
    shortName: 'Cameras',
    views: 5850,
    clickThroughs: 1111,
    conversionRate: 19.0,
    color: '#e11d48', // Rose
    editorialPriority: 'Medium',
  },
  {
    name: 'Home Office & Ergonomics',
    shortName: 'Office',
    views: 4200,
    clickThroughs: 756,
    conversionRate: 18.0,
    color: '#16a34a', // Green
    editorialPriority: 'Normal',
  },
  {
    name: 'Outdoor & Travel Tech',
    shortName: 'Outdoor',
    views: 3100,
    clickThroughs: 496,
    conversionRate: 16.0,
    color: '#0284c7', // Sky
    editorialPriority: 'Normal',
  },
];

export const TopViewedCategoriesChart: React.FC<TopViewedCategoriesChartProps> = ({
  categories = [],
}) => {
  const [timeRange, setTimeRange] = useState<'30d' | '14d' | '7d'>('30d');
  const [metricType, setMetricType] = useState<'views' | 'clickThroughs'>('views');

  // Scale data based on selected time range multiplier
  const multiplier = timeRange === '30d' ? 1.0 : timeRange === '14d' ? 0.48 : 0.24;

  const chartData = DEFAULT_CATEGORY_METRICS.map((cat) => {
    // If store categories match, use their actual display name
    const matchingCat = categories.find(
      (c) => c.name.toLowerCase() === cat.name.toLowerCase()
    );
    const displayName = matchingCat ? matchingCat.name : cat.name;

    return {
      ...cat,
      name: displayName,
      views: Math.round(cat.views * multiplier),
      clickThroughs: Math.round(cat.clickThroughs * multiplier),
    };
  });

  const totalViews = chartData.reduce((acc, curr) => acc + curr.views, 0);
  const totalClicks = chartData.reduce((acc, curr) => acc + curr.clickThroughs, 0);
  const topCategory = chartData[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: CategoryViewData = payload[0].payload;
      const percentage = ((data.views / totalViews) * 100).toFixed(1);

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
          <div className="font-extrabold text-sm text-slate-100 flex items-center justify-between gap-3">
            <span>{data.name}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                data.editorialPriority === 'High'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {data.editorialPriority} Priority
            </span>
          </div>
          <div className="text-slate-300 space-y-0.5 pt-1 border-t border-slate-800">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Total Page Views:</span>
              <strong className="text-white font-mono">{data.views.toLocaleString()}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Share of Traffic:</span>
              <strong className="text-amber-400 font-mono">{percentage}%</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Affiliate Clicks:</span>
              <strong className="text-emerald-400 font-mono">
                {data.clickThroughs.toLocaleString()} ({data.conversionRate}%)
              </strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
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

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Selector */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setMetricType('views')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                metricType === 'views'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Page Views
            </button>
            <button
              onClick={() => setMetricType('clickThroughs')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                metricType === 'clickThroughs'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Affiliate Clicks
            </button>
          </div>

          {/* Time Range Selector */}
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

      {/* Summary KPI Badges */}
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
            {topCategory.name}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            {topCategory.views.toLocaleString()} views (
            {((topCategory.views / totalViews) * 100).toFixed(1)}% of total)
          </span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Outbound Click Volume
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {totalClicks.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis
              dataKey="shortName"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }} />
            <Bar
              dataKey={metricType}
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

      {/* Editorial Content Strategy Recommendations */}
      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 rounded-2xl text-xs space-y-2">
        <div className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
          <span>✍️ AI Editorial Recommendation:</span>
        </div>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong>{topCategory.name}</strong> and <strong>Smart Home & IoT</strong> account for over <strong>46%</strong> of total platform page views.
          We recommend scheduling <strong>2 new roundups or buying guides</strong> in these high-converting sectors this week to maximize affiliate yield.
        </p>
      </div>
    </div>
  );
};
