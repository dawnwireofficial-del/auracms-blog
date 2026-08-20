import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { useAppStore } from '../lib/store';
import { triggerPageLoadProgress } from '../lib/navigation';
import { proxyImageUrl } from '../utils/safeRender';
import { assignHomepageSlots } from '../lib/homepageSlots';
import { AnimatedCategoryIcon } from '../components/common/AnimatedCategoryIcon';
import MascotAnimation from '../components/MascotAnimation';
import { useReducedMotion } from '../components/useReducedMotion';
import BannerInlineEditor from '../components/admin/BannerInlineEditor';
import { HeroBanner, DealStrip, CategoryCard, BrandedBanner, GRADIENTS } from '../components/branding/BrandedBanners';
import { SeasonalBanner, UpcomingEventsBar } from '../components/branding/SeasonalBanners';
import type { Post } from '../types';

interface HomePageProps {
  onOpenAiFinder: () => void;
  onOpenChatbot: () => void;
}

const NO_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#eef2f7"/><g fill="none" stroke="#cbd5e1" stroke-width="2"><circle cx="150" cy="138" r="46"/><path d="M66 238c8-48 46-72 84-72s76 24 84 72"/></g></svg>'
);

function SectionHead({ title, sub, href, label, light }: { title: string; sub?: string; href?: string; label?: string; light?: boolean }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
      <div>
        <h2 className={`text-2xl md:text-3xl lg:text-[32px] font-[850] tracking-tight leading-tight font-sans ${light ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h2>
        {sub && <div className={`mt-1.5 text-sm ${light ? 'text-white/70' : 'text-slate-500'}`}>{sub}</div>}
      </div>
      {href && (
        <a href={href} className={`shrink-0 text-sm font-bold flex items-center gap-1 whitespace-nowrap transition-colors ${light ? 'text-white hover:text-white/80' : 'text-[#246BFF] hover:text-[#1a57e0]'}`}>
          {label || 'View All'}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
}

function Stars({ rating, count, size = 15 }: { rating?: number; count?: number | string; size?: number }) {
  const r = Number(rating) || 0;
  const full = Math.round(r);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-0.5 text-amber-400 leading-none" aria-label={`${r} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20" className={i <= full ? 'text-[#FF8A00]' : 'text-slate-300'} fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.977 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
      </span>
      <span className="text-[13px] text-slate-500">
        {r > 0 ? r.toFixed(1) : ''}
        {count ? ` (${Number(count).toLocaleString()})` : ''}
      </span>
    </span>
  );
}

function PriceBlock({ price, was, large }: { price?: number | string; was?: number | string; large?: boolean }) {
  const p = Number(price);
  const w = Number(was);
  const showNow = !isNaN(p) && p > 0;
  const showWas = !isNaN(w) && w > p;
  return (
    <div className="flex items-baseline gap-2">
      {showNow ? (
        <>
          <span className={`${large ? 'text-2xl' : 'text-lg'} font-[850] tracking-tight text-slate-900`}>${p.toFixed(2)}</span>
          {showWas && <span className="text-sm text-slate-400 line-through">${w.toFixed(2)}</span>}
        </>
      ) : (
        <span className="text-sm font-semibold text-slate-500">Check Price on Amazon</span>
      )}
    </div>
  );
}

