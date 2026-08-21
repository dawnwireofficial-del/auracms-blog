import React, { useMemo } from 'react';
import { proxyImageUrl } from '../../utils/safeRender';
import type { ProductReview } from '../../types';

/**
 * CSS/HTML-based banner generator that creates DawnWire-branded graphics
 * without needing external image generation. Uses product imagery,
 * gradient overlays, and typography to create professional banners.
 */

const BRAND = {
  navy: '#0A1F44',
  blue: '#246BFF',
  blueLight: '#4F7CFF',
  bluePale: '#EAF2FF',
  orange: '#FF8A00',
  orangeDark: '#FF6A00',
  orangeLight: '#FFF3E6',
  white: '#FFFFFF',
  slate900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B',
  slate300: '#CBD5E1',
  slate100: '#F1F5F9',
} as const;

/* ── Gradient Presets ── */
const GRADIENTS = {
  hero: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.blue} 50%, ${BRAND.blueLight} 100%)`,
  deal: `linear-gradient(135deg, ${BRAND.orangeDark} 0%, ${BRAND.orange} 50%, #FFB347 100%)`,
  premium: `linear-gradient(135deg, ${BRAND.navy} 0%, #1a2744 40%, ${BRAND.blue} 100%)`,
  beauty: `linear-gradient(135deg, #f8e8ff 0%, #ffd6e7 50%, #ffe0f0 100%)`,
  tech: `linear-gradient(135deg, ${BRAND.bluePale} 0%, ${BRAND.blue} 100%)`,
  dark: `linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)`,
  sunset: `linear-gradient(135deg, #FF6A00 0%, #FF8A00 40%, #FFB347 100%)`,
  nature: `linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)`,
} as const;

interface BannerProps {
  product?: ProductReview;
  title: string;
  subtitle?: string;
  cta?: string;
  href?: string;
  badge?: string;
  gradient?: keyof typeof GRADIENTS;
  height?: string;
  className?: string;
  showProduct?: boolean;
  align?: 'left' | 'center' | 'right';
}

/**
 * Main branded banner component — creates a professional graphic
 * using CSS gradients, product imagery, and typography
 */
