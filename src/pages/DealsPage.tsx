import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/common/ProductCard';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { TrendingDealsSection } from '../components/deals/TrendingDealsSection';
import { useAppStore } from '../lib/store';
import { Product } from '../types';
import { AmbientGlow } from '../components/visual/AmbientGlow';
import { TechnicalGrid } from '../components/visual/TechnicalGrid';
import { GradientDivider } from '../components/visual/GradientDivider';

export const DealsPage: React.FC = () => {
  const { products } = useAppStore();
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [minDiscount, setMinDiscount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/public/deals')
      .then(r => r.json())
      .then((data: any) => {
        const items = Array.isArray(data) ? data : (data.data || data.deals || []);
        const productIds = items.map((d: any) => d.productId || d.product_id).filter(Boolean);
        if (productIds.length > 0) {
          const matched = products.filter(p => productIds.includes(p.id));
          setDealProducts(matched.length > 0 ? matched : products.filter(p => p.isDeal));
        } else {
          setDealProducts(products.filter(p => p.isDeal));
        }
        setLoading(false);
      })
      .catch(() => {
        setDealProducts(products.filter(p => p.isDeal));
        setLoading(false);
      });
  }, [products]);

  const filtered = dealProducts.filter((p) => (p.discountPercentage || 0) >= minDiscount);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <DisclosureBanner />

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#050B18] via-[#1E0B00] to-[#050B18] text-white py-16 px-4 border-b border-orange-500/30 shadow-2xl">
        <TechnicalGrid opacity={0.06} />
        <AmbientGlow color="orange" position="top-right" size="lg" />
        <AmbientGlow color="orange" position="bottom-left" size="xl" />
        <div className="relative z-10 max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            24/7 Price Tracker Active
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-100 to-orange-300">
            Amazon Deals & Instant Price Drops
          </h1>
          <p className="text-sm text-amber-100 max-w-2xl font-medium">
            Handpicked, verified price drops on top-rated electronics, coffee makers, smart home equipment, and lifestyle products on Amazon US.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <TrendingDealsSection />
        {/* Discount Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Filter Minimum Discount:
          </span>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {[
              { label: 'All Deals', value: 0 },
              { label: '15%+ Off', value: 15 },
              { label: '25%+ Off', value: 25 },
              { label: '30%+ Off', value: 30 }
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMinDiscount(opt.value)}
                className={`px-4 py-2 rounded-xl transition-all ${
                  minDiscount === opt.value
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>
    </div>
  );
};