const TRUST_ITEMS = [
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Independently tested' },
  { icon: 'M13 10V3L4 14h7v7l9-11h-7z', label: '98.2% pick accuracy' },
  { icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', label: 'Live price watch' },
  { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', label: 'AI research assistant' },
];

/* Countdown timer to end of today — powers the "Hot Deals" module (reference so-deals timer) */
function DealsCountdown() {
  const [left, setLeft] = useState('00:00:00');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const d = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const [hh, mm, ss] = left.split(':');
  return (
    <div className="flex items-center gap-1.5 font-mono" aria-label="Deals end countdown">
      {[hh, mm, ss].map((v, i) => (
        <React.Fragment key={i}>
          <span className="inline-flex items-center justify-center min-w-[42px] h-10 rounded-lg bg-gradient-to-b from-[#FF8A00] to-[#e67b00] text-white text-lg font-black shadow-[0_6px_14px_-6px_rgba(255,138,0,0.6)] tabular-nums">{v}</span>
          {i < 2 && <span className="text-lg font-black text-slate-400">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenAiFinder, onOpenChatbot }) => {
  const { products, categories, deals, banners } = useAppStore();
  const [heroQuery, setHeroQuery] = useState('');
  const [brands, setBrands] = useState<{ id: string; name: string; slug: string; logoUrl?: string; logo?: string }[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    fetch('/api/public/brands?limit=20')
      .then(r => r.json())
      .then(data => setBrands(Array.isArray(data) ? data : (data?.data || [])))
      .catch(() => {});
  }, []);

  // Latest editorial guides come from public posts
  useEffect(() => {
    fetch('/api/public/posts?limit=8')
      .then(r => r.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : (data?.data || []);
        setPosts(arr.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  const sortedByScore = useMemo(
    () => [...products].sort((a, b) => (b.editorScore || 0) - (a.editorScore || 0)),
    [products]
  );

  /* Hero deal = the single on-page deal with the most steam, or any product */
  const heroItem = useMemo(() => {
    if (deals.length) {
      const linked = deals
        .map(d => products.find(pd => pd.id === d.productId))
        .filter(Boolean);
      if (linked.length) return linked[0] as (typeof products)[number];
    }
    const dealy = sortedByScore.filter(p => p.isDeal || p.discountPercentage || (Number(p.referencePrice) > Number(p.currentPrice)));
    if (dealy.length) return dealy[0];
    return sortedByScore[0];
  }, [deals, products, sortedByScore]);

  /* Today's best deals — steepest real discounts, biggest first */
  const topDeals = useMemo(() => {
    const byDiscount = [...sortedByScore]
      .filter(p => p.isDeal || p.discountPercentage || (Number(p.referencePrice) > Number(p.currentPrice)))
      .sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    const list = byDiscount.length ? byDiscount : sortedByScore;
    return list.slice(0, 6);
  }, [sortedByScore]);

  /* Promo tiles get real product imagery */
  const promoPool = sortedByScore;

  /* Shop-by-category horizontal set — up to 10 */
  const shopCategories = useMemo(() => {
    const prefs = ['electron', 'beauty', 'home', 'kitchen', 'fashion', 'health', 'sport', 'toy', 'automotive', 'office', 'baby'];
    const picked: (typeof categories)[number][] = [];
    prefs.forEach(pref => {
      if (picked.length >= 10) return;
      const c = categories.find(cat => cat.name.toLowerCase().includes(pref));
      if (c && !picked.some(p => p.id === c.id)) picked.push(c);
    });
    categories.forEach(c => { if (picked.length >= 10) return; if (!picked.some(p => p.id === c.id)) picked.push(c); });
    return picked.slice(0, 10);
  }, [categories]);

  const categoryImage = (cat: (typeof categories)[number]): string => {
    const banner = cat.image || cat.desktopBanner;
    if (banner) return proxyImageUrl(banner) || NO_IMAGE;
    return '';
  };

  const productCountFor = (catName: string) =>
    products.filter(p => (p.mainCategory || '').toLowerCase().includes(catName.toLowerCase())).length;

  /* Popular rails — Electronics + Beauty (fallback to first two filled categories) */
  const rails = useMemo(() => {
    const findCat = (needle: string) => categories.find(c => c.name.toLowerCase().includes(needle));
    const prefs = ['electron', 'beauty'];
    let chosen: (typeof categories)[number][] = [];
    prefs.forEach(pref => { const c = findCat(pref); if (c && !chosen.some(x => x.id === c.id)) chosen.push(c); });
    if (chosen.length < 2) {
      const filled = categories.filter(c => products.some(p => p.categoryId === c.id || (p.mainCategory || '').toLowerCase().includes(c.name.toLowerCase())));
      filled.forEach(c => { if (chosen.length >= 2) return; if (!chosen.some(x => x.id === c.id)) chosen.push(c); });
      categories.forEach(c => { if (chosen.length >= 2) return; if (!chosen.some(x => x.id === c.id)) chosen.push(c); });
    }
    return chosen.slice(0, 2).map(cat => ({
      cat,
      prods: sortedByScore
        .filter(p => p.categoryId === cat.id || (p.mainCategory || '').toLowerCase().includes(cat.name.toLowerCase()))
        .slice(0, 5)
    }));
  }, [categories, products, sortedByScore]);

  const brandsAll = useMemo(() => {
    const productBrands = [...new Set(products.map(p => p.brand).filter(Boolean))]
      .map(name => ({ id: 'brand-' + name, name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
    const merged: { id: string; name: string; slug: string; logoUrl?: string; logo?: string }[] = [];
    brands.forEach(b => { if (!merged.some(x => x.name.toLowerCase() === b.name.toLowerCase())) merged.push(b); });
    productBrands.forEach(b => { if (!merged.some(x => x.name.toLowerCase() === b.name.toLowerCase())) merged.push(b); });
    return merged.slice(0, 12);
  }, [brands, products]);

  const submitHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = heroQuery.trim();
    if (q) triggerPageLoadProgress();
    window.location.href = q ? `/search?q=${encodeURIComponent(q)}` : '/products';
  };

  /* Admin-managed banner slots → fall back to auto-generated designs */
  const bannerSlots = useMemo(() => assignHomepageSlots(banners), [banners]);

  /* Promotional campaign banners — prefer admin banners, else themed with real product imagery */
  const promoBanners: { label: string; title: string; cta: string; href: string; image: string; tint: string }[] = (() => {
    const fromAdmin = bannerSlots.promos.map((b, i) => b ? {
      label: b.badgeText || b.subtitle || (i === 0 ? 'Limited Time' : i === 1 ? 'Early Access' : 'Members Only'),
      title: b.heading || b.title || 'Shop the Event',
      cta: b.ctaText || 'Shop Now',
      href: b.targetUrl || b.ctaLink || '/deals',
      image: proxyImageUrl(b.desktopImage),
      tint: i === 0 ? 'from-[#246BFF]/85' : i === 1 ? 'from-[#FF8A00]/85' : 'from-[#111827]/80',
    } : null);
    if (fromAdmin.some(Boolean)) return fromAdmin.map((b, i) => b || defaultPromo(i));
    return [0, 1, 2].map((i) => defaultPromo(i));

    function defaultPromo(i: number) {
      const img = (p?: (typeof products)[number]) => proxyImageUrl(p?.images?.[0] || p?.productImage) || NO_IMAGE;
      const defs: { label: string; title: string; cta: string; href: string; image: string; tint: string }[] = [
        { label: 'Prime Day Prep', title: 'Get Early Access to Prime Day Prices', cta: 'Explore Deals', href: '/deals', image: img(topDeals[0] || promoPool[0]), tint: 'from-[#246BFF]/85' },
        { label: 'Back to School', title: 'Laptops, Noise-Cancelling & More', cta: 'Shop Now', href: '/products', image: img(topDeals[1] || promoPool[1]), tint: 'from-[#FF8A00]/85' },
        { label: 'Beauty Event', title: 'Korean Skincare Up to 30% Off', cta: 'Shop Beauty', href: '/categories/beauty-personal-care', image: img(topDeals[2] || promoPool[2]), tint: 'from-[#111827]/80' },
      ];
      return defs[i];
    }
  })();

  /* 2×2 hero promo tiles — admin placements win, else product-driven */
  const heroTiles = bannerSlots.heroTiles.map((b, i) => {
    const defs = [
      { label: '⚡ Flash Deals', sub: 'Up to 60% off', href: '/deals', img: promoPool[1] || topDeals[0], tint: 'from-[#FF8A00]/90' },
      { label: '📉 Price Drops', sub: 'Tracked daily', href: '/deals', img: promoPool[0] || topDeals[1], tint: 'from-[#246BFF]/90' },
      { label: '🏆 Best Sellers', sub: `${sortedByScore.length}+ top-rated`, href: '/products?sort=rating', img: sortedByScore[2], tint: 'from-[#111827]/85' },
      { label: '🔥 Editors’ Picks', sub: 'Lab-verified winners', href: '/products', img: sortedByScore[3], tint: 'from-[#4F7CFF]/90' },
    ];
    const def = defs[i];
    if (b && b.desktopImage) {
      return {
        label: b.badgeText || b.subtitle || def.label,
        sub: b.heading || b.title || def.sub,
        href: b.targetUrl || b.ctaLink || def.href,
        img: undefined as (typeof products)[number] | undefined,
        imageUrl: proxyImageUrl(b.desktopImage),
        tint: def.tint,
      };
    }
    return { ...def, imageUrl: '' };
  });

  /* ── Full-width hero slider slides ── */
  const heroSlides = useMemo(() => {
    const slides: { kind: 'banner'; image: string; heading: string; sub: string; cta: string; href: string; badge?: string }[] = [];
    const pushBanner = (img?: string, heading?: string, sub?: string, cta?: string, href?: string, badge?: string) => {
      if (img && img !== NO_IMAGE) {
        slides.push({
          kind: 'banner',
          image: img,
          heading: heading || 'Shop the Best Deals',
          sub: sub || '',
          cta: cta || 'Shop Now',
          href: href || '/deals',
          badge,
        });
      }
    };
    const hm = bannerSlots.heroMain;
    pushBanner(hm?.desktopImage, hm?.heading || hm?.title, hm?.subtitle || hm?.description, hm?.ctaText, hm?.targetUrl || hm?.ctaLink, hm?.badgeText);
    bannerSlots.heroTiles.forEach(t => {
      pushBanner(t?.desktopImage, t?.heading || t?.title, t?.subtitle || t?.description, t?.ctaText, t?.targetUrl || t?.ctaLink, t?.badgeText);
    });
    return slides;
  }, [bannerSlots]);

  /* ── Tabbed category rails (reference listing-tabs) ── */
  const tabCategories = useMemo(() => {
    const withProducts = categories.filter(c =>
      products.some(p => p.categoryId === c.id || (p.mainCategory || '').toLowerCase().includes(c.name.toLowerCase()))
    );
    const base = withProducts.length >= 2 ? withProducts : (rails.length ? rails.map(r => r.cat) : categories);
    return base.slice(0, 4);
  }, [categories, products, rails]);

  const [activeTab, setActiveTab] = useState(0);
  useEffect(() => { if (activeTab >= tabCategories.length && tabCategories.length > 0) setActiveTab(0); }, [activeTab, tabCategories.length]);

  const tabProducts = useMemo(() => {
    if (!tabCategories[activeTab]) return [];
    const cat = tabCategories[activeTab];
    return sortedByScore
      .filter(p => p.categoryId === cat.id || (p.mainCategory || '').toLowerCase().includes(cat.name.toLowerCase()))
      .slice(0, 8);
  }, [tabCategories, activeTab, sortedByScore]);

  /* ── Hero slider autoplay ── */
  const [slideIdx, setSlideIdx] = useState(0);
  const [hovering, setHovering] = useState(false);
  const totalSlides = heroSlides.length + 1; // +1 copy slide
  useEffect(() => {
    if (prefersReduced || hovering || totalSlides <= 1) return;
    const id = setInterval(() => setSlideIdx(i => (i + 1) % totalSlides), 5000);
    return () => clearInterval(id);
  }, [prefersReduced, hovering, totalSlides]);
  useEffect(() => {
    if (slideIdx >= totalSlides) setSlideIdx(0);
  }, [slideIdx, totalSlides]);

  const goSlide = (i: number) => setSlideIdx(((i % totalSlides) + totalSlides) % totalSlides);

  /* ── Newsletter strip state ── */
  const [nlEmail, setNlEmail] = useState('');
  const [nlMsg, setNlMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [nlBusy, setNlBusy] = useState(false);
  const submitNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlEmail.trim() || nlBusy) return;
    setNlBusy(true);
    setNlMsg(null);
    try {
      const res = await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nlEmail.trim() }),
      });
      setNlMsg(res.ok
        ? { ok: true, text: 'You’re in! Watch your inbox for the hottest deals.' }
        : { ok: false, text: 'Something went wrong — please try again.' });
      if (res.ok) setNlEmail('');
    } catch {
      setNlMsg({ ok: false, text: 'Network error — please try again.' });
    } finally {
      setNlBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 overflow-x-clip">
      <DisclosureBanner />

      {/* ============================ FULL-WIDTH HERO SLIDER (reference so-homeslider) ============================ */}
      <section
        className="relative overflow-hidden"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        aria-roledescription="carousel"
        aria-label="Featured highlights"
      >
        {/* Slide track */}
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(-${slideIdx * 100}%)` }}
        >
          {/* ── Slide 1: copy + search ── */}
          <div className="relative w-full shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#F1F6FF] to-[#FFF4E6]" />
            <div className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full bg-[#246BFF]/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-24 w-[460px] h-[460px] rounded-full bg-[#FF8A00]/10 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.45]"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(100,116,139,0.30) 1px, transparent 0)', backgroundSize: '28px 28px' }}
            />
            <div className="relative commerce-container grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(350px,1fr)] gap-[18px] items-stretch py-10 lg:py-14">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative rounded-[24px] overflow-hidden border border-white/70 shadow-[0_20px_60px_-24px_rgba(36,107,255,0.28)] bg-gradient-to-br from-white via-[#F4F8FF] to-[#FFF3E6] min-h-[460px] flex flex-col"
                data-gravity-cursor="explore"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-2 px-7 md:px-10 pt-8 md:pt-10 pb-0 items-center flex-1">
                  {/* Left: copy */}
                  <div className="pb-6">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#246BFF]/25 bg-white/80 px-3.5 py-1.5 text-[13px] font-bold text-[#246BFF] shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#246BFF] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#246BFF]" />
                      </span>
                      {bannerSlots.heroMain?.subtitle || 'AI-powered deals & independent benchmarks'}
                    </div>
                    <h1 className="mt-5 text-4xl sm:text-5xl xl:text-[58px] font-[900] tracking-tight leading-[1.02] text-slate-900 font-sans">
                      {bannerSlots.heroMain?.heading ? (
                        bannerSlots.heroMain.heading
                      ) : (
                        <>
                          Done-For-You Shopping.
                          <span className="block mt-2 bg-gradient-to-r from-[#246BFF] via-[#1a57e0] to-[#FF8A00] bg-clip-text text-transparent">
                            Honest Scores. Verified Deals.
                          </span>
                        </>
                      )}
                    </h1>
                    <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-slate-600">
                      {bannerSlots.heroMain?.description || 'DawnWire researches, price-checks and scores the best products of 2026 — so you buy the right thing, at the right price, in seconds instead of hours.'}
                    </p>

                    {/* Hero search */}
                    <form onSubmit={submitHeroSearch} className="mt-7 max-w-xl">
                      <div className="bg-white/80 backdrop-blur rounded-2xl p-1.5 flex items-stretch gap-1 border border-white/80 shadow-[0_10px_30px_-8px_rgba(36,107,255,0.18)]">
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
                          className="flex-1 min-w-0 bg-transparent px-3 sm:px-2 py-3 text-[15px] text-slate-900 placeholder-slate-400 outline-none"
                        />
                        <button type="submit" className="bg-[#246BFF] hover:bg-[#164EE8] text-white font-bold px-6 py-2.5 rounded-xl shrink-0">Search</button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
                        <span className="font-bold text-slate-600">Trending:</span>
                        {['Wireless Headphones', 'Korean Skincare', 'Air Fryers'].map(t => (
                          <button key={t} type="button" onClick={() => setHeroQuery(t)} className="hover:text-[#246BFF] font-semibold transition-colors">{t}</button>
                        ))}
                      </div>
                    </form>

                    {/* Hero CTAs */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button onClick={onOpenAiFinder} className="inline-flex items-center gap-2 rounded-xl bg-[#FF8A00] hover:bg-[#e67b00] text-white font-bold px-6 py-3 text-[15px] shadow-[0_8px_22px_-8px_rgba(255,138,0,0.6)] transition-all hover:-translate-y-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Find My Perfect Product
                      </button>
                      <a href="/products?sort=rating" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 text-slate-700 hover:border-[#246BFF] hover:text-[#246BFF] font-bold px-6 py-3 text-[15px] transition-all">
                        Browse Best Sellers
                      </a>
                    </div>
                  </div>

                  {/* Right: large product imagery (or admin hero banner) */}
                  <BannerInlineEditor placement="hero_main" banner={bannerSlots.heroMain}>
                  {bannerSlots.heroMain?.desktopImage ? (
                    <div className="relative px-4 pb-2">
                      <a
                        href={bannerSlots.heroMain.targetUrl || bannerSlots.heroMain.ctaLink || '/deals'}
                        className="block relative"
                        data-gravity-cursor="view"
                      >
                        <div className="relative mx-auto max-w-[460px] aspect-[7/4] rounded-[24px] bg-white border border-slate-200/80 shadow-[0_24px_70px_-24px_rgba(36,107,255,0.4)] overflow-hidden">
                          <img
                            src={proxyImageUrl(bannerSlots.heroMain.desktopImage) || NO_IMAGE}
                            alt={bannerSlots.heroMain.altText || bannerSlots.heroMain.heading || 'Featured banner'}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }}
                          />
                          {bannerSlots.heroMain.badgeText && (
                            <span className="absolute top-3 right-3 bg-[#FF8A00] text-white text-[12px] font-black px-3 py-1 rounded-full shadow-lg">{bannerSlots.heroMain.badgeText}</span>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-10 px-5 pb-4">
                            <p className="text-white text-lg font-[850] leading-tight">{bannerSlots.heroMain.heading || bannerSlots.heroMain.title}</p>
                            {(bannerSlots.heroMain.subtitle || bannerSlots.heroMain.description) && (
                              <p className="text-white/85 text-[13px] mt-1">{bannerSlots.heroMain.subtitle || bannerSlots.heroMain.description}</p>
                            )}
                          </div>
                        </div>
                      </a>
                    </div>
                  ) : heroItem ? (
                    <div className="relative px-4 pb-2">
                      <a href={`/products/${heroItem.slug}`} className="block relative" data-gravity-cursor="view">
                        <div className="relative mx-auto max-w-[360px] aspect-square rounded-[24px] bg-white border border-slate-200/80 shadow-[0_24px_70px_-24px_rgba(36,107,255,0.4)] p-4">
                          <img
                            src={proxyImageUrl(heroItem.images?.[0] || heroItem.productImage) || NO_IMAGE}
                            alt={heroItem.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain rounded-2xl"
                            onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }}
                          />
                          {heroItem.discountPercentage ? (
                            <span className="absolute -top-3 right-4 bg-[#FF334F] text-white text-[13px] font-black px-3 py-1 rounded-full shadow-lg rotate-3">
                              −{heroItem.discountPercentage}%
                            </span>
                          ) : null}
                          <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl border border-slate-200 shadow-xl px-4 py-2.5">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">DawnWire Score</p>
                            <p className="text-xl font-[900] text-[#246BFF]">{(heroItem.editorScore || 0).toFixed(1)}<span className="text-sm text-slate-400"> /10</span></p>
                          </div>
                        </div>
                      </a>
                      <div className="hidden lg:flex items-center justify-center gap-4 mt-8">
                        {topDeals.map((p, i) => i < 3 ? (
                          <a key={p.id} href={`/products/${p.slug}`} className="w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden p-1" data-gravity-cursor="view">
                            <img src={proxyImageUrl(p.images?.[0] || p.productImage) || NO_IMAGE} alt={p.title} referrerPolicy="no-referrer" className="w-full h-full object-contain"
                              onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                          </a>
                        ) : null)}
                      </div>
                    </div>
                  ) : null}
                  </BannerInlineEditor>
                </div>

                {/* Bottom trust chips */}
                <div className="mt-auto px-7 md:px-10 py-5 border-t border-[#246BFF]/10 bg-white/55">
                  <ul className="flex flex-wrap gap-x-6 gap-y-2">
                    {['1,200+ products scored', '45+ categories', 'Tracked daily from Amazon', 'Independent verdicts'].map(t => (
                      <li key={t} className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-600">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── Slides 2+: admin banner slides (full-bleed) ── */}
          {heroSlides.map((slide, i) => (
            <div key={i} className="relative w-full shrink-0">
              <img
                src={slide.image}
                alt={slide.heading}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
              <div className="relative commerce-container flex items-end min-h-[560px] py-12">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  className="max-w-xl"
                >
                  {slide.badge && (
                    <span className="inline-block bg-[#FF8A00] text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 shadow-lg">{slide.badge}</span>
                  )}
                  <h2 className="text-3xl md:text-5xl font-[900] tracking-tight leading-[1.05] text-white drop-shadow-lg">{slide.heading}</h2>
                  {slide.sub && <p className="mt-3 text-white/85 text-base md:text-lg max-w-md leading-relaxed">{slide.sub}</p>}
                  <a
                    href={slide.href}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FF8A00] hover:bg-[#e67b00] text-white font-bold px-7 py-3.5 text-[15px] shadow-[0_12px_30px_-10px_rgba(255,138,0,0.7)] transition-all hover:-translate-y-0.5"
                  >
                    {slide.cta}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </motion.div>
              </div>
            </div>
          ))}
        </div>

        {/* Slider arrows */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={() => goSlide(slideIdx - 1)}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-700 shadow-lg flex items-center justify-center backdrop-blur transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => goSlide(slideIdx + 1)}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-700 shadow-lg flex items-center justify-center backdrop-blur transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${slideIdx === i ? 'w-7 bg-[#246BFF]' : 'w-2 bg-slate-400/60 hover:bg-slate-500'}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ============================ TRUST STRIP ============================ */}
      <section className="border-y border-slate-200/80 bg-white">
        <div className="commerce-container grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 py-5">
          {TRUST_ITEMS.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#EAF2FF] text-[#246BFF] flex items-center justify-center shrink-0 border border-[#246BFF]/10">
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </span>
              <span className="text-[14px] font-bold text-slate-700">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ DEAL STRIP ============================ */}
      <section className="commerce-container mt-6">
        <DealStrip products={products} />
      </section>

      {/* ============================ SEASONAL BANNER ============================ */}
      <section className="commerce-container">
        <SeasonalBanner products={products} />
      </section>

      <main className="commerce-container space-y-14 md:space-y-20 py-12 md:py-16">
        {/* ============================ PROMO BANNERS (BrandedBanner) ============================ */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promoBanners.slice(0, 2).map((banner, i) => (
              <BrandedBanner
                key={banner.title + i}
                title={banner.title}
                subtitle={banner.label}
                cta={banner.cta}
                href={banner.href}
                gradient={i === 0 ? 'premium' : 'deal'}
                height="h-[200px] lg:h-[220px]"
                showProduct={false}
              />
            ))}
          </div>
        </section>

        {/* ============================ TODAY'S BEST DEALS (reference so-deals + countdown) ============================ */}
        {topDeals.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-[32px] font-[850] tracking-tight leading-tight font-sans text-slate-900">
                  Hot Deals <span className="align-middle text-base font-bold text-[#FF334F]">🔥</span>
                </h2>
                <div className="mt-1.5 text-sm text-slate-500">The steepest real discounts we're tracking right now</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden sm:block text-[12px] font-bold uppercase tracking-wider text-slate-400">Ends in</span>
                <DealsCountdown />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {topDeals.map(p => {
                const disc = p.discountPercentage || (Number(p.referencePrice) > Number(p.currentPrice)
                  ? Math.round((1 - Number(p.currentPrice) / Number(p.referencePrice)) * 100) : 0);
                return (
                  <a key={p.id} href={`/products/${p.slug}`} data-gravity-cursor="view"
                    className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-[0_18px_44px_-16px_rgba(36,107,255,0.3)] hover:-translate-y-1 hover:border-[#246BFF]/40 transition-all duration-300">
                    <div className="relative bg-white h-[225px] flex items-center justify-center overflow-hidden p-4">
                      {disc > 0 && (
                        <span className="absolute top-2.5 left-2.5 z-10 bg-[#FF334F] text-white text-[12px] font-black px-2.5 py-1 rounded-lg shadow-md">−{disc}%</span>
                      )}
                      {p.isDeal && (
                        <span className="absolute top-2.5 right-2.5 z-10 bg-[#FF8A00] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">Deal</span>
                      )}
                      <img src={proxyImageUrl(p.images?.[0] || p.productImage) || NO_IMAGE} alt={p.title} loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain mix-blend-normal drop-shadow-[0_14px_20px_rgba(15,23,42,0.12)] transition-transform duration-500 group-hover:scale-108"
                        onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                    </div>
                    <div className="flex flex-col flex-1 gap-1.5 px-3.5 pb-3.5 pt-1">
                      <p className="text-[11px] font-bold text-[#246BFF] uppercase tracking-wide truncate">{p.brand}</p>
                      <h3 className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug min-h-[36px]">{p.title}</h3>
                      <Stars rating={p.rating} count={p.reviewCount} size={13} />
                      <PriceBlock price={p.currentPrice || p.price} was={p.referencePrice} />
                      <span className="mt-auto pt-1.5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1a2b4a] to-[#0f1d35] hover:from-[#0f1d35] hover:to-[#0a1428] text-white text-[13px] font-bold py-3 shadow-[0_6px_16px_-6px_rgba(26,43,74,0.5)] transition-all group-hover:shadow-[0_10px_22px_-6px_rgba(26,43,74,0.6)]">
                        Check Price on Amazon
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================ BANNER ROW 2 (reference home1-banner-2) ============================ */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((idx) => {
              const tile = heroTiles[idx];
              return (
              <BannerInlineEditor
                key={tile.label + idx}
                placement={(`hero_tile_${idx + 1}`) as any}
                banner={bannerSlots.heroTiles[idx]}
                align="left"
              >
              <a href={tile.href} data-gravity-cursor="explore"
                className="relative overflow-hidden rounded-2xl min-h-[190px] flex items-end border border-white/80 bg-gradient-to-br from-black/60 to-transparent shadow-[0_14px_40px_-18px_rgba(36,107,255,0.3)] group">
                {tile.imageUrl ? (
                  <img src={tile.imageUrl} alt={tile.label} loading="lazy" referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : tile.img ? (
                  <img src={proxyImageUrl(tile.img.images?.[0] || tile.img.productImage) || NO_IMAGE} alt={tile.label}
                    referrerPolicy="no-referrer" loading="lazy"
                    className="absolute right-0 top-0 w-full h-full object-cover opacity-30 transition-transform duration-700 group-hover:scale-110"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div className="relative z-10 p-5 md:p-6">
                <span className="inline-block bg-[#FF8A00] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 shadow-sm">{tile.label}</span>
                <h3 className="text-xl md:text-2xl font-[900] text-white leading-tight drop-shadow-md max-w-[75%]">{tile.sub}</h3>
                <span className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-white bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-3 py-1.5 transition-colors group-hover:bg-white/25">
                  Shop now
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </a>
            </BannerInlineEditor>
              );
            })}
          </div>
        </section>

        {/* ============================ SHOP BY CATEGORY (Branded Cards) ============================ */}
        <section>
          <SectionHead title="Shop by Category" sub="From tech to self-care — every pick independently scored" href="/categories" label="All Categories" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {shopCategories.slice(0, 10).map((cat, i) => {
              const gradients: (keyof typeof GRADIENTS)[] = ['tech', 'premium', 'deal', 'nature', 'sunset', 'dark', 'beauty', 'hero', 'tech', 'premium'];
              return (
                <CategoryCard
                  key={cat.id}
                  name={cat.name}
                  slug={cat.slug}
                  image={categoryImage(cat)}
                  productCount={productCountFor(cat.name)}
                  gradient={gradients[i % gradients.length]}
                />
              );
            })}
          </div>
        </section>

        {/* ============================ TABBED PRODUCT RAILS (reference so-listing-tabs) ============================ */}
        {tabCategories.length > 0 && (
          <section>
            <SectionHead title="Popular Right Now" sub="Top-rated picks across our best categories" href="/products?sort=rating" label="All Products" />
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tabCategories.map((cat, i) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                    activeTab === i
                      ? 'bg-[#246BFF] text-white shadow-[0_8px_20px_-8px_rgba(36,107,255,0.6)]'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-[#246BFF]/40 hover:text-[#246BFF]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {tabProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {tabProducts.map(p => {
                  const disc = p.discountPercentage || (Number(p.referencePrice) > Number(p.currentPrice)
                    ? Math.round((1 - Number(p.currentPrice) / Number(p.referencePrice)) * 100) : 0);
                  return (
                    <a key={p.id} href={`/products/${p.slug}`} data-gravity-cursor="view"
                      className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-[0_18px_44px_-16px_rgba(36,107,255,0.3)] hover:-translate-y-1 hover:border-[#246BFF]/40 transition-all duration-300">
                      <div className="relative bg-white h-[200px] flex items-center justify-center overflow-hidden p-4">
                        {disc > 0 && (
                          <span className="absolute top-2.5 left-2.5 z-10 bg-[#FF334F] text-white text-[12px] font-black px-2.5 py-1 rounded-lg shadow-md">−{disc}%</span>
                        )}
                        <img src={proxyImageUrl(p.images?.[0] || p.productImage) || NO_IMAGE} alt={p.title} loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain mix-blend-normal drop-shadow-[0_14px_20px_rgba(15,23,42,0.12)] transition-transform duration-500 group-hover:scale-108"
                          onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                      </div>
                      <div className="flex flex-col flex-1 gap-1.5 px-3.5 pb-3.5 pt-1">
                        <p className="text-[11px] font-bold text-[#246BFF] uppercase tracking-wide truncate">{p.brand}</p>
                        <h3 className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug min-h-[36px]">{p.title}</h3>
                        <Stars rating={p.rating} count={p.reviewCount} size={13} />
                        <PriceBlock price={p.currentPrice || p.price} was={p.referencePrice} />
                        <span className="mt-auto pt-1.5 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1a2b4a] to-[#0f1d35] hover:from-[#0f1d35] hover:to-[#0a1428] text-white text-[13px] font-bold py-3 shadow-[0_6px_16px_-6px_rgba(26,43,74,0.5)] transition-all group-hover:shadow-[0_10px_22px_-6px_rgba(26,43,74,0.6)]">
                          Check Price on Amazon
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-slate-500 py-8 text-center bg-white rounded-2xl border border-slate-200">Products coming soon.</p>
            )}
          </section>
        )}

        {/* ============================ BANNER ROW 3 (reference banner-tab) ============================ */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((idx) => {
              const tile = heroTiles[idx];
              return (
              <BannerInlineEditor
                key={tile.label + idx}
                placement={(`hero_tile_${idx + 1}`) as any}
                banner={bannerSlots.heroTiles[idx]}
                align="left"
              >
              <a href={tile.href} data-gravity-cursor="explore"
                className="relative overflow-hidden rounded-2xl min-h-[190px] flex items-end border border-white/80 bg-gradient-to-br from-black/60 to-transparent shadow-[0_14px_40px_-18px_rgba(36,107,255,0.3)] group">
                {tile.imageUrl ? (
                  <img src={tile.imageUrl} alt={tile.label} loading="lazy" referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : tile.img ? (
                  <img src={proxyImageUrl(tile.img.images?.[0] || tile.img.productImage) || NO_IMAGE} alt={tile.label}
                    referrerPolicy="no-referrer" loading="lazy"
                    className="absolute right-0 top-0 w-full h-full object-cover opacity-30 transition-transform duration-700 group-hover:scale-110"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                <div className="relative z-10 p-5 md:p-6">
                  <span className="inline-block bg-[#FF8A00] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 shadow-sm">{tile.label}</span>
                  <h3 className="text-xl md:text-2xl font-[900] text-white leading-tight drop-shadow-md max-w-[75%]">{tile.sub}</h3>
                  <span className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-white bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-3 py-1.5 transition-colors group-hover:bg-white/25">
                    Shop now
                    <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </a>
              </BannerInlineEditor>
              );
            })}
          </div>
        </section>

        {/* ============================ COMPARISON + AI ============================ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Featured comparison — LIGHT gradient, NO navy, product cutouts */}
          <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#EAF2FF_0%,#F7FAFF_55%,#FFF3E6_100%)] border border-[#246BFF]/15 p-7 md:p-9 min-h-[320px] flex flex-col shadow-[0_16px_50px_-24px_rgba(36,107,255,0.35)]">
            <div className="absolute -right-12 -top-14 w-52 h-52 rounded-full bg-[#246BFF]/10 blur-2xl" />
            <div className="relative flex-1">
              <span className="inline-flex items-center gap-1.5 bg-[#246BFF] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Featured Comparison <span className="text-amber-300">⚔️</span>
              </span>
              <h2 className="text-2xl md:text-[26px] font-[850] text-slate-900 leading-tight">Who Wins Head-to-Head?</h2>
              <p className="mt-2.5 text-sm text-slate-600 max-w-md leading-relaxed">
                Pick two products and our lab breaks down specs, real user sentiment, prices and a clear winner — in one screen.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm">
                <div className="rounded-2xl bg-white/80 border border-[#246BFF]/15 p-3 text-center shadow-sm">
                  <p className="text-[11px] font-bold text-[#246BFF] uppercase">2–4 products</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">Side-by-side specs</p>
                </div>
                <div className="rounded-2xl bg-white/80 border border-[#FF8A00]/25 p-3 text-center shadow-sm">
                  <p className="text-[11px] font-bold text-[#FF8A00] uppercase">1 clear winner</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">+ best budget pick</p>
                </div>
              </div>
            </div>
            {sortedByScore.length >= 2 && (
              <div className="relative mt-6 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 rounded-2xl bg-white/90 border border-slate-100 p-3 shadow-sm">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                    <img src={proxyImageUrl(sortedByScore[0].images?.[0] || sortedByScore[0].productImage) || NO_IMAGE} alt={sortedByScore[0].title} referrerPolicy="no-referrer" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block bg-[#246BFF] text-white text-[9px] font-black px-1.5 py-0.5 rounded mb-1">A</span>
                    <p className="text-[12px] font-bold text-slate-800 truncate">{sortedByScore[0].title}</p>
                    <p className="text-[11px] text-slate-400">★ {(sortedByScore[0].rating || 0).toFixed(1)} · Score {(sortedByScore[0].editorScore || 0).toFixed(1)}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-black text-slate-400 bg-slate-100 rounded-full w-7 h-7 grid place-items-center">VS</span>
                <div className="flex-1 flex items-center gap-3 rounded-2xl bg-white/90 border border-slate-100 p-3 shadow-sm">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                    <img src={proxyImageUrl(sortedByScore[1].images?.[0] || sortedByScore[1].productImage) || NO_IMAGE} alt={sortedByScore[1].title} referrerPolicy="no-referrer" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                  </div>
                  <div className="min-w-0">
                    <span className="inline-block bg-[#FF8A00] text-white text-[9px] font-black px-1.5 py-0.5 rounded mb-1">B</span>
                    <p className="text-[12px] font-bold text-slate-800 truncate">{sortedByScore[1].title}</p>
                    <p className="text-[11px] text-slate-400">★ {(sortedByScore[1].rating || 0).toFixed(1)} · Score {(sortedByScore[1].editorScore || 0).toFixed(1)}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="relative mt-6 flex flex-wrap gap-3">
              <a href="/compare" className="inline-flex items-center gap-2 rounded-xl bg-[#246BFF] hover:bg-[#164EE8] text-white font-bold px-6 py-3 text-sm shadow-[0_10px_26px_-10px_rgba(36,107,255,0.6)] transition-all hover:-translate-y-0.5">
                Open the Compare Tool
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5-5 5M6 12h12" /></svg>
              </a>
              <a href="/compare" className="inline-flex items-center gap-2 rounded-xl border border-[#246BFF]/40 text-[#246BFF] hover:bg-[#246BFF]/5 font-bold px-6 py-3 text-sm transition-all">
                View Latest Matchups
              </a>
            </div>
          </div>

          {/* AI product finder — light lavender/white, NO navy, mascot on the right */}
          <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#EAF2FF_0%,#FFFFFF_55%,#F3EEFF_100%)] border border-[#246BFF]/15 p-7 md:p-9 min-h-[320px] flex flex-col shadow-[0_16px_50px_-24px_rgba(36,107,255,0.35)]">
            <div className="absolute -right-12 -bottom-14 w-56 h-56 rounded-full bg-[#4F7CFF]/10 blur-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 items-center flex-1">
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#4F7CFF] to-[#246BFF] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                  ✨ AI Product Finder
                </span>
                <h2 className="text-2xl md:text-[26px] font-[850] text-slate-900 leading-tight">Can’t Decide? Ask the Research Bot.</h2>
                <p className="mt-2.5 text-sm text-slate-600 max-w-md leading-relaxed">
                  Tell us your budget and needs — our AI compares the catalog, quotes real prices, and lands on a pick with an honest verdict.
                </p>
                <div className="mt-5 max-w-sm">
                  <div className="bg-white/85 border border-white/90 rounded-2xl px-4 py-3 shadow-sm backdrop-blur">
                    <p className="text-[12px] font-bold text-slate-400 mb-1">
                      <span className="inline-block w-5 h-5 rounded-full bg-[#246BFF] text-white text-center leading-5 text-[10px] mr-1">AI</span>
                      Sample question
                    </p>
                    <p className="text-[13.5px] text-slate-700 leading-relaxed">“Which Korean moisturizer under $40 suits dry skin, with the highest editor score?”</p>
                  </div>
                </div>
                <div className="relative mt-5 flex flex-wrap gap-3">
                  <button onClick={onOpenAiFinder} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#246BFF] to-[#4F7CFF] hover:from-[#164EE8] hover:to-[#246BFF] text-white font-bold px-6 py-3 text-sm shadow-[0_10px_26px_-10px_rgba(36,107,255,0.6)] transition-all hover:-translate-y-0.5">
                    Open Product Finder
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <button onClick={onOpenChatbot} className="inline-flex items-center gap-2 rounded-xl border border-[#4F7CFF]/40 text-[#246BFF] hover:bg-[#246BFF]/5 font-bold px-6 py-3 text-sm transition-all">
                    Ask DawnWire AI
                  </button>
                </div>
              </div>
              <div className="relative hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-b from-[#4F7CFF]/10 to-transparent rounded-full blur-2xl" />
                <MascotAnimation className="relative w-full max-w-[260px] mx-auto drop-shadow-[0_24px_40px_rgba(36,107,255,0.35)]" />
              </div>
            </div>
          </div>
        </section>

        {/* ============================ LATEST BUYING GUIDES (reference so-latest-blog) ============================ */}
        {posts.length > 0 && (
          <section>
            <SectionHead title="Latest Buying Guides" sub="What to look for before you buy" href="/guides" label="All Guides" />
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {posts.map(post => {
                const cat = categories.find(c => c.id === post.categoryId);
                const guideImg = post.featuredImage
                  ? proxyImageUrl(post.featuredImage)
                  : (cat ? categoryImage(cat) : NO_IMAGE) || NO_IMAGE;
                return (
                  <a key={post.id} href={`/post/${post.slug}`} data-gravity-cursor="view"
                    className="group flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-[0_16px_40px_-18px_rgba(36,107,255,0.3)] hover:-translate-y-1 hover:border-[#246BFF]/40 transition-all duration-300">
                    <div className="relative h-[165px] overflow-hidden bg-[#F1F6FF]">
                      <img src={guideImg} alt={post.title} loading="lazy" referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
                      <span className="absolute top-2 left-2 bg-white/90 backdrop-blur text-[#246BFF] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                        {cat?.name || 'Guide'}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1 p-3.5">
                      <h3 className="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#246BFF] transition-colors">{post.title}</h3>
                      <p className="text-[12px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{post.excerpt}</p>
                      <p className="mt-auto pt-2 text-[11px] font-bold text-slate-400">{post.readingTime || 6} min read</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================ SHOP BY BRAND (reference top-brand slider) ============================ */}
        {brandsAll.length > 0 && (
          <section>
            <SectionHead title="Shop by Brand" sub="Brands we've tested and recommend" href="/brands" label="All Brands" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {brandsAll.map(brand => (
                <a key={brand.id} href={`/products?brand=${encodeURIComponent(brand.name)}`} data-gravity-cursor="explore"
                  className="group flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200 px-4 py-5 hover:border-[#246BFF]/40 hover:shadow-[0_12px_30px_-14px_rgba(36,107,255,0.3)] transition-all min-h-[104px]">
                  {brand.logoUrl || brand.logo ? (
                    <span className="w-14 h-14 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden p-1.5 group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={proxyImageUrl(brand.logoUrl || brand.logo || '')}
                        alt={brand.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).parentElement!.classList.add('hidden'); }}
                        className="w-full h-full object-contain"
                      />
                    </span>
                  ) : (
                    <span className="w-11 h-11 rounded-full bg-[#EAF2FF] text-[#246BFF] grid place-items-center text-base font-black shrink-0">
                      {brand.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="text-[13px] font-bold text-slate-700 group-hover:text-[#246BFF] transition-colors truncate max-w-full">{brand.name}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ============================ NEWSLETTER STRIP (reference newsletter_promo) ============================ */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#164EE8] via-[#246BFF] to-[#4F7CFF] px-7 md:px-12 py-10 md:py-12">
          <div className="absolute -top-24 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 w-64 h-64 rounded-full bg-[#FF8A00]/25 blur-3xl" />
          <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-white/15 text-white text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/25">
                ✉️ Deals straight to your inbox
              </span>
              <h2 className="mt-4 text-2xl md:text-4xl font-[900] tracking-tight text-white leading-tight">
                Never Miss a Price Drop
              </h2>
              <p className="mt-2.5 text-white/80 text-sm md:text-base max-w-lg leading-relaxed">
                Join our newsletter and get the hottest Amazon deals, buying guides and early access — before they sell out.
              </p>
            </div>
            <form onSubmit={submitNewsletter} className="w-full">
              <div className="bg-white rounded-2xl p-1.5 flex items-stretch gap-1 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.4)]">
                <span className="hidden sm:flex items-center pl-3 text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  value={nlEmail}
                  onChange={e => setNlEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  className="flex-1 min-w-0 bg-transparent px-3 sm:px-2 py-3.5 text-[15px] text-slate-900 placeholder-slate-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={nlBusy}
                  className="bg-[#246BFF] hover:bg-[#164EE8] disabled:opacity-60 text-white font-bold px-6 py-3 rounded-xl shrink-0 transition-colors"
                >
                  {nlBusy ? 'Sending…' : 'Subscribe'}
                </button>
              </div>
              {nlMsg && (
                <p className={`mt-3 text-[13px] font-bold ${nlMsg.ok ? 'text-emerald-200' : 'text-amber-200'}`}>{nlMsg.text}</p>
              )}
              <p className="mt-3 text-[12px] text-white/60">No spam, ever. Unsubscribe anytime.</p>
            </form>
          </div>
        </section>
      </main>

      {/* ============================ AFFILIATE DISCLOSURE ============================ */}
      <section className="border-t border-slate-200/80 bg-white py-8">
        <div className="commerce-container flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-slate-500 max-w-2xl text-center md:text-left">
            <strong className="text-slate-700">Independent &amp; honest.</strong> DawnWire earns a small commission
            when you buy through links marked &quot;on Amazon&quot; — at no extra cost to you. Prices checked daily; may change after publish.
          </p>
          <a href="/affiliate-disclosure" className="shrink-0 text-[13px] font-bold text-[#246BFF] hover:text-[#1a57e0] flex items-center gap-1 whitespace-nowrap">
            Full Disclosure
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>
      </section>
    </div>
  );
};