export function BrandedBanner({
  product, title, subtitle, cta, href = '/deals',
  badge, gradient = 'hero', height = 'h-[280px] lg:h-[340px]',
  className = '', showProduct = true, align = 'left',
}: BannerProps) {
  const productImg = product ? proxyImageUrl(product.images?.[0] || product.productImage) : null;
  const price = product ? parseFloat(String(product.price || '0').replace(/[^0-9.]/g, '')) : 0;

  return (
    <a
      href={href}
      className={`group relative block overflow-hidden rounded-2xl ${height} ${className}`}
      style={{ background: GRADIENTS[gradient] }}
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
        backgroundSize: '20px 20px',
      }} />

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-white/[0.06] blur-2xl" />
      <div className="absolute -bottom-20 -left-20 w-[250px] h-[250px] rounded-full bg-white/[0.04] blur-2xl" />

      <div className={`relative z-10 h-full flex items-center ${align === 'center' ? 'justify-center text-center' : align === 'right' ? 'justify-end text-right' : 'justify-between'} px-8 lg:px-12`}>
        {/* Text content */}
        <div className={`${showProduct && productImg ? 'max-w-[55%]' : 'max-w-full'} ${align === 'center' ? 'mx-auto' : ''}`}>
          {badge && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[11px] font-bold text-white border border-white/20 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {badge}
            </span>
          )}
          <h3 className="text-2xl lg:text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-3 text-sm lg:text-base text-white/80 max-w-lg leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="mt-5 flex items-center gap-3">
            {cta && (
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-sm px-5 py-2.5 text-sm font-bold text-white border border-white/30 group-hover:bg-white/30 transition-all duration-200">
                {cta}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            )}
            {product && price > 0 && (
              <span className="text-white/70 text-sm font-semibold">
                From <span className="text-white font-black text-lg">${price.toFixed(2)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Product image */}
        {showProduct && productImg && (
          <div className="hidden md:block relative w-[35%] max-w-[280px] aspect-square">
            <img
              src={productImg}
              alt={product?.productName || 'Product image'}
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>
    </a>
  );
}

/**
 * Hero banner with animated gradient background + floating product cards
 */
export function HeroBanner({ products }: { products: ProductReview[] }) {
  const topProducts = useMemo(() =>
    products.filter(p => p.editorScore && p.editorScore >= 8).slice(0, 4),
    [products]
  );

  const heroProduct = topProducts[0];
  const heroImg = heroProduct ? proxyImageUrl(heroProduct.images?.[0] || heroProduct.productImage) : null;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl" style={{ background: GRADIENTS.hero }}>
      {/* Animated gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-[#4F7CFF]/20 blur-[80px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-[#FF8A00]/15 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-[#7cc4ff]/10 blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[400px] lg:min-h-[460px] p-8 lg:p-14">
        {/* Left: Copy */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 border border-white/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34d399]" />
            </span>
            <span className="text-[12px] font-bold text-white/90 tracking-wide uppercase">AI-Powered Reviews</span>
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[56px] font-black text-white leading-[1.05] tracking-tight">
            Shop Smarter.
            <span className="block mt-1 bg-gradient-to-r from-[#FFB347] via-[#FF8A00] to-[#FF6A00] bg-clip-text text-transparent">
              Score Better.
            </span>
          </h1>

          <p className="mt-5 text-lg text-white/70 max-w-xl leading-relaxed">
            Independent reviews, live price tracking, and honest editor scores across 600+ products — so you buy the right thing at the right price.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/products?sort=rating" className="inline-flex items-center gap-2 rounded-xl bg-[#FF8A00] hover:bg-[#FF6A00] text-white font-bold px-7 py-3.5 text-[15px] shadow-[0_8px_30px_-8px_rgba(255,138,0,0.6)] transition-all duration-200 hover:-translate-y-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Find My Perfect Product
            </a>
            <a href="/deals" className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 text-white font-bold px-7 py-3.5 text-[15px] hover:bg-white/25 transition-all duration-200">
              Today's Deals
              <span className="bg-[#FF8A00] text-white text-[10px] font-black px-2 py-0.5 rounded-full">HOT</span>
            </a>
          </div>

          {/* Trust strip */}
          <div className="mt-8 flex flex-wrap gap-6 text-white/60 text-[13px]">
            {[
              { icon: '🛡️', text: 'Independently Tested' },
              { icon: '📊', text: '98.2% Pick Accuracy' },
              { icon: '🔔', text: 'Live Price Alerts' },
            ].map(t => (
              <span key={t.text} className="flex items-center gap-2">
                <span>{t.icon}</span>
                <span className="font-semibold">{t.text}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right: Featured Product Showcase */}
        <div className="hidden lg:block relative">
          {heroImg ? (
            <div className="relative">
              {/* Glow behind product */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF8A00]/30 to-[#246BFF]/30 rounded-3xl blur-3xl scale-110" />

              {/* Main product card */}
              <div className="relative bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#FF8A00] text-white text-[10px] font-black px-2 py-0.5 rounded-md">★ EDITOR'S PICK</span>
                  {heroProduct?.editorScore && (
                    <span className="text-white/60 text-[12px] font-bold">{heroProduct.editorScore}/10</span>
                  )}
                </div>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-white/5">
                  <img
                    src={heroImg}
                    alt={heroProduct?.productName}
                    className="w-full h-full object-contain p-4"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="mt-4 text-white">
                  <p className="text-[11px] font-bold text-[#FF8A00] uppercase tracking-widest">{heroProduct?.brand}</p>
                  <p className="text-sm font-semibold mt-1 line-clamp-2">{heroProduct?.productName}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xl font-black">${Number(heroProduct?.price || 0).toFixed(2)}</span>
                    <a href={`/products/${heroProduct?.slug}`} className="text-[11px] font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors">
                      View Review →
                    </a>
                  </div>
                </div>
              </div>

              {/* Floating mini cards */}
              {topProducts.slice(1, 3).map((p, i) => (
                <div
                  key={p.id}
                  className={`absolute bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-2 flex items-center gap-2 border border-white/50 w-[180px] ${
                    i === 0 ? '-top-4 -right-6 rotate-2' : '-bottom-4 -left-6 -rotate-2'
                  }`}
                  style={{ animation: `float${i === 0 ? 'A' : 'B'} ${6 + i}s ease-in-out infinite` }}
                >
                  {proxyImageUrl(p.images?.[0] || p.productImage) && (
                    <img
                      src={proxyImageUrl(p.images?.[0] || p.productImage) || ''}
                      alt={p.productName}
                      className="w-10 h-10 rounded-lg object-contain bg-slate-50"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-400 font-bold">{p.brand}</p>
                    <p className="text-[10px] text-slate-800 font-semibold truncate">{p.productName}</p>
                    <p className="text-[10px] text-[#FF8A00] font-bold">${Number(p.price || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback: animated product grid */
            <div className="grid grid-cols-2 gap-4">
              {topProducts.slice(0, 4).map((p, i) => (
                <div key={p.id} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-3 aspect-square flex items-center justify-center">
                  {proxyImageUrl(p.images?.[0] || p.productImage) && (
                    <img src={proxyImageUrl(p.images?.[0] || p.productImage) || ''} alt="" className="w-full h-full object-contain p-2 opacity-80" referrerPolicy="no-referrer" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0) rotate(2deg)} 50%{transform:translateY(-8px) rotate(-1deg)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-10px) rotate(1deg)} }
      `}</style>
    </div>
  );
}

/**
 * Horizontal deal banner strip with gradient + countdown
 */
export function DealStrip({ products }: { products: ProductReview[] }) {
  const deals = useMemo(() =>
    products.filter(p => p.discountPercentage || (Number(p.originalPrice) > Number(p.price)))
      .sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0))
      .slice(0, 6),
    [products]
  );

  if (deals.length === 0) return null;

  return (
    <a href="/deals" className="group relative block overflow-hidden rounded-2xl h-[100px]" style={{ background: GRADIENTS.deal }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }} />
      <div className="relative z-10 h-full flex items-center px-8 gap-8">
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-white font-black text-xl leading-tight">Today's Hottest Deals</p>
              <p className="text-white/70 text-[13px] font-semibold">Up to {Math.max(...deals.map(d => d.discountPercentage || 0))}% off — limited time</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-4 overflow-hidden">
          {deals.slice(0, 5).map((d, i) => (
            <div key={d.id} className="shrink-0 flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20 group-hover:bg-white/25 transition-colors">
              {proxyImageUrl(d.images?.[0] || d.productImage) && (
                <img src={proxyImageUrl(d.images?.[0] || d.productImage) || ''} alt="" className="w-8 h-8 rounded-lg object-contain" referrerPolicy="no-referrer" />
              )}
              <div className="min-w-0">
                <p className="text-white text-[10px] font-semibold truncate max-w-[100px]">{d.productName}</p>
                <p className="text-white/80 text-[10px]">
                  <span className="font-bold">${Number(d.price || 0).toFixed(2)}</span>
                  {d.discountPercentage ? <span className="ml-1 text-[#FFB347] font-bold">-{d.discountPercentage}%</span> : null}
                </p>
              </div>
            </div>
          ))}
        </div>
        <span className="shrink-0 text-white/80 text-sm font-bold group-hover:text-white flex items-center gap-1 transition-colors">
          View All
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </a>
  );
}

/**
 * Category highlight card with gradient overlay + product count
 */
export function CategoryCard({
  name, slug, image, productCount, gradient = 'tech',
}: {
  name: string; slug: string; image?: string; productCount: number;
  gradient?: keyof typeof GRADIENTS;
}) {
  return (
    <a
      href={`/categories/${slug}`}
      className="group relative block overflow-hidden rounded-2xl aspect-[4/3] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-16px_rgba(36,107,255,0.35)] border border-white/10"
      style={{ background: GRADIENTS[gradient] }}
    >
      {image && (
        <img
          src={proxyImageUrl(image) || ''}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-45 group-hover:scale-110 transition-all duration-700"
          referrerPolicy="no-referrer"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle at 50% 80%, rgba(255,255,255,0.1) 0%, transparent 60%)' }} />
      <div className="relative z-10 h-full flex flex-col justify-end p-4">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{productCount} products</p>
        <h4 className="text-white font-bold text-lg mt-1 group-hover:text-white drop-shadow-md">{name}</h4>
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1 w-fit opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          Browse
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </span>
      </div>
    </a>
  );
}

export { GRADIENTS, BRAND };
