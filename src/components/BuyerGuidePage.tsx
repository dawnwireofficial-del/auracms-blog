import React, { useEffect, useState } from 'react';
import { Head } from 'vike-react/Head';
import { Star, ShoppingBag, ArrowRight, Filter, ChevronDown } from 'lucide-react';
import SeoHelmet from './SeoHelmet';
import { proxyImageUrl } from '../utils/safeRender';

interface BuyerGuideProduct {
  id: string;
  slug?: string;
  product_name: string;
  brand?: string;
  product_image?: string;
  price?: string;
  rating: number;
  best_for?: string;
  affiliate_url?: string;
  review_summary?: string;
  final_verdict?: string;
  pros?: string[];
  cons?: string[];
  key_features?: string[];
  stock_status?: string;
  deal_badge?: string;
}

interface BuyerGuidePageProps {
  category: string;
  onNavigate: (route: string, param?: string) => void;
}

export default function BuyerGuidePage({ category, onNavigate }: BuyerGuidePageProps) {
  const [products, setProducts] = useState<BuyerGuideProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'price_low' | 'price_high'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/public/product-reviews?limit=500');
      if (res.ok) {
        const body = await res.json();
        const all: BuyerGuideProduct[] = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
        const cat = category ? category.replace(/-/g, ' ') : '';
        setProducts(cat ? all.filter(p => (p.best_for || '').toLowerCase().includes(cat)) : all);
      }
    } catch (e) { console.error(e) }
    setLoading(false);
  }

  useEffect(() => { load(); }, [category]);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'price_low') return parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0') - parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0');
    return parseFloat(b.price?.replace(/[^0-9.]/g, '') || '0') - parseFloat(a.price?.replace(/[^0-9.]/g, '') || '0');
  });

  const title = category ? `Best ${category.replace(/-/g, ' ')} — Reviews & Buying Guide` : 'Product Reviews — Buying Guides';
  const desc = `Compare the best ${category ? category.replace(/-/g, ' ') : 'products'} with expert reviews, pros & cons, and price comparisons. Find the perfect product for your needs.`;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#246BFF] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <>
      <SeoHelmet title={title} description={desc} />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400">{desc}</p>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center justify-between mb-6 bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <ShoppingBag className="h-4 w-4 text-[#246BFF]" />
            <span className="font-semibold text-slate-700 dark:text-zinc-200">{products.length} products</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[10px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all">
              <Filter className="h-3 w-3" />
              Sort
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {showFilters && (
              <div className="flex gap-1">
                {(['rating', 'price_low', 'price_high'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                      sortBy === s ? 'bg-[#246BFF] text-white' : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-600'
                    }`}
                  >
                    {s === 'rating' ? 'Top Rated' : s === 'price_low' ? 'Price: Low' : 'Price: High'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-zinc-600 mx-auto mb-4" />
            <p className="text-sm text-slate-400 dark:text-zinc-500">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map(p => (
              <div
                key={p.id}
                className="bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 overflow-hidden hover:shadow-lg hover:border-[#246BFF]/20 transition-all group"
              >
                {p.product_image && (
                  <div className="h-44 bg-slate-50 dark:bg-zinc-900 p-6 border-b border-slate-100 dark:border-zinc-700/50">
                    <img src={proxyImageUrl(p.product_image)} alt={p.product_name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  {p.brand && <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-widest">{p.brand}</p>}
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-snug line-clamp-2">{p.product_name}</p>
                    {p.best_for && <span className="text-[9px] text-[#246BFF] bg-[#246BFF]/5 px-2 py-0.5 rounded-full mt-1 inline-block">{p.best_for}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(p.rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-600'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{p.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-slate-800 dark:text-white">{p.price || '—'}</span>
                    {p.deal_badge && <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">🔥 {p.deal_badge}</span>}
                  </div>
                  {p.stock_status && p.stock_status !== 'in_stock' && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        p.stock_status === 'low_stock' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300' :
                        p.stock_status === 'limited' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300' :
                        'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'
                      }`}>{p.stock_status.replace('_', ' ')}</span>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => onNavigate('review', p.slug || p.id)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all"
                    >
                      Read Review
                    </button>
                    <a
                      href={p.affiliate_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="flex-1 px-3 py-2 rounded-lg bg-[#246BFF] text-white text-[11px] font-semibold hover:bg-[#1a5ae0] transition-all text-center inline-flex items-center justify-center gap-1"
                      onClick={() => { if (p.affiliate_url) { fetch('/api/public/track/affiliate-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id, pageUrl: window.location.pathname }) }).catch(() => {}); } }}
                    >
                      <ShoppingBag className="h-3 w-3" />
                      Buy Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
