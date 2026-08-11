import React, { useEffect, useState } from 'react';
import { useAppStore } from '../lib/store';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { ReadingProgressBar } from '../components/common/ReadingProgressBar';
import { Product, Post, Category } from '../types';
import { proxyImageUrl } from '../utils/safeRender';
import { AmbientGlow } from '../components/visual/AmbientGlow';
import { TechnicalGrid } from '../components/visual/TechnicalGrid';
import { GradientDivider } from '../components/visual/GradientDivider';

export const ReviewsPage: React.FC = () => {
  const { products, categories } = useAppStore();
  const [selectedCat, setSelectedCat] = useState('all');
  const [sort, setSort] = useState<'score' | 'rating' | 'newest'>('score');

  const reviews = (products || [])
    .filter((p) => p.published && Number(p.editorScore) > 0)
    .filter((p) => selectedCat === 'all' || p.categoryId === selectedCat || p.mainCategory === selectedCat)
    .sort((a, b) => {
      if (sort === 'rating') return Number(b.rating) - Number(a.rating);
      if (sort === 'newest') return new Date(b.lastSyncedAt || b.createdAt || 0).getTime() - new Date(a.lastSyncedAt || a.createdAt || 0).getTime();
      return Number(b.editorScore) - Number(a.editorScore);
    });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <ReadingProgressBar />
      <DisclosureBanner />
      <div className="relative overflow-hidden bg-gradient-to-r from-[#EAF2FF] via-white to-[#FFF3E6] text-slate-900 py-14 px-4 border-b border-[#E2E8F0] shadow-[0_10px_40px_-20px_rgba(36,107,255,0.25)]">
        <TechnicalGrid opacity={0.04} />
        <AmbientGlow color="blue" position="top-right" size="lg" />
        <AmbientGlow color="blue" position="bottom-left" size="lg" />
        <div className="relative z-10 max-w-7xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#111827] via-[#246BFF] to-[#FF8A00]">
            Expert Editorial Reviews
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl font-medium">
            In-depth testing, hands-on benchmarks, and honest verdicts from DawnWire editors. {reviews.length} products reviewed.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            {(['score', 'rating', 'newest'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${sort === s ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {s === 'score' ? 'Editor Score' : s === 'rating' ? 'User Rating' : 'Newest'}
              </button>
            ))}
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 dark:text-slate-400 text-sm">No editorial reviews published yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((p) => (
              <a key={p.id} href={`/products/${p.slug}`} className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                {p.images?.[0] && (
                  <div className="aspect-square bg-white dark:bg-slate-800 overflow-hidden">
                    <img src={proxyImageUrl(p.images[0])} alt={p.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide truncate">{p.brand || 'Review'}</span>
                    <span className="text-amber-500 font-extrabold bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-xl shrink-0">★ {p.editorScore} / 10</span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.productName}</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">{p.editorVerdict}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500">
                      <span className="text-amber-500 font-bold">★ {p.rating}</span>
                      <span className="text-slate-400"> ({p.reviewCount || 0} reviews)</span>
                    </div>
                    {typeof p.currentPrice === 'number' && p.currentPrice > 0 && <span className="text-sm font-black text-slate-900 dark:text-white">${p.currentPrice.toFixed(2)}</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const BuyingGuidesPage: React.FC = () => {
  const [guides, setGuides] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/posts?limit=100');
        const body = await res.json();
        const posts = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
        const sorted = posts
          .filter((p: Post) => p.tags?.includes('buying guide'))
          .sort((a: Post, b: Post) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
        const seen = new Set<string>();
        const guides = sorted.filter((p: Post) => {
          const tag = (p.tags || []).find((t: string) => t !== 'buying guide' && t !== 'best' && /^best\b/i.test(t.trim()));
          const key = tag ? tag.toLowerCase() : (p.productId || p.categoryId || p.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setGuides(guides);
      } catch {
        setGuides([]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <ReadingProgressBar />
      <DisclosureBanner />
      <div className="relative overflow-hidden bg-gradient-to-br from-[#EAF2FF] via-white to-[#FFF3E6] text-slate-900 py-12 px-4 border-b border-[#E2E8F0]">
        <AmbientGlow color="blue" position="top-right" size="lg" />
        <div className="max-w-7xl mx-auto space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-gradient-to-r from-[#246BFF] to-[#FF8A00] text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">BUYING GUIDE</span>
            <span className="bg-white border border-[#E2E8F0] text-slate-700 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">BEST OF</span>
            <span className="bg-white border border-[#E2E8F0] text-slate-700 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">EXPERT REVIEW</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display">Dawnwire Buying Guides</h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Discover. Compare. Buy Smart. — Comprehensive purchasing advice to help you choose the best product for your specific budget and use case.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-3xl border border-amber-200 dark:border-amber-800/40 p-6 flex flex-col justify-between min-h-[220px]">
            <div className="space-y-2">
              <span className="inline-block bg-amber-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">Winner Podiums</span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Best-Of Roundups</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Every category ranked — our editors pick the overall winner, runner-up, and best-value champion.</p>
            </div>
            <a href="/best" className="mt-4 self-start bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl text-xs shrink-0 transition-colors">
              Explore Roundups &rarr;
            </a>
          </div>

          <div className="bg-gradient-to-br from-dw-blue/10 to-dw-orange/10 dark:from-blue-950/30 dark:to-orange-950/30 rounded-3xl border border-blue-200 dark:border-blue-800/40 p-6 flex flex-col justify-between min-h-[220px]">
            <div className="space-y-2">
              <span className="inline-block bg-blue-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">How to Choose</span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Buying Guides</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Step-by-step guides covering what to look for, key features, budget tiers, and our top picks per category.</p>
            </div>
            <a href="/buying-guides" className="mt-4 self-start bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl text-xs shrink-0 transition-colors">
              Browse All Guides &rarr;
            </a>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4">Latest Buying Guides ({guides.length})</h2>
          {loading ? (
            <div className="animate-pulse text-slate-400 text-sm font-bold py-10 text-center">Loading guides...</div>
          ) : guides.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 dark:text-slate-400 text-sm">No buying guides published yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <a key={guide.id} href={`/post/${guide.slug}`} className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
                  {guide.featuredImage && (
                    <div className="aspect-video bg-white dark:bg-slate-800 overflow-hidden">
                      <img src={proxyImageUrl(guide.featuredImage)} alt={guide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">Buying Guide</span>
                      <span>•</span>
                      <span>{guide.readingTime || 5} min read</span>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{guide.title}</h2>
                    {guide.excerpt && <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">{guide.excerpt}</p>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
