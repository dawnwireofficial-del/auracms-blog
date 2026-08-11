import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { ProductCard } from '../components/common/ProductCard';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { useAppStore } from '../lib/store';
import { triggerPageLoadProgress } from '../lib/navigation';
import { proxyImageUrl } from '../utils/safeRender';

interface HomePageProps {
  onOpenAiFinder: () => void;
  onOpenChatbot: () => void;
}

const NO_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#eef2f7"/><g fill="none" stroke="#cbd5e1" stroke-width="2"><circle cx="150" cy="138" r="46"/><path d="M66 238c8-48 46-72 84-72s76 24 84 72"/></g></svg>'
);

function SectionHead({ title, sub, href, label }: { title: string; sub?: string; href?: string; label?: string }) {
  return (
    <div className="commerce-section-head">
      <div>
        <h2>{title}</h2>
        {sub && <div className="commerce-sub">{sub}</div>}
      </div>
      {href && (
        <a href={href} className="commerce-section-link">
          {label || 'View All'}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
}

function Stars({ rating, count }: { rating?: number; count?: number | string }) {
  const r = Number(rating) || 0;
  const full = Math.round(r);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="rating-stars" aria-label={`${r} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} width="14" height="14" viewBox="0 0 20 20" className={i <= full ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'} fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.977 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </span>
      <span className="rating-meta">
        {r > 0 ? r.toFixed(1) : ''}
        {count ? ` (${Number(count).toLocaleString()})` : ''}
      </span>
    </span>
  );
}

function PriceBlock({ price, was }: { price?: number | string; was?: number | string }) {
  const p = Number(price);
  const w = Number(was);
  const showNow = !isNaN(p) && p > 0;
  const showWas = !isNaN(w) && w > p;
  return (
    <div className="flex items-baseline gap-2">
      {showNow ? (
        <>
          <span className="price-now">${p.toFixed(2)}</span>
          {showWas && <span className="price-was">${w.toFixed(2)}</span>}
        </>
      ) : (
        <span className="price-was font-semibold">Check Price on Amazon</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trust strip                                                         */
/* ------------------------------------------------------------------ */
const TRUST_ITEMS = [
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Independently tested' },
  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: '98.2% pick accuracy' },
  { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Live price watch' },
  { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2-2h-5l-5 5v-5z', label: 'AI research assistant' },
];

export const HomePage: React.FC<HomePageProps> = ({ onOpenAiFinder, onOpenChatbot }) => {
  const { products, categories, deals, comparisons, buyingGuides, reviews } = useAppStore();
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [heroQuery, setHeroQuery] = useState('');
  const [brands, setBrands] = useState<{ id: string; name: string; slug: string; logoUrl?: string; logo?: string }[]>([]);

  useEffect(() => {
    fetch('/api/public/brands?limit=10')
      .then(r => r.json())
      .then(data => setBrands(Array.isArray(data) ? data.slice(0, 10) : (data?.data || []).slice(0, 10)))
      .catch(() => {});
  }, []);

  /* Derived product sets -------------------------------------------------- */
  const sortedByScore = useMemo(
    () => [...products].sort((a, b) => (b.editorScore || 0) - (a.editorScore || 0)),
    [products]
  );

  const heroDeals = useMemo(() => {
    const fromDeals = deals
      .map(d => { const p = products.find(pd => pd.id === d.productId); return p ?? null; })
      .filter(Boolean)
      .slice(0, 2);
    if (fromDeals.length) return fromDeals as typeof products;
    const dealy = sortedByScore.filter(p => p.isDeal).slice(0, 2);
    if (dealy.length) return dealy;
    return sortedByScore.slice(0, 2);
  }, [deals, products, sortedByScore]);

  const topDeals = useMemo(() => {
    const byDiscount = [...sortedByScore]
      .filter(p => p.isDeal || p.discountPercentage || (Number(p.referencePrice) > Number(p.currentPrice)))
      .sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0))
      .slice(0, 8);
    return byDiscount.length ? byDiscount : sortedByScore.slice(0, 8);
  }, [sortedByScore]);

  const picks = activeCategoryFilter === 'all'
    ? sortedByScore
    : sortedByScore.filter(p => (p.mainCategory || '').toLowerCase().includes(activeCategoryFilter));
  const topPicks = picks.slice(0, 8);

  const spotlight = useMemo(() => {
    const findCat = (needle: string) => categories.find(c => c.name.toLowerCase().includes(needle));
    const electron = findCat('electron');
    const beauty = findCat('beauty');
    const pairs: { cat: (typeof categories)[number]; prods: typeof products }[] = [];
    [electron, beauty].forEach((cat) => {
      if (!cat) return;
      const prods = sortedByScore
        .filter(p =>
          (p.mainCategory || '').toLowerCase().includes(cat.name.toLowerCase()) ||
          (p.categoryId === cat.id)
        )
        .slice(0, 4);
      pairs.push({ cat, prods });
    });
    return pairs;
  }, [categories, sortedByScore]);

  const showcaseCategories = useMemo(() => {
    const prefs = ['electron', 'beauty', 'home', 'kitchen', 'sport', 'fashion', 'toy', 'gaming'];
    const picked: (typeof categories)[number][] = [];
    prefs.forEach(pref => {
      if (picked.length >= 4) return;
      const c = categories.find(cat => cat.name.toLowerCase().includes(pref));
      if (c && !picked.some(p => p.id === c.id)) picked.push(c);
    });
    categories.forEach(c => { if (picked.length >= 4) return; if (!picked.some(p => p.id === c.id)) picked.push(c); });
    return picked.slice(0, 4);
  }, [categories]);

  const categoryImage = useCallback((catId: string, catName: string): string => {
    const cat = categories.find(c => c.id === catId);
    const banner = cat?.desktopBanner || cat?.image;
    if (banner) return proxyImageUrl(banner) || NO_IMAGE;
    const prod = sortedByScore.find(p =>
      (p.mainCategory || '').toLowerCase().includes(catName.toLowerCase()) || p.categoryId === catId
    );
    return proxyImageUrl(prod?.images?.[0] || prod?.productImage) || NO_IMAGE;
  }, [categories, sortedByScore]);

  const productCountFor = useCallback((catName: string) =>
    products.filter(p => (p.mainCategory || '').toLowerCase().includes(catName.toLowerCase())).length,
    [products]);

  const submitHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    if (q) triggerPageLoadProgress();
    window.location.href = q ? `/search?q=${encodeURIComponent(q)}` : '/products';
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      <DisclosureBanner />

      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden">
        {/* Light background wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#F1F6FF] to-[#FFF4E6] dark:from-[#050B18] dark:via-[#081226] dark:to-[#0A1230]" />
        <div className="absolute -top-32 -right-24 w-[480px] h-[480px] rounded-full bg-[#246BFF]/10 dark:bg-[#246BFF]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 w-[420px] h-[420px] rounded-full bg-orange-400/15 dark:bg-orange-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.5] dark:opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(100,116,139,0.35) 1px, transparent 0)', backgroundSize: '28px 28px' }}
        />

        <div className="relative commerce-container commerce-section grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center lg:min-h-[560px] py-10 lg:py-16">
          {/* Left column */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 dark:bg-[#0A1F44]/60 dark:border-blue-900 px-3 py-1.5 text-[12px] font-bold text-blue-700 dark:text-blue-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              AI-powered deals &amp; independent benchmarks
            </div>

            <h1 className="mt-5 text-4xl sm:text-5xl xl:text-[54px] font-[850] tracking-tight leading-[1.05] text-slate-900 dark:text-white font-sans">
              Done-For-You Shopping.
              <span className="block mt-2 bg-gradient-to-r from-[#246BFF] via-[#1a57e0] to-[#FF8A00] bg-clip-text text-transparent">
                Honest Scores. Verified Deals.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
              DawnWire researches, price-checks and scores the best products of 2026 — so you buy
              the right thing, at the right price, in seconds instead of hours.
            </p>

            {/* Hero search */}
            <form onSubmit={submitHeroSearch} className="mt-7 max-w-xl">
              <div className="glass-light rounded-2xl p-1.5 flex items-stretch gap-1">
                <span className="hidden sm:flex items-center pl-3 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  value={heroQuery}
                  onChange={e => setHeroQuery(e.target.value)}
                  placeholder="Search products, deals, reviews or guides…"
                  aria-label="Search DawnWire"
                  className="flex-1 min-w-0 bg-transparent px-3 sm:px-2 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none"
                />
                <button type="submit" className="btn-royal-blue-md rounded-xl shrink-0">
                  Search
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-600 dark:text-slate-300">Trending:</span>
                {['Wireless Headphones', 'Korean Skincare', 'Air Fryers'].map(t => (
                  <button key={t} type="button" onClick={() => setHeroQuery(t)}
                    className="hover:text-[#246BFF] dark:hover:text-blue-300 font-semibold transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </form>

            {/* Hero CTAs + trust checkmarks */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={onOpenAiFinder} className="btn-royal-md rounded-xl">
                <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Find My Perfect Product
              </button>
              <a href="/products?sort=rating" className="btn-ghost-md rounded-xl">
                Browse Best Sellers
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {['1,200+ products scored', '45+ categories', 'Tracked daily from Amazon'].map(t => (
                <li key={t} className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Right column — deals spotlight */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {heroDeals.map((p, i) => {
                const img = proxyImageUrl(p.images?.[0] || p.productImage) || NO_IMAGE;
                const disc = p.discountPercentage || (Number(p.referencePrice) > Number(p.currentPrice)
                  ? Math.round((1 - Number(p.currentPrice) / Number(p.referencePrice)) * 100) : 0);
                return (
                  <a
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className={`commerce-card commerce-card-hover relative p-5 flex flex-col gap-3 ${i === 0 ? 'sm:mt-8' : 'sm:mt-0'}`}
                    data-gravity-cursor="view"
                  >
                    {disc > 0 && (
                      <span className="pill pill-discount absolute -top-2 right-3 z-10 shadow-sm">
                        −{disc}%
                      </span>
                    )}
                    <div className="commerce-img-stage rounded-xl h-40">
                      <img src={img} alt={p.title} loading="lazy" referrerPolicy="no-referrer"
                        className="transition-transform duration-500 group-hover:scale-105"
                        onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-[#246BFF] uppercase tracking-wide truncate">{p.brand}</p>
                      <h3 className="text-[13px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mt-0.5">{p.title}</h3>
                    </div>
                    <div className="flex items-end justify-between gap-2">
                      <PriceBlock price={p.currentPrice || p.price} was={p.referencePrice} />
                      {p.editorScore ? (
                        <span className="pill pill-editor shrink-0">Score {p.editorScore}/10</span>
                      ) : (
                        <Stars rating={p.rating} count={p.reviewCount} />
                      )}
                    </div>
                  </a>
                );
              })}
            </motion.div>

            {/* Live price ticker chip */}
            <div className="mt-4 hidden sm:flex items-center justify-between gap-4 px-4 py-3 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/70 bg-emerald-50/60 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                Live price watch running
              </div>
              <span className="text-[12px] text-emerald-700/80 dark:text-emerald-300/80">
                {deals.length} tracked deals — refreshed today
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ TRUST STRIP ============================ */}
      <section className="border-y border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="commerce-container grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 py-5">
          {TRUST_ITEMS.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-[#0A1F44]/80 text-[#246BFF] dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900">
                <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </span>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <main className="commerce-container space-y-14 md:space-y-20 py-12 md:py-16">
        {/* ============================ CATEGORY TILES ============================ */}
        <section>
          <SectionHead
            title="Shop by Category"
            sub="From tech to self-care — every pick independently scored"
            href="/categories"
            label="All Categories"
          />
          {/* first tile spans 2 (large left), then 2 stacked right (3 total in a row), then repeats for 4th */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {showcaseCategories.map((cat, idx) => {
              const img = categoryImage(cat.id, cat.name);
              const count = productCountFor(cat.name);
              const wide = idx === 0;
              return (
                <a
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  data-gravity-cursor="explore"
                  className={`group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 ${wide ? 'col-span-2 md:row-span-2' : ''} bg-white dark:bg-slate-900`}
                >
                  <div className={`${wide ? 'h-56 md:h-full min-h-[220px]' : 'h-32'} commerce-img-stage w-full`}>
                    <img
                      src={img}
                      alt={cat.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-4">
                    <h3 className="text-[15px] font-bold text-white leading-tight">{cat.name}</h3>
                    <p className="text-[11px] text-white/80 mt-0.5">
                      {count} {count === 1 ? 'product' : 'products'} · Shop now →
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* ============================ BEST SELLERS ============================ */}
        <section>
          <SectionHead
            title="Top Scoring Products"
            sub="Our best-rated picks across every category, 10-point scale"
            href="/products?sort=rating"
            label="See All Products"
          />
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
                activeCategoryFilter === 'all'
                  ? 'bg-[#0A1F44] text-white border-[#0A1F44]'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#246BFF]/50'
              }`}
            >
              All Picks
            </button>
            {categories.slice(0, 4).map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategoryFilter(c.slug)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
                  activeCategoryFilter === c.slug
                    ? 'bg-[#0A1F44] text-white border-[#0A1F44]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#246BFF]/50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {topPicks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {topPicks.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="text-sm text-slate-500 py-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              No products in this category yet — check back soon.
            </div>
          )}
        </section>

        {/* ============================ PROMO BANNER ============================ */}
        <section>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF8A00] via-[#FF9F1C] to-[#FFB547] px-7 py-9 md:px-12 md:py-12 text-white border border-orange-200">
            <div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute right-24 -bottom-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="pill bg-white/90 text-[#FF8A00]">🔥 Today's Verified Drops</span>
                <h2 className="mt-3 text-2xl md:text-3xl font-[850] tracking-tight text-white">
                  Timed Price Drops — Deals End Tonight
                </h2>
                <p className="mt-2 max-w-md text-sm text-orange-50/90">
                  Hand-verified Amazon price drops, refreshed daily. Tap in before they expire.
                </p>
              </div>
              <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-orange-50/80">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  Ending 11:59 PM PT
                </div>
                <a href="/deals" className="btn-royal-md rounded-xl bg-[#0A1F44] hover:bg-[#12316A] text-white">
                  See All {deals.length || ''} Live Deals
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ TOP DEALS GRID ============================ */}
        {topDeals.length > 0 && (
          <section>
            <SectionHead
              title="Editor-Chosen Deals"
              sub="The steepest real discounts we're tracking right now"
              href="/deals"
              label="All Deals"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topDeals.slice(0, 4).map(p => (
                <a key={p.id} href={`/products/${p.slug}`} data-gravity-cursor="view"
                  className="commerce-card commerce-card-hover group relative p-3.5 flex flex-col gap-2.5">
                  <div className="relative commerce-img-stage rounded-xl h-32 md:h-36">
                    <img src={proxyImageUrl(p.images?.[0] || p.productImage) || NO_IMAGE} alt={p.title} loading="lazy"
                      referrerPolicy="no-referrer" className="transition-transform duration-500 group-hover:scale-105"
                      onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                    {p.discountPercentage ? (
                      <span className="pill pill-discount absolute top-2 left-2">−{p.discountPercentage}%</span>
                    ) : p.isDeal ? (
                      <span className="pill pill-discount absolute top-2 left-2">DEAL</span>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{p.brand}</p>
                    <h3 className="text-[12px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mt-0.5">{p.title}</h3>
                  </div>
                  <PriceBlock price={p.currentPrice || p.price} was={p.referencePrice} />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ============================ CATEGORY SPOTLIGHT ============================ */}
        {spotlight.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {spotlight.map(({ cat, prods }) => (
              <div key={cat.id} className="commerce-card p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-[750] text-slate-900 dark:text-white">{cat.name}</h2>
                    <p className="commerce-sub truncate">{cat.description || 'Independent lab reviews'}</p>
                  </div>
                  <a href={`/categories/${cat.slug}`} className="commerce-section-link">
                    Shop Now
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                {prods.length > 0 ? (
                  <div className="space-y-3">
                    {prods.slice(0, 3).map(p => (
                      <a key={p.id} href={`/products/${p.slug}`} data-gravity-cursor="view"
                        className="group flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 p-2.5 hover:border-[#246BFF]/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                        <div className="commerce-img-stage rounded-lg w-16 h-16 shrink-0">
                          <img src={proxyImageUrl(p.images?.[0] || p.productImage) || NO_IMAGE} alt={p.title} loading="lazy"
                            referrerPolicy="no-referrer" className="w-full h-full object-contain"
                            onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-[#246BFF] uppercase truncate">{p.brand}</p>
                          <h3 className="text-[13px] font-bold text-slate-900 dark:text-white truncate group-hover:text-[#246BFF] dark:group-hover:text-blue-300 transition-colors">
                            {p.title}
                          </h3>
                          <p className="flex items-center gap-2 mt-0.5">
                            <PriceBlock price={p.currentPrice || p.price} was={p.referencePrice} />
                            {p.editorScore ? <span className="pill pill-editor">Score {p.editorScore}/10</span> : null}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-500 py-8 text-center">Products coming soon.</p>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ============================ COMPARISONS ============================ */}
        <section>
          <div className="commerce-navy relative overflow-hidden rounded-3xl p-7 md:p-10 text-white">
            <div className="absolute -right-16 -top-20 w-80 h-80 rounded-full bg-[#246BFF]/30 blur-3xl" />
            <div className="absolute left-1/3 -bottom-24 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="relative">
              <SectionHead
                title="Product Comparison Benchmarks"
                sub="Side-by-side spec breakdowns with a clear winner"
                href="/compare"
                label="All Comparisons"
              />
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                {comparisons.slice(0, 2).map(comp => (
                  <a key={comp.id} href={`/compare/${comp.slug}`}
                    className="group rounded-2xl bg-white/[0.06] border border-white/10 p-5 hover:bg-white/[0.1] hover:border-[#246BFF]/50 transition-all">
                    <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                      <span className="uppercase font-bold tracking-wide text-blue-300">{comp.category}</span>
                      <span>{comp.lastUpdated || 'Updated recently'}</span>
                    </div>
                    <h3 className="text-[15px] font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {comp.title}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 mt-1.5">{comp.summary || comp.overview}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-amber-300">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Winner: {comp.winnerName || '—'}
                      </span>
                      <span className="text-[11px] font-bold text-blue-300 group-hover:text-white transition-colors">Read full →</span>
                    </div>
                  </a>
                ))}
                {comparisons.length === 0 && (
                  <div className="md:col-span-2 rounded-2xl bg-white/[0.06] border border-white/10 p-6 text-sm text-white/70">
                    Head-to-head comparison labs are being built — new matchups land here every week.{' '}
                    <a href="/compare" className="text-amber-300 font-bold hover:underline">Open the Compare tool →</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ============================ AI SHOPPING PROMO ============================ */}
        <section>
          <div className="relative overflow-hidden rounded-3xl border border-blue-200/70 dark:border-blue-900/70 bg-gradient-to-br from-white via-[#F1F6FF] to-[#FFF4E6] dark:from-[#0A1F44] dark:via-[#0A1838] dark:to-[#0d2a5e] p-7 md:p-10">
            <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-[#246BFF]/10 blur-2xl" />
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <span className="pill bg-[#0A1F44] text-white dark:bg-white/10">✨ AI Shopping Assistant</span>
                <h2 className="mt-3 text-2xl md:text-[28px] font-[800] tracking-tight text-slate-900 dark:text-white font-sans">
                  Can't Decide? Ask the Research Bot.
                </h2>
                <p className="mt-2 max-w-md mx-auto lg:mx-0 text-sm text-slate-600 dark:text-slate-300">
                  Tell us your budget and needs — our AI compares the catalog, quotes real prices, and
                  lands on a pick with an honest verdict.
                </p>
                <div className="mt-5 flex flex-wrap justify-center lg:justify-start gap-3">
                  <button onClick={onOpenChatbot} className="btn-royal-md rounded-xl">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Ask DawnWire AI
                  </button>
                  <button onClick={onOpenAiFinder} className="btn-ghost-md rounded-xl bg-white dark:bg-slate-800">
                    Open Product Finder
                  </button>
                </div>
              </div>
              <div className="shrink-0 w-full max-w-sm">
                <div className="glass-light rounded-2xl p-4 dark:bg-[#0A1F44]/60 dark:border-blue-900">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300 mb-3">
                    <span className="w-5 h-5 rounded-full bg-[#246BFF] text-white grid place-items-center text-[10px]">AI</span>
                    Sample question
                  </div>
                  <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">
                    "Which Korean moisturizer under $40 suits dry skin, with the highest editor score?"
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[#246BFF] dark:text-blue-300">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    3 picks · 2 price checks · verdict in seconds
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ GUIDES & REVIEWS ============================ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <SectionHead title="Latest Buying Guides" sub="What to look for before you buy" href="/guides" label="All Guides" />
            <div className="space-y-3">
              {(buyingGuides.length ? buyingGuides : []).slice(0, 3).map(g => (
                <a key={g.id} href={`/guides/${g.slug}`}
                  className="commerce-card commerce-card-hover group block p-4">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-bold text-[#246BFF] uppercase tracking-wide">{g.category}</span>
                    <span>•</span>
                    <span>{g.readTimeMinutes || 6} min read</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#246BFF] dark:group-hover:text-blue-300 transition-colors">
                    {g.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{g.excerpt || g.intro}</p>
                </a>
              ))}
              {!buyingGuides.length && (
                <p className="text-sm text-slate-500 py-8 text-center">Guides are on the editorial calendar — stay tuned.</p>
              )}
            </div>
          </div>

          <div>
            <SectionHead title="Expert Editorial Reviews" sub="Deep-dive verdicts from our testing lab" href="/reviews" label="All Reviews" />
            <div className="space-y-3">
              {(reviews.length ? reviews : []).slice(0, 3).map(rv => (
                <a key={rv.id} href={`/reviews/${rv.slug}`}
                  className="commerce-card commerce-card-hover group block p-4">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-bold text-[#246BFF] uppercase tracking-wide truncate">{rv.productName}</span>
                    {rv.overallScore || rv.score ? (
                      <span className="pill pill-editor shrink-0">★ {(rv.overallScore || rv.score)}/10</span>
                    ) : null}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#246BFF] dark:group-hover:text-blue-300 transition-colors">
                    {rv.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">{rv.verdict}</p>
                </a>
              ))}
              {!reviews.length && (
                <p className="text-sm text-slate-500 py-8 text-center">In-depth reviews are being published weekly.</p>
              )}
            </div>
          </div>
        </section>

        {/* ============================ BRANDS ============================ */}
        {brands.length > 0 && (
          <section>
            <SectionHead title="Shop by Brand" sub="Brands we've tested and recommend" href="/brands" label="All Brands" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {brands.map(brand => (
                <a key={brand.id} href={`/products?brand=${encodeURIComponent(brand.name)}`}
                  className="commerce-card commerce-card-hover group flex items-center justify-center gap-2 p-4 rounded-2xl">
                  {brand.logoUrl ? (
                    <img src={proxyImageUrl(brand.logoUrl)} alt={brand.name} referrerPolicy="no-referrer"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      className="h-6 w-auto max-w-[90px] object-contain" />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-[#0A1F44] text-[#246BFF] dark:text-blue-300 grid place-items-center text-[10px] font-black shrink-0">
                      {brand.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-[#246BFF] dark:group-hover:text-blue-300 transition-colors truncate">
                    {brand.name}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ============================ AFFORDABLE AFFILIATE CTA w/ DISCLOSURE ============================ */}
      <section className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-8">
        <div className="commerce-container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-2xl text-center md:text-left">
            <strong className="text-slate-700 dark:text-slate-200">Independent &amp; honest.</strong> DawnWire earns a small commission
            when you buy through links marked "on Amazon" — at no extra cost to you. Prices checked daily; may change after publish.
          </p>
          <a href="/affiliate-disclosure" className="commerce-section-link shrink-0">
            Full Disclosure
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
};