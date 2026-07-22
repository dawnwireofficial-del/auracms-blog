import React, { useState } from 'react';
import { Product } from '../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface SeoHealthProgressChartProps {
  products: Product[];
  onOptimizeProduct?: (productId: string) => void;
}

export const SeoHealthProgressChart: React.FC<SeoHealthProgressChartProps> = ({
  products,
  onOptimizeProduct,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'needs-fix'>('all');
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  // Calculate SEO score for a single product (0 - 100)
  const calculateSeoScore = (p: Product) => {
    let score = 0;
    if (p.title && p.title.length >= 20) score += 20;
    if (p.shortDescription && p.shortDescription.length >= 50) score += 20;
    if (p.pros && p.pros.length >= 2) score += 15;
    if (p.cons && p.cons.length >= 1) score += 10;
    if (p.bestFor) score += 15;
    if (p.asin) score += 10;
    if (p.images && p.images.length >= 1) score += 10;
    return Math.min(100, score);
  };

  const productSeoList = products.map((p) => ({
    product: p,
    score: calculateSeoScore(p),
  }));

  const avgSeoScore = Math.round(
    productSeoList.reduce((acc, curr) => acc + curr.score, 0) / (products.length || 1)
  );

  const excellentCount = productSeoList.filter((x) => x.score >= 90).length;
  const goodCount = productSeoList.filter((x) => x.score >= 70 && x.score < 90).length;
  const needsFixCount = productSeoList.filter((x) => x.score < 70).length;

  const pieData = [
    { name: 'Excellent (90-100%)', value: excellentCount, color: '#10b981' },
    { name: 'Good (70-89%)', value: goodCount, color: '#3b82f6' },
    { name: 'Needs Fix (<70%)', value: needsFixCount, color: '#f59e0b' },
  ];

  // Category average scores
  const categoryScoresMap: Record<string, { total: number; count: number }> = {};
  products.forEach((p) => {
    const cat = p.mainCategory || 'General';
    if (!categoryScoresMap[cat]) categoryScoresMap[cat] = { total: 0, count: 0 };
    categoryScoresMap[cat].total += calculateSeoScore(p);
    categoryScoresMap[cat].count += 1;
  });

  const categoryChartData = Object.keys(categoryScoresMap).map((cat) => ({
    category: cat,
    avgScore: Math.round(categoryScoresMap[cat].total / categoryScoresMap[cat].count),
  }));

  const filteredProducts = selectedFilter === 'needs-fix'
    ? productSeoList.filter((x) => x.score < 70)
    : productSeoList;

  const handleAutoOptimize = (productId: string) => {
    setOptimizingId(productId);
    setTimeout(() => {
      if (onOptimizeProduct) onOptimizeProduct(productId);
      setOptimizingId(null);
    }, 1200);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">
              Gemini SEO Engine
            </span>
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
              Catalog SEO Health & Metadata Completeness Tracker
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking structured schema, meta tags, and Gemini-generated completeness across all {products.length} products
          </p>
        </div>

        {/* Global Progress Radial / Gauge Score */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-3.5 px-5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="text-right">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {avgSeoScore}%
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Avg SEO Score
            </div>
          </div>
          <div className="w-12 h-12 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200 dark:text-slate-700"
                strokeWidth="4"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-1000"
                strokeDasharray={`${avgSeoScore}, 100`}
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Visual Progress Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart Distribution */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col items-center">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">
            SEO Completeness Distribution
          </h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs font-bold mt-2">
            <span className="text-emerald-600">● Excellent: {excellentCount}</span>
            <span className="text-blue-600">● Good: {goodCount}</span>
            <span className="text-amber-500">● Needs Fix: {needsFixCount}</span>
          </div>
        </div>

        {/* Category Avg Bar Chart */}
        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <h4 className="text-xs font-black uppercase text-slate-500 mb-2">
            Category SEO Health Index
          </h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="avgScore" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product List Breakdown & Optimization Action */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Product SEO Metadata Audit & Fix List
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({productSeoList.length})
            </button>
            <button
              onClick={() => setSelectedFilter('needs-fix')}
              className={`text-xs px-3 py-1 rounded-lg font-bold transition-colors ${
                selectedFilter === 'needs-fix'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Needs Optimization ({needsFixCount})
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {filteredProducts.map(({ product, score }) => (
            <div
              key={product.id}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={product.images[0]}
                  alt=""
                  className="w-10 h-10 object-contain rounded-lg bg-white dark:bg-slate-900 p-1 border shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                    {product.title}
                  </div>
                  <div className="text-slate-400 text-[11px] truncate">
                    {product.brand} • {product.bestFor || 'Missing BestFor Keyword'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Progress Bar */}
                <div className="w-24 flex flex-col items-end">
                  <span className={`font-black ${score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-blue-500' : 'text-amber-500'}`}>
                    {score}%
                  </span>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleAutoOptimize(product.id)}
                  disabled={optimizingId === product.id}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[11px] shadow transition-all disabled:opacity-50"
                >
                  {optimizingId === product.id ? 'Optimizing...' : '⚡ AI SEO Fix'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
