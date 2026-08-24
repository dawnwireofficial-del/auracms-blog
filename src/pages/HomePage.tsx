import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { proxyImageUrl } from '../utils/safeRender';
import { assignHomepageSlots } from '../lib/homepageSlots';
import { AnimatedCategoryIcon } from '../components/common/AnimatedCategoryIcon';
import MascotAnimation from '../components/MascotAnimation';
import { useReducedMotion } from '../components/useReducedMotion';
import BannerInlineEditor from '../components/admin/BannerInlineEditor';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { triggerPageLoadProgress } from '../lib/navigation';
import { BRAND_KIT } from '../lib/brandKit';
import AntigravityCanvas from '../components/visual/AntigravityCanvas';
import type { Product, Post, Category } from '../types';

interface HomePageProps {
  onOpenAiFinder: () => void;
  onOpenChatbot: () => void;
}

const NO_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#f8fafc"/><g fill="none" stroke="#cbd5e1" stroke-width="2"><circle cx="150" cy="138" r="46"/><path d="M66 238c8-48 46-72 84-72s76 24 84 72"/></g></svg>'
);

/* ─────────────────────────────────────────────────────────────
   1. Section Heading Component (Uniform Alignment & Styling)
───────────────────────────────────────────────────────────── */
function SectionHeading({
  title,
  subtitle,
  badge,
  viewAllHref,
  viewAllText = 'View All'
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  viewAllHref?: string;
  viewAllText?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        {badge && (
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-0.5 rounded-md mb-1.5">
            {badge}
          </span>
        )}
        <h2 className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {viewAllHref && (
        <a
          href={viewAllHref}
          className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1 shrink-0 transition-colors group"
        >
          <span>{viewAllText}</span>
          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. Countdown Timer Component
───────────────────────────────────────────────────────────── */
function DealsCountdown() {
  const [left, setLeft] = useState('00:00:00');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const [hh, mm, ss] = left.split(':');

  return (
    <div className="inline-flex items-center gap-1.5" aria-label="Deals countdown">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">Ends in:</span>
      {[
        { val: hh, label: 'H' },
        { val: mm, label: 'M' },
        { val: ss, label: 'S' }
      ].map((item, idx) => (
        <React.Fragment key={item.label}>
          <div className="flex items-center justify-center bg-slate-900 text-amber-400 font-mono font-black text-sm px-2 py-1 rounded-lg shadow-inner min-w-[32px]">
            {item.val}
          </div>
          {idx < 2 && <span className="text-slate-400 font-bold">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. ONE Shared Unified Reusable Product Card
───────────────────────────────────────────────────────────── */
function UnifiedProductCard({
  product,
  badge
}: {
  product: Product;
  badge?: string;
}) {
  const p = product;
  const currentPrice = Number(p.currentPrice || p.price || 0);
  const referencePrice = Number(p.referencePrice || 0);
  const discount = p.discountPercentage || (referencePrice > currentPrice ? Math.round((1 - currentPrice / referencePrice) * 100) : 0);
  const savings = referencePrice > currentPrice ? (referencePrice - currentPrice).toFixed(2) : null;
  const hasScore = (p.editorScore || 0) > 0;

  return (
    <div className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400/80 dark:hover:border-blue-500/80 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden h-full">
      {/* Top Image Container */}
      <a
        href={`/products/${p.slug}`}
        className="relative bg-slate-50/70 dark:bg-slate-800/60 aspect-square flex items-center justify-center p-4 overflow-hidden"
        data-gravity-cursor="view"
      >
        {/* Discount & Custom Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
          {discount > 0 && (
            <span className="bg-red-600 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-xs">
              -{discount}%
            </span>
          )}
          {badge && (
            <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wide">
              {badge}
            </span>
          )}
        </div>

        {/* Editor Score Badge */}
        {hasScore && (
          <span className="absolute top-2.5 right-2.5 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
            <span className="text-amber-500">★</span> {(p.editorScore || 0).toFixed(1)}/10
          </span>
        )}

        <img
          src={proxyImageUrl(p.images?.[0] || p.productImage) || NO_IMAGE}
          alt={p.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = NO_IMAGE; }}
        />
      </a>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <span className="truncate">{p.brand || 'DawnWire Pick'}</span>
          {p.isPrime && (
            <span className="text-[10px] text-sky-600 italic bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded font-extrabold shrink-0">
              Prime
            </span>
          )}
        </div>

        <a href={`/products/${p.slug}`} className="block">
          <h3 className="text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug min-h-[36px]">
            {p.title}
          </h3>
        </a>

        {/* Rating */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-3.5 h-3.5 ${star <= Math.round(p.rating || 0) ? 'text-amber-400 fill-current' : 'text-slate-200 dark:text-slate-700 fill-current'}`}
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.977 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ))}
          </div>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{(p.rating || 0).toFixed(1)}</span>
          {p.reviewCount ? <span className="text-slate-400">({Number(p.reviewCount).toLocaleString()})</span> : null}
        </div>

        {/* Price Block */}
        <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between gap-2">
          <div>
            {currentPrice > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-900 dark:text-white">${currentPrice.toFixed(2)}</span>
                {referencePrice > currentPrice && (
                  <span className="text-xs text-slate-400 line-through">${referencePrice.toFixed(2)}</span>
                )}
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-500">Check Price</span>
            )}
            {savings && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">Save ${savings}</span>
            )}
          </div>
        </div>

        {/* Conversion Action */}
        <a
          href={p.affiliateUrl || `https://www.amazon.com/dp/${p.asin || ''}?tag=dawnwire-20`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="w-full mt-1.5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold py-2.5 shadow-xs shadow-orange-500/20 transition-all hover:shadow-md hover:shadow-orange-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          <span>Check Price on Amazon</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. Category Section with Integrated Banner & Product Grid
───────────────────────────────────────────────────────────── */
function CategoryMerchandisingSection({
  title,
  subtitle,
  categorySlug,
  bannerTitle,
  bannerSubtitle,
  bannerBadge,
  bannerCtaText = 'Explore Deals',
  bannerGradient = 'from-blue-900 via-indigo-950 to-slate-900',
  products,
  viewAllHref
}: {
  title: string;
  subtitle?: string;
  categorySlug: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerBadge?: string;
  bannerCtaText?: string;
  bannerGradient?: string;
  products: Product[];
  viewAllHref: string;
}) {
  if (!products || products.length === 0) return null;

  return (
    <section data-reveal className="py-8 border-t border-slate-200/80 dark:border-slate-800">
      <SectionHeading
        title={title}
        subtitle={subtitle}
        viewAllHref={viewAllHref}
        viewAllText={`All ${title.split(' ')[0]}`}
      />

      {/* Category Promotional Banner — designed brand banner when available, else gradient card */}
      {(() => {
        const strip = (BRAND_KIT.categoryStrips as Record<string, string>)[categorySlug];
        if (strip) {
          return (
            <a href={viewAllHref} className="block mb-6 group" aria-label={bannerTitle}>
              <img
                src={strip}
                alt={bannerTitle}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm group-hover:shadow-md transition-shadow"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </a>
          );
        }
        return (
          <div className={`relative rounded-2xl bg-gradient-to-r ${bannerGradient} text-white p-6 sm:p-7 mb-6 overflow-hidden shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4`}>
            <div className="relative z-10 max-w-xl">
              {bannerBadge && (
                <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-md mb-2">
                  {bannerBadge}
                </span>
              )}
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {bannerTitle}
              </h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1">
                {bannerSubtitle}
              </p>
            </div>
            <a
              href={viewAllHref}
              className="relative z-10 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all w-fit shrink-0"
            >
              <span>{bannerCtaText}</span>
              <span>&rarr;</span>
            </a>
          </div>
        );
      })()}

      {/* Product Grid (4-6 Products) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {products.slice(0, 6).map((product) => (
          <UnifiedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main HomePage Component
───────────────────────────────────────────────────────────── */
export const HomePage: React.FC<HomePageProps> = ({ onOpenAiFinder, onOpenChatbot }) => {
  const { products, categories, banners } = useAppStore();
  const [brands, setBrands] = useState<{ id: string; name: string; slug: string; logoUrl?: string; logo?: string }[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // Hero Search & Newsletter State
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHoveringSlider, setIsHoveringSlider] = useState(false);
  const prefersReduced = useReducedMotion();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Banner slots from admin
  const bannerSlots = useMemo(() => assignHomepageSlots(banners), [banners]);

  // Fetch Public Brands & Guides
  useEffect(() => {
    fetch('/api/public/brands?limit=24')
      .then(r => r.json())
      .then(data => setBrands(Array.isArray(data) ? data : (data?.data || [])))
      .catch(() => {});

    fetch('/api/public/posts?limit=6')
      .then(r => r.json())
      .then(data => setPosts(Array.isArray(data) ? data : (data?.data || [])))
      .catch(() => {});
  }, []);

  // Sorted Products by Editor Score
  const sortedByScore = useMemo(
    () => [...products].sort((a, b) => (b.editorScore || 0) - (a.editorScore || 0)),
    [products]
  );

  // Top Deals
  const topDeals = useMemo(() => {
    const dealList = sortedByScore.filter(p => p.isDeal || p.discountPercentage || (Number(p.referencePrice) > Number(p.currentPrice)));
    const sortedDeals = dealList.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    return (sortedDeals.length > 0 ? sortedDeals : sortedByScore).slice(0, 6);
  }, [sortedByScore]);

  // Category Filtering Helper for Merchandise Sections
  const getProductsForKeywords = (keywords: string[], fallbackOffset = 0, count = 6, categorySlug?: string) => {
    // Only true matches — never pad with unrelated top-scored products.
    const catName = categorySlug ? categories.find(c => c.slug === categorySlug)?.name?.toLowerCase() : '';
    const matched = products.filter(p => {
      const pCatId = (p as any).categoryId || '';
      const pCatName = (p.mainCategory || p.category || '').toLowerCase();
      if (categorySlug && (pCatId === categorySlug || pCatName === catName)) return true;
      const pTitle = (p.title || '').toLowerCase();
      const pBestFor = (p.bestFor || '').toLowerCase();
      return keywords.some(kw => pTitle.includes(kw) || pBestFor.includes(kw));
    }).sort((a, b) => (b.editorScore || 0) - (a.editorScore || 0));

    return matched.slice(0, count);
  };

  const electronicsProducts = useMemo(() => getProductsForKeywords(['electron', 'audio', 'headphone', 'phone', 'laptop', 'monitor', 'tv', 'watch', 'camera'], 0, 6, 'electronics'), [products, categories]);
  const beautyProducts = useMemo(() => getProductsForKeywords(['beauty', 'skincare', 'hair', 'cream', 'serum', 'lotion', 'makeup', 'cleanser'], 3, 6, 'beauty-personal-care'), [products, categories]);
  const homeProducts = useMemo(() => getProductsForKeywords(['home', 'kitchen', 'cookware', 'coffee', 'blender', 'vacuum', 'appliance', 'air fryer'], 6, 6, 'home-kitchen'), [products, categories]);
  const gamingProducts = useMemo(() => getProductsForKeywords(['game', 'gaming', 'keyboard', 'mouse', 'controller', 'console', 'gpu', 'headset'], 9, 6, 'gaming'), [products, categories]);
  const officeProducts = useMemo(() => getProductsForKeywords(['office', 'desk', 'chair', 'ergonomic', 'productivity', 'printer', 'hub', 'stand'], 12, 6, 'office-productivity'), [products, categories]);
  const healthProducts = useMemo(() => getProductsForKeywords(['health', 'fitness', 'wellness', 'supplement', 'vitamin', 'exercise', 'massage'], 15, 6, 'health-wellness'), [products, categories]);

  // Full Category Taxonomy for Shop by Category Rail
  const fullTaxonomyCategories = useMemo(() => {
    const list = [
      { id: 'cat-elec', name: 'Electronics', slug: 'electronics', icon: 'zap' },
      { id: 'cat-beauty', name: 'Beauty & Personal Care', slug: 'beauty-personal-care', icon: 'sparkles' },
      { id: 'cat-home', name: 'Home & Kitchen', slug: 'home-kitchen', icon: 'home' },
      { id: 'cat-fashion', name: 'Fashion & Clothing', slug: 'fashion-clothing', icon: 'shopping-bag' },
      { id: 'cat-health', name: 'Health & Wellness', slug: 'health-wellness', icon: 'heart' },
      { id: 'cat-gaming', name: 'Gaming & VR', slug: 'gaming', icon: 'gamepad' },
      { id: 'cat-office', name: 'Office & Productivity', slug: 'office-productivity', icon: 'briefcase' },
      { id: 'cat-sports', name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: 'activity' },
      { id: 'cat-auto', name: 'Automotive', slug: 'automotive', icon: 'truck' },
      { id: 'cat-toys', name: 'Toys & Games', slug: 'toys-games', icon: 'smile' },
      { id: 'cat-baby', name: 'Baby Products', slug: 'baby-products', icon: 'gift' },
      { id: 'cat-computer', name: 'Computer Accessories', slug: 'computer-accessories', icon: 'cpu' },
      { id: 'cat-ai', name: 'AI & Software Tools', slug: 'ai-software-tools', icon: 'layers' },
      { id: 'cat-books', name: 'Books & Reading', slug: 'books-reading', icon: 'book' }
    ];

    // Merge in any custom categories from backend
    categories.forEach(c => {
      if (!list.some(item => item.slug === c.slug || item.name.toLowerCase() === c.name.toLowerCase())) {
        list.push({ id: c.id, name: c.name, slug: c.slug, icon: c.icon || 'tag' });
      }
    });

    return list;
  }, [categories]);

  // Slides setup — pure designed banner display (no text/search/CTA overlays).
  const heroSlides = useMemo(() => {
    return BRAND_KIT.heroes.map((h, i) => ({
      id: `brand-hero-${i}`,
      ctaHref: h.href,
      image: proxyImageUrl(h.desktop) || '',
      mobileImage: proxyImageUrl(h.mobile) || '',
    }));
  }, []);

  const totalSlides = heroSlides.length;

  // Autoplay Slider
  useEffect(() => {
    if (prefersReduced || isHoveringSlider || totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(interval);
  }, [prefersReduced, isHoveringSlider, totalSlides]);

  const goToSlide = (idx: number) => {
    setCurrentSlide(((idx % totalSlides) + totalSlides) % totalSlides);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      goToSlide(currentSlide + 1);
    } else if (diff < -45) {
      goToSlide(currentSlide - 1);
    }
  };

  const [isHeroScrolled, setIsHeroScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsHeroScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Search Submit
  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearchQuery.trim()) {
      triggerPageLoadProgress();
      window.location.href = `/search?q=${encodeURIComponent(heroSearchQuery.trim())}`;
    }
  };

  // Newsletter Submit
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || newsletterLoading) return;
    setNewsletterLoading(true);
    setNewsletterStatus(null);
    try {
      const res = await fetch('/api/public/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() })
      });
      if (res.ok) {
        setNewsletterStatus({ ok: true, msg: '🎉 You are subscribed! Check your inbox for price drop alerts.' });
        setNewsletterEmail('');
      } else {
        setNewsletterStatus({ ok: false, msg: 'Unable to subscribe right now. Please try again.' });
      }
    } catch {
      setNewsletterStatus({ ok: false, msg: 'Network error. Please check your connection.' });
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          FTC Affiliate Disclosure Banner
      ───────────────────────────────────────────────────────────── */}
      <DisclosureBanner />

      {/* Global Container Wrapper: Unified max-w grid across entire page */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-6 space-y-12 py-4 sm:py-6">
        
        {/* ─────────────────────────────────────────────────────────────
            5. HERO COMMERCE AREA (Reduced height, ~68% / ~32% split)
        ───────────────────────────────────────────────────────────── */}
        <section
          className="pt-2"
          onMouseEnter={() => setIsHoveringSlider(true)}
          onMouseLeave={() => setIsHoveringSlider(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* ── HERO: full-width, native 1916×821 banner carousel ── */}
          <div className={`relative rounded-2xl sm:rounded-3xl bg-[#0A1F44] text-white overflow-hidden shadow-lg aspect-[16/9] sm:aspect-[1916/821] ${isHeroScrolled ? 'hero-gradient-shift scrolled' : 'hero-gradient-shift'}`}>
            {/* Slider Content — designed banner, full bleed, exact ratio (no crop) */}
            {heroSlides[currentSlide]?.image ? (
              <a
                href={heroSlides[currentSlide].ctaHref}
                className="absolute inset-0 z-10 block"
                aria-label="Featured deals banner"
              >
                <picture>
                  <source media="(max-width: 767px)" srcSet={heroSlides[currentSlide].mobileImage || heroSlides[currentSlide].image} />
                  <img
                    src={heroSlides[currentSlide].image}
                    alt="Featured deals banner"
                    loading={currentSlide === 0 ? 'eager' : 'lazy'}
                    fetchPriority={currentSlide === 0 ? 'high' : undefined}
                    className="w-full h-full object-cover transition-opacity duration-700 ease-out hover:opacity-90 group-hover:opacity-100"
                  />
                </picture>
              </a>
            ) : null}

            {/* Slider Dots + Arrows */}
            {totalSlides > 1 && (
              <div className="absolute bottom-4 left-0 right-0 z-20 px-5 sm:px-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentSlide === idx ? 'w-8 bg-orange-500' : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <button
                    onClick={() => goToSlide(currentSlide - 1)}
                    className="w-8 h-8 rounded-lg bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center border border-white/10"
                    aria-label="Previous slide"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => goToSlide(currentSlide + 1)}
                    className="w-8 h-8 rounded-lg bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center border border-white/10"
                    aria-label="Next slide"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── PROMO ROW: the four 784×502 banners directly under the hero ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5 mt-3.5 sm:mt-4">
            {BRAND_KIT.sidePromos.map((card) => (
              <a
                key={card.href}
                href={card.href}
                className="group relative rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 block aspect-[784/502]"
              >
                <img
                  src={proxyImageUrl(card.src)}
                  alt={card.alt}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </a>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            5b. TRENDING SEARCHES (internal-linking chip rail)
        ───────────────────────────────────────────────────────────── */}
        <section data-reveal className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">Trending:</span>
          {[
            ['Air Fryer', '/categories/home-kitchen'],
            ['Korean Skincare', '/categories/beauty-personal-care'],
            ['Gaming Headsets', '/categories/gaming'],
            ['Back to School', '/events/back-to-school'],
            ['Black Friday', '/events/black-friday'],
            ['School Supplies', '/categories/school-office-supplies'],
            ['Coffee Gear', '/categories/home-kitchen'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-xs transition-colors"
            >
              {label}
            </a>
          ))}
        </section>

{/* ─────────────────────────────────────────────────────────────
            6. TRUST STRIP (5-Item Credibility Bar — Amazon Verified Links removed)
        ───────────────────────────────────────────────────────────── */}
        <section data-reveal className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
            {[
              {
                title: 'Independently Reviewed',
                desc: 'Lab-tested specs & verdicts',
                icon: '🛡️'
              },
              {
                title: 'Live Price Checks',
                desc: '24/7 Amazon sync',
                icon: '⚡'
              },
              {
                title: 'Price History Tracking',
                desc: 'Real deal verification',
                icon: '📉'
              },
              {
                title: 'Expert Buying Guides',
                desc: 'Unbiased category roundups',
                icon: '📚'
              },
              {
                title: 'Secure Affiliate Links',
                desc: '100% free buyer service',
                icon: '🔒'
              }
            ].map((item) => (
              <div key={item.title} className="group flex items-center gap-3 p-3 md:p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex-1 md:flex-none min-w-[280px]">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-900/30 dark:to-orange-900/30 border border-slate-200/80 dark:border-slate-700 group-hover:border-blue-400 group-hover:shadow-md transition-all duration-300">
                  {BRAND_KIT.trustIcons[item.title] ? (
                    <img
                      src={BRAND_KIT.trustIcons[item.title]}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 md:w-7 md:h-7 rounded object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-xl md:text-2xl" aria-hidden="true">{item.icon}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors whitespace-nowrap">{item.title}</p>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-tight truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            7. SHOP BY CATEGORY (Full Taxonomy Grid & Rail)
        ───────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeading
            title="Shop by Category"
            subtitle="Explore our comprehensive testing taxonomy across 14+ departments"
            viewAllHref="/categories"
            viewAllText="View All Categories"
          />

          {/* Auto-scrolling category marquee (pauses on hover) — circles only */}
          <div className="dw-marquee relative overflow-hidden py-8">
            <div className="dw-marquee-track flex items-center gap-8 w-max px-6">
              {[...fullTaxonomyCategories, ...fullTaxonomyCategories].map((cat, i) => {
                const dbCat = categories.find(c => c.slug === cat.slug);
                const brandIcon = dbCat?.image || '';
                return (
                  <a
                    key={`${cat.id}-${i}`}
                    href={`/categories/${cat.slug}`}
                    className="group flex flex-col items-center justify-center shrink-0 transition-colors text-center"
                  >
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden mb-4 group-hover:border-blue-400 group-hover:shadow-xl transition-all group-hover:scale-110">
                      {brandIcon ? (
                        <img
                          src={brandIcon}
                          alt={cat.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain p-1.5 group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <AnimatedCategoryIcon
                          slug={cat.slug}
                          icon={cat.icon || 'tag'}
                          className="w-14 h-14 md:w-18 md:h-18 text-blue-600 dark:text-blue-400"
                        />
                      )}
                    </div>
                    <span className="text-[14px] md:text-[15px] font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                      {cat.name}
                    </span>
                  </a>
                );
              })}
            </div>
            {/* Edge fade masks */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#F8FAFC] dark:from-slate-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#F8FAFC] dark:from-slate-950 to-transparent" />
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            8. TODAY'S BEST DEALS (6-Column High-Density Grid)
        ───────────────────────────────────────────────────────────── */}
        <section data-reveal className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 border border-orange-200/60 dark:border-orange-800/60 px-2.5 py-0.5 rounded-md mb-1.5">
                🔥 Live Price Drops
              </span>
              <h2 className="text-2xl sm:text-[28px] font-black tracking-tight text-slate-900 dark:text-white">
                Today's Best Amazon Deals
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Steepest verified price drops updated live from Amazon
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <DealsCountdown />
              <a
                href="/deals"
                className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 inline-flex items-center gap-1 transition-colors"
              >
                <span>All Deals &rarr;</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {topDeals.map((product) => (
              <UnifiedProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            8b. FEATURE BANNERS (AI Finder + Price Drop, brand kit)
        ───────────────────────────────────────────────────────────── */}
        <section data-reveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={BRAND_KIT.featureBanners.aiFinder.href}
            className="group relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg transition-all duration-300 flex items-center justify-center"
          >
            <img
              src={proxyImageUrl(BRAND_KIT.featureBanners.aiFinder.src)}
              alt="AI Product Finder — answer 3 questions and get matched picks"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).closest('a')!.style.display = 'none'; }}
            />
          </a>
          <a
            href={BRAND_KIT.featureBanners.priceDrop.href}
            className="group relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs hover:shadow-lg transition-all duration-300 flex items-center justify-center"
          >
            <img
              src={proxyImageUrl(BRAND_KIT.featureBanners.priceDrop.src)}
              alt="Live price-drop alerts on Amazon products"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-contain group-hover:scale-[1.01] transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).closest('a')!.style.display = 'none'; }}
            />
          </a>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            9. CATEGORY MERCHANDISING SECTIONS (Repeated Retail Blocks)
        ───────────────────────────────────────────────────────────── */}
        
        {/* Section A: Electronics Deals */}
        <CategoryMerchandisingSection
          title="Electronics Deals & Top Tech"
          subtitle="Lab-tested headphones, 4K monitors, laptops, and smart home gear"
          categorySlug="electronics"
          bannerTitle="Upgrade Your Tech for Less"
          bannerSubtitle="Save up to 40% on noise-cancelling headphones, displays, and smart accessories."
          bannerBadge="Tech Spotlight"
          bannerGradient="from-blue-900 via-indigo-950 to-slate-900"
          products={electronicsProducts}
          viewAllHref="/categories/electronics"
        />

        {/* Section B: Beauty & Personal Care */}
        <CategoryMerchandisingSection
          title="Beauty & Personal Care Picks"
          subtitle="Dermatologist-recommended skincare, haircare, and personal grooming tools"
          categorySlug="beauty-personal-care"
          bannerTitle="Top Beauty Finds Worth Buying"
          bannerSubtitle="Honest reviews on verified Korean skincare, restorative serums, and styling tools."
          bannerBadge="Beauty Lab"
          bannerGradient="from-rose-950 via-pink-950 to-slate-900"
          products={beautyProducts}
          viewAllHref="/categories/beauty-personal-care"
        />

        {/* ─────────────────────────────────────────────────────────────
            11. PROMO BANNER ROW (Between Merchandise Sections)
        ───────────────────────────────────────────────────────────── */}
        <section data-reveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 sm:p-8 flex flex-col justify-between shadow-md">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded mb-2 inline-block">
                Exclusive Event
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">Prime Day & Flash Savings</h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1">
                Score discounts on top-rated gear before deals sell out.
              </p>
            </div>
            <a href="/deals" className="mt-4 inline-flex items-center gap-1 text-xs font-bold bg-white text-blue-700 px-4 py-2.5 rounded-xl w-fit shadow-xs">
              <span>Shop Flash Deals</span>
              <span>&rarr;</span>
            </a>
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 sm:p-8 flex flex-col justify-between shadow-md border border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded mb-2 inline-block">
                Buyer Guides
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">Best of 2026 Roundups</h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1">
                Comprehensive comparison guides across 40+ departments.
              </p>
            </div>
            <a href="/best" className="mt-4 inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2.5 rounded-xl w-fit shadow-xs">
              <span>Read Best-Of Guides</span>
              <span>&rarr;</span>
            </a>
          </div>
        </section>

        {/* Section C: Home & Kitchen */}
        <CategoryMerchandisingSection
          title="Home & Kitchen Essentials"
          subtitle="Top-rated cookware, espresso machines, blenders, and smart appliances"
          categorySlug="home-kitchen"
          bannerTitle="Smart Upgrades for Everyday Living"
          bannerSubtitle="High-performance kitchen gadgets and home essentials tested for durability."
          bannerBadge="Home Lab"
          bannerGradient="from-amber-950 via-orange-950 to-slate-900"
          products={homeProducts}
          viewAllHref="/categories/home-kitchen"
        />

        {/* Section D: Gaming & PC Setup */}
        <CategoryMerchandisingSection
          title="Gaming & PC Accessories"
          subtitle="High-precision gaming mice, mechanical keyboards, monitors, and headsets"
          categorySlug="gaming"
          bannerTitle="Level Up Your Battlestation"
          bannerSubtitle="Competitive gear and ergonomic accessories benchmarked for speed and comfort."
          bannerBadge="Gaming Picks"
          bannerGradient="from-purple-950 via-slate-950 to-blue-950"
          products={gamingProducts}
          viewAllHref="/categories/gaming"
        />

        {/* Section E: Office & Productivity */}
        <CategoryMerchandisingSection
          title="Office & Productivity Tools"
          subtitle="Ergonomic chairs, standing desks, USB-C docks, and daily work gear"
          categorySlug="office-productivity"
          bannerTitle="Work Smarter Every Day"
          bannerSubtitle="Tested workstation tools that boost focus and streamline your workflow."
          bannerBadge="Work Setup"
          bannerGradient="from-slate-900 via-blue-950 to-slate-900"
          products={officeProducts}
          viewAllHref="/categories/office-productivity"
        />

        {/* ─────────────────────────────────────────────────────────────
            12 & 13. FEATURED COMPARISON + AI PRODUCT FINDER
        ───────────────────────────────────────────────────────────── */}
        <section data-reveal className="pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Featured Comparison */}
            <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-blue-200/80 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold w-fit mb-3">
                  <span>⚔️ Head-to-Head Comparison</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Compare Top Products Side-by-Side
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  Can't decide between two options? Our lab comparison breaks down specs, verified ratings, editor verdicts, and price history in one clean matrix.
                </p>

                {sortedByScore.length >= 2 && (
                  <div className="mt-5 grid grid-cols-2 gap-3 bg-white dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 p-1 shrink-0 overflow-hidden">
                        <img
                          src={proxyImageUrl(sortedByScore[0]?.images?.[0] || sortedByScore[0]?.productImage) || NO_IMAGE}
                          alt="Product A"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Option A</span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">{sortedByScore[0]?.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 border-l border-slate-100 dark:border-slate-700 pl-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 p-1 shrink-0 overflow-hidden">
                        <img
                          src={proxyImageUrl(sortedByScore[1]?.images?.[0] || sortedByScore[1]?.productImage) || NO_IMAGE}
                          alt="Product B"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Option B</span>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">{sortedByScore[1]?.title}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <a
                  href="/compare"
                  className="inline-flex items-center gap-2 bg-[#246BFF] hover:bg-[#164EE8] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  <span>Launch Compare Tool</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>

            {/* Right: AI Product Finder */}
            <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-[#0A1F44] to-blue-950 text-white p-6 sm:p-8 flex flex-col justify-between shadow-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-8">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold w-fit mb-3">
                    <span>✨ DawnWire AI Research</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Instant AI Product Advisor
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                    Tell our AI assistant your exact budget and must-have features. Get honest, unbiased recommendations calculated from our lab scores in seconds.
                  </p>

                  <div className="mt-3.5 bg-white/10 rounded-xl p-3 border border-white/10 text-xs text-slate-300">
                    <span className="text-amber-300 font-bold block mb-0.5">💡 Sample Query:</span>
                    <span>"What are the best noise-cancelling headphones under $150 for travel?"</span>
                  </div>
                </div>

                <div className="sm:col-span-4 flex justify-center">
                  <MascotAnimation className="w-28 h-28 drop-shadow-2xl" />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenAiFinder}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5"
                >
                  <span>Start Product Finder</span>
                  <span>&rarr;</span>
                </button>
                <button
                  onClick={onOpenChatbot}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-3 rounded-xl border border-white/20 transition-all"
                >
                  <span>Ask DawnWire AI</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            14. PRICE DROP / WATCHLIST SECTION
        ───────────────────────────────────────────────────────────── */}
        <section data-reveal className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-10 relative overflow-hidden shadow-xl border border-blue-800">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
              <span>📉 Automated Deal Tracker</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Never Miss a Price Drop. Track Historical Lows.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
              DawnWire monitors thousands of Amazon products 24/7. We detect false markups and notify buyers when items reach their lowest price in 90 days.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="/deals"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs px-6 py-3 rounded-xl shadow-md transition-all"
              >
                <span>Browse Tracked Price Drops</span>
                <span>&rarr;</span>
              </a>
              <a
                href="/wishlist"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-5 py-3 rounded-xl border border-white/20 transition-all"
              >
                <span>View My Wishlist</span>
              </a>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            15. LATEST BUYING GUIDES (Clean Editorial Grid)
        ───────────────────────────────────────────────────────────── */}
        {posts.length > 0 && (
          <section data-reveal className="pt-2">
            <SectionHeading
              title="Latest Buying Guides & Expert Reviews"
              subtitle="In-depth testing, lab breakdowns, and buyer checklists"
              viewAllHref="/guides"
              viewAllText="All Buying Guides"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {posts.slice(0, 3).map((post) => {
                const cat = categories.find(c => c.id === post.categoryId);
                return (
                  <a
                    key={post.id}
                    href={`/post/${post.slug}`}
                    className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative aspect-video bg-gradient-to-br from-[#0A1F44] via-[#123A7A] to-[#246BFF] overflow-hidden">
                      {post.featuredImage ? (
                        <img
                          src={proxyImageUrl(post.featuredImage)}
                          alt={post.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : null}
                      <span className="absolute inset-0 flex items-center justify-center text-5xl opacity-70 select-none pointer-events-none">📚</span>
                      <span className="absolute top-3 left-3 bg-slate-900/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wide backdrop-blur-xs">
                        {cat?.name || 'Buying Guide'}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {post.excerpt}
                      </p>

                      <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate-400 font-semibold border-t border-slate-100 dark:border-slate-800">
                        <span>{post.readingTime || 5} min read</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-0.5 transition-transform">
                          Read Guide &rarr;
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ─────────────────────────────────────────────────────────────
            16. SHOP BY BRAND (Clean Logo Grid)
        ───────────────────────────────────────────────────────────── */}
        {brands.length > 0 && (
          <section data-reveal className="pt-2">
            <SectionHeading
              title="Shop Tested Brands"
              subtitle="Verified gear from premier consumer brands"
              viewAllHref="/brands"
              viewAllText="All Brands"
            />

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {brands.slice(0, 16).map((brand) => (
                <a
                  key={brand.id}
                  href={`/products?brand=${encodeURIComponent(brand.name)}`}
                  className="group flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow-md transition-all duration-300 min-h-[86px] text-center"
                >
                  {brand.logoUrl || brand.logo ? (
                    <div className="w-10 h-10 flex items-center justify-center overflow-hidden mb-1">
                      <img
                        src={proxyImageUrl(brand.logoUrl || brand.logo || '')}
                        alt={brand.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center mb-1">
                      {brand.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-full">
                    {brand.name}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ─────────────────────────────────────────────────────────────
            17. NEWSLETTER BLOCK (Full-Width Navy Block)
        ───────────────────────────────────────────────────────────── */}
        <section data-reveal className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-xl border border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold mb-3 border border-orange-400/30">
                ✉️ Exclusive Deal Alerts
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Never Miss a Price Drop
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-lg">
                Get expert picks, price alerts, and the best Amazon deals delivered straight to your inbox.
              </p>
            </div>

            <div className="lg:col-span-5">
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-lg border border-slate-200 dark:border-slate-700">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={newsletterLoading}
                    className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={newsletterLoading}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-5 py-3 rounded-xl shrink-0 transition-all disabled:opacity-60"
                  >
                    {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </div>
                {newsletterStatus && (
                  <p className={`text-xs font-bold ${newsletterStatus.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {newsletterStatus.msg}
                  </p>
                )}
                <p className="text-[11px] text-slate-400">
                  No spam, ever. Unsubscribe anytime.
                </p>
              </form>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
