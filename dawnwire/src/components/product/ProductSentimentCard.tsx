import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Product } from '../../types';

interface SentimentData {
  overallSentiment: string;
  positivePercentage: number;
  neutralPercentage: number;
  negativePercentage: number;
  summary: string;
  keyPositiveFactors: string[];
  keyNegativeFactors: string[];
  featureRatings: {
    buildQuality: number;
    valueForMoney: number;
    performance: number;
    easeOfUse: number;
    design: number;
  };
}

interface ProductSentimentCardProps {
  product: Product;
}

export const ProductSentimentCard: React.FC<ProductSentimentCardProps> = ({ product }) => {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSentimentData = async (forceRefresh = false) => {
    const cacheKey = `dawnwire_sentiment_${product.id}`;
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setSentiment(JSON.parse(cached));
          setIsLoading(false);
          return;
        }
      } catch (e) {}
    }

    setIsRefreshing(true);
    try {
      const res = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: product.title,
          brand: product.brand,
          rating: product.rating,
          reviewCount: product.reviewCount,
          editorScore: product.editorScore,
          pros: product.pros,
          cons: product.cons,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSentiment(data);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching sentiment:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSentimentData(false);
  }, [product.id]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
      </div>
    );
  }

  if (!sentiment) return null;

  // Pie chart data
  const pieData = [
    { name: 'Positive', value: sentiment.positivePercentage, color: '#10b981' },
    { name: 'Neutral', value: sentiment.neutralPercentage, color: '#f59e0b' },
    { name: 'Negative', value: sentiment.negativePercentage, color: '#f43f5e' },
  ];

  // Feature ratings data
  const featureData = [
    { name: 'Build Quality', score: sentiment.featureRatings.buildQuality },
    { name: 'Performance', score: sentiment.featureRatings.performance },
    { name: 'Design', score: sentiment.featureRatings.design },
    { name: 'Ease of Use', score: sentiment.featureRatings.easeOfUse },
    { name: 'Value', score: sentiment.featureRatings.valueForMoney },
  ];

  const getSentimentBadgeColor = (s: string) => {
    if (s.includes('Overwhelmingly') || s.includes('Mostly Positive')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (s.includes('Mixed')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md font-bold text-xs">
            📊 Gemini NLP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                AI Customer Sentiment Summary
              </h3>
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getSentimentBadgeColor(sentiment.overallSentiment)}`}>
                {sentiment.overallSentiment}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synthesized from {product.reviewCount?.toLocaleString() || '500+'} customer reviews via Gemini 3.6 Flash
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchSentimentData(true)}
          disabled={isRefreshing}
          className="self-start sm:self-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{isRefreshing ? 'Analyzing...' : 'Re-Analyze'}</span>
        </button>
      </div>

      {/* Main Grid: Sentiment Chart & Feature Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Donut Chart & Percentages (5 Cols) */}
        <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-full h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Ratio']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {sentiment.positivePercentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Positive
              </span>
            </div>
          </div>

          {/* Legend row */}
          <div className="flex items-center justify-center gap-4 text-xs font-bold pt-2 w-full">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Positive {sentiment.positivePercentage}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Neutral {sentiment.neutralPercentage}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Negative {sentiment.negativePercentage}%</span>
            </div>
          </div>
        </div>

        {/* Right: Feature Ratings Horizontal Bars (7 Cols) */}
        <div className="md:col-span-7 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Category Performance Scores (0 - 100)
          </h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={85} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [`${val} / 100`, 'Score']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="score" fill="#2563eb" radius={[0, 8, 8, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Executive Summary Text Box */}
      <div className="p-4 bg-gradient-to-r from-blue-950/80 to-slate-900 rounded-2xl border border-blue-800/50 text-white space-y-3 shadow-inner">
        <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
          <span>Gemini Synthesis Summary</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-normal">
          "{sentiment.summary}"
        </p>
      </div>

      {/* Key Positives & Key Negatives Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
          <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
            👍 Key Customer Praises
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sentiment.keyPositiveFactors.map((f, i) => (
              <span key={i} className="text-xs bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 font-bold px-2.5 py-1 rounded-lg">
                ✓ {f}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 space-y-2">
          <span className="text-[11px] font-black uppercase text-rose-700 dark:text-rose-300 block">
            ⚠️ Reported Critiques
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sentiment.keyNegativeFactors.map((f, i) => (
              <span key={i} className="text-xs bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 font-bold px-2.5 py-1 rounded-lg">
                ! {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
