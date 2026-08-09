import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { SideBySideComparisonModal } from '../components/product/SideBySideComparisonModal';
import { AmbientGlow } from '../components/visual/AmbientGlow';
import { TechnicalGrid } from '../components/visual/TechnicalGrid';
import { GradientDivider } from '../components/visual/GradientDivider';

export const ComparisonPage: React.FC = () => {
  const { products } = useAppStore();

  const [p1Id, setP1Id] = useState(products[0]?.id || 'p1');
  const [p2Id, setP2Id] = useState(products[1]?.id || 'p2');

  const prod1 = products.find((p) => p.id === p1Id) || products[0];
  const prod2 = products.find((p) => p.id === p2Id) || products[1];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <DisclosureBanner />

      <div className="relative overflow-hidden bg-gradient-to-r from-[#050B18] via-[#0A1F44] to-[#050B18] text-white py-14 px-4 border-b border-blue-500/20 shadow-2xl">
        <TechnicalGrid opacity={0.05} />
        <AmbientGlow color="cyan" position="top-right" size="lg" />
        <AmbientGlow color="blue" position="bottom-left" size="lg" />
        <div className="relative z-10 max-w-7xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-blue-200">
            Split-Screen Side-By-Side Product Comparisons
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl font-medium">
            Compare technical specs, Gemini AI sentiment scores, feature differences, and live Amazon pricing.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Selector Header */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">
            Select Two Products to Compare
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Product A</label>
              <select
                value={p1Id}
                onChange={(e) => setP1Id(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.brand} - {p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Product B</label>
              <select
                value={p2Id}
                onChange={(e) => setP2Id(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.brand} - {p.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Embedded Split-Screen Comparison Component */}
        {prod1 && prod2 && (
          <SideBySideComparisonModal
            productA={prod1}
            productB={prod2}
            isModal={false}
          />
        )}
      </div>
    </div>
  );
};
