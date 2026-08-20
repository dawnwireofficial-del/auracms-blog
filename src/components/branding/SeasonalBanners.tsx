import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { proxyImageUrl } from '../../utils/safeRender';
import type { ProductReview } from '../../types';

/**
 * Seasonal Banner Generator
 * 
 * Auto-detects upcoming events and displays themed banners with:
 * - Event-specific gradient themes (Black Friday = dark/gold, Prime Day = blue/teal)
 * - Countdown timers to event start/end
 * - Product recommendation cards with event branding
 * - Responsive layouts for mobile/desktop
 */

/* ── Event Definitions ── */
interface SeasonalEvent {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  startDay: number;   // day of month
  startMonth: number; // 0-indexed (0=Jan)
  durationDays: number;
  gradient: string;
  accentColor: string;
  bgPattern: string;
  tagline: string;
  ctaText: string;
}

const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'black-friday',
    name: 'Black Friday Deals',
    shortName: 'Black Friday',
    emoji: '🖤',
    startDay: 28,
    startMonth: 10, // November
    durationDays: 5,
    gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)',
    accentColor: '#FFD700',
    bgPattern: 'radial-gradient(circle at 20% 30%, rgba(255,215,0,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,215,0,0.1) 0%, transparent 50%)',
    tagline: 'The Biggest Sale of the Year',
    ctaText: 'Shop Black Friday Deals',
  },
  {
    id: 'cyber-monday',
    name: 'Cyber Monday Deals',
    shortName: 'Cyber Monday',
    emoji: '💻',
    startDay: 2,
    startMonth: 11, // December (Monday after Black Friday week)
    durationDays: 2,
    gradient: 'linear-gradient(135deg, #0d0221 0%, #0f084b 40%, #26408b 70%, #00b4d8 100%)',
    accentColor: '#00ff88',
    bgPattern: 'radial-gradient(circle at 30% 40%, rgba(0,255,136,0.12) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(0,180,216,0.1) 0%, transparent 50%)',
    tagline: 'Tech Deals Going Digital',
    ctaText: 'Shop Cyber Monday',
  },
  {
    id: 'prime-day',
    name: 'Prime Day Deals',
    shortName: 'Prime Day',
    emoji: '📦',
    startDay: 15,
    startMonth: 6, // July
    durationDays: 3,
    gradient: 'linear-gradient(135deg, #001d3d 0%, #003566 40%, #006994 70%, #00b4d8 100%)',
    accentColor: '#FF9900',
    bgPattern: 'radial-gradient(circle at 25% 35%, rgba(255,153,0,0.15) 0%, transparent 50%), radial-gradient(circle at 75% 65%, rgba(0,180,216,0.1) 0%, transparent 50%)',
    tagline: 'Exclusive Deals for Smart Shoppers',
    ctaText: 'Shop Prime Day',
  },
  {
    id: 'holiday',
    name: 'Holiday Gift Guide',
    shortName: 'Holiday',
    emoji: '🎄',
    startDay: 15,
    startMonth: 11, // December
    durationDays: 17,
    gradient: 'linear-gradient(135deg, #1a0000 0%, #4a0000 30%, #8b0000 60%, #cc0000 100%)',
    accentColor: '#FFD700',
    bgPattern: 'radial-gradient(circle at 20% 25%, rgba(255,215,0,0.12) 0%, transparent 40%), radial-gradient(circle at 80% 75%, rgba(34,139,34,0.1) 0%, transparent 40%)',
    tagline: 'Perfect Gifts at Perfect Prices',
    ctaText: 'Shop Holiday Gifts',
  },
  {
    id: 'valentines',
    name: "Valentine's Day Sale",
    shortName: "Valentine's",
    emoji: '💝',
    startDay: 7,
    startMonth: 1, // February
    durationDays: 8,
    gradient: 'linear-gradient(135deg, #4a0020 0%, #8b0040 40%, #cc0060 70%, #ff1493 100%)',
    accentColor: '#FFB6C1',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(255,182,193,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(255,20,147,0.1) 0%, transparent 50%)',
    tagline: 'Gifts They\'ll Actually Love',
    ctaText: 'Shop Valentine\'s',
  },
  {
    id: 'back-to-school',
    name: 'Back to School Sale',
    shortName: 'Back to School',
    emoji: '📚',
    startDay: 1,
    startMonth: 7, // August
    durationDays: 21,
    gradient: 'linear-gradient(135deg, #1a365d 0%, #2c5282 40%, #3182ce 70%, #63b3ed 100%)',
    accentColor: '#FFB347',
    bgPattern: 'radial-gradient(circle at 25% 35%, rgba(255,179,71,0.12) 0%, transparent 50%), radial-gradient(circle at 75% 65%, rgba(99,179,237,0.1) 0%, transparent 50%)',
    tagline: 'Gear Up for Success',
    ctaText: 'Shop Back to School',
  },
  {
    id: 'new-year',
    name: 'New Year Tech Refresh',
    shortName: 'New Year',
    emoji: '🎆',
    startDay: 26,
    startMonth: 11, // December 26
    durationDays: 10,
    gradient: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a3e 40%, #2d2d6e 70%, #4a4aff 100%)',
    accentColor: '#FFD700',
    bgPattern: 'radial-gradient(circle at 20% 40%, rgba(255,215,0,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(74,74,255,0.1) 0%, transparent 50%)',
    tagline: 'Start Fresh with the Best Tech',
    ctaText: 'Shop New Year Deals',
  },
  {
    id: 'spring-sale',
    name: 'Spring Refresh Sale',
    shortName: 'Spring',
    emoji: '🌸',
    startDay: 20,
    startMonth: 2, // March
    durationDays: 14,
    gradient: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3f 40%, #4a8c6f 70%, #7fcdbb 100%)',
    accentColor: '#FFB6C1',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(255,182,193,0.12) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(127,205,187,0.1) 0%, transparent 50%)',
    tagline: 'Refresh Your Space',
    ctaText: 'Shop Spring Deals',
  },
];

/* ── Event Detection ── */
function getCurrentEvent(): SeasonalEvent | null {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  for (const event of SEASONAL_EVENTS) {
    const start = new Date(now.getFullYear(), event.startMonth, event.startDay);
    const end = new Date(start);
    end.setDate(end.getDate() + event.durationDays);

    // Check if we're within the event window
    if (now >= start && now <= end) return event;

    // Check if event is within the next 7 days (pre-event hype)
    const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilStart > 0 && daysUntilStart <= 7) return event;
  }

  return null;
}

function getNextEvent(): SeasonalEvent | null {
  const now = new Date();
  let closest: { event: SeasonalEvent; daysUntil: number } | null = null;

  for (const event of SEASONAL_EVENTS) {
    const start = new Date(now.getFullYear(), event.startMonth, event.startDay);
    if (start < now) start.setFullYear(start.getFullYear() + 1);
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (!closest || daysUntil < closest.daysUntil) {
      closest = { event, daysUntil };
    }
  }

  return closest?.event || null;
}

/* ── Countdown Timer ── */
function CountdownTimer({ targetDate, accentColor }: { targetDate: Date; accentColor: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, targetDate.getTime() - now.getTime());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hrs', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-2">
      {units.map((u, i) => (
        <React.Fragment key={u.label}>
          <div className="flex flex-col items-center">
            <span
              className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-black"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {String(u.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-white/50 font-semibold mt-1 uppercase">{u.label}</span>
          </div>
          {i < units.length - 1 && <span className="text-lg font-black text-white/30 mb-4">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Main Seasonal Banner ── */
interface SeasonalBannerProps {
  products: ProductReview[];
  forceEvent?: string; // Override auto-detection
}

export function SeasonalBanner({ products, forceEvent }: SeasonalBannerProps) {
  const activeEvent = useMemo(() => {
    if (forceEvent) return SEASONAL_EVENTS.find(e => e.id === forceEvent) || null;
    return getCurrentEvent();
  }, [forceEvent]);

  if (!activeEvent) return null;

  const startDate = new Date(new Date().getFullYear(), activeEvent.startMonth, activeEvent.startDay);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + activeEvent.durationDays);
  const now = new Date();
  const isPreEvent = now < startDate;
  const isLive = now >= startDate && now <= endDate;

  // Get relevant products (discounted or top-rated)
  const eventProducts = useMemo(() => {
    const discounted = products
      .filter(p => p.discountPercentage || (Number(p.originalPrice) > Number(p.price)))
      .sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
    const topRated = products
      .filter(p => p.editorScore && p.editorScore >= 8)
      .sort((a, b) => (b.editorScore || 0) - (a.editorScore || 0));
    return [...new Set([...discounted, ...topRated])].slice(0, 6);
  }, [products]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl"
      style={{ background: activeEvent.gradient }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0" style={{ backgroundImage: activeEvent.bgPattern }} />
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      {/* Floating decorative elements */}
      <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full blur-[80px] opacity-20" style={{ backgroundColor: activeEvent.accentColor }} />
      <div className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full blur-[80px] opacity-15" style={{ backgroundColor: activeEvent.accentColor }} />

      <div className="relative z-10 p-6 lg:p-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            {/* Event badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 border" style={{ borderColor: `${activeEvent.accentColor}40`, backgroundColor: `${activeEvent.accentColor}15` }}>
              <span className="text-xl">{activeEvent.emoji}</span>
              <span className="text-sm font-bold tracking-wide" style={{ color: activeEvent.accentColor }}>
                {isPreEvent ? 'Coming Soon' : isLive ? 'LIVE NOW' : 'Just Ended'}
              </span>
              {isPreEvent && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: activeEvent.accentColor }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: activeEvent.accentColor }} />
                </span>
              )}
            </div>

            <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              {activeEvent.name}
            </h2>
            <p className="mt-2 text-lg text-white/70">{activeEvent.tagline}</p>
          </div>

          {/* Countdown */}
          <div className="shrink-0">
            <p className="text-[11px] text-white/50 font-bold uppercase tracking-widest mb-2">
              {isPreEvent ? 'Starts in' : isLive ? 'Ends in' : 'Event Ended'}
            </p>
            <CountdownTimer
              targetDate={isPreEvent ? startDate : endDate}
              accentColor={activeEvent.accentColor}
            />
          </div>
        </div>

        {/* Product Grid */}
        {eventProducts.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {eventProducts.slice(0, 6).map(p => (
              <SeasonalProductCard
                key={p.id}
                product={p}
                accentColor={activeEvent.accentColor}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href="/deals"
            className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-[15px] font-bold transition-all duration-200 hover:-translate-y-0.5"
            style={{
              backgroundColor: activeEvent.accentColor,
              color: '#000',
              boxShadow: `0 8px 30px -8px ${activeEvent.accentColor}60`,
            }}
          >
            {activeEvent.emoji} {activeEvent.ctaText}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <span className="text-sm text-white/50 font-semibold">
            {products.filter(p => p.discountPercentage).length}+ deals active
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Seasonal Product Card ── */
function SeasonalProductCard({ product, accentColor }: { product: ProductReview; accentColor: string }) {
  const price = parseFloat(String(product.price || '0').replace(/[^0-9.]/g, ''));
  const origPrice = parseFloat(String(product.originalPrice || '0').replace(/[^0-9.]/g, ''));
  const discount = product.discountPercentage || (origPrice > price && origPrice > 0 ? Math.round((1 - price / origPrice) * 100) : 0);

  return (
    <a
      href={`/products/${product.slug}`}
      className="group relative bg-white/10 backdrop-blur-sm rounded-xl border border-white/15 p-3 hover:bg-white/20 transition-all duration-200 hover:-translate-y-1"
    >
      {discount > 0 && (
        <span
          className="absolute top-2 right-2 text-[10px] font-black px-1.5 py-0.5 rounded-md"
          style={{ backgroundColor: accentColor, color: '#000' }}
        >
          -{discount}%
        </span>
      )}
      <div className="aspect-square rounded-lg overflow-hidden bg-white/5 mb-2">
        {proxyImageUrl(product.images?.[0] || product.productImage) && (
          <img
            src={proxyImageUrl(product.images?.[0] || product.productImage) || ''}
            alt={product.productName}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>
      <p className="text-[9px] text-white/50 font-bold uppercase tracking-wider">{product.brand}</p>
      <p className="text-[11px] text-white/90 font-semibold line-clamp-2 leading-tight mt-0.5">{product.productName}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        {price > 0 && <span className="text-sm font-black text-white">${price.toFixed(2)}</span>}
        {origPrice > price && <span className="text-[10px] text-white/40 line-through">${origPrice.toFixed(2)}</span>}
      </div>
    </a>
  );
}

/* ── Upcoming Events Preview ── */
export function UpcomingEventsBar() {
  const nextEvent = getNextEvent();
  if (!nextEvent) return null;

  const startDate = new Date(new Date().getFullYear(), nextEvent.startMonth, nextEvent.startDay);
  const now = new Date();
  if (startDate < now) startDate.setFullYear(startDate.getFullYear() + 1);
  const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ background: nextEvent.gradient }}>
      <div className="absolute inset-0" style={{ backgroundImage: nextEvent.bgPattern }} />
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{nextEvent.emoji}</span>
          <div>
            <p className="text-sm font-bold text-white">{nextEvent.name}</p>
            <p className="text-[11px] text-white/60">{daysUntil} days away • {nextEvent.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CountdownTimer targetDate={startDate} accentColor={nextEvent.accentColor} />
        </div>
      </div>
    </div>
  );
}

/* ── Quick Seasonal Toggle (for demo/preview) ── */
export function SeasonalPreview({ products }: { products: ProductReview[] }) {
  const [previewEvent, setPreviewEvent] = useState<string | null>(null);

  return (
    <div>
      {/* Event selector chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setPreviewEvent(null)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
            !previewEvent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Auto-Detect
        </button>
        {SEASONAL_EVENTS.map(event => (
          <button
            key={event.id}
            onClick={() => setPreviewEvent(event.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
              previewEvent === event.id ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={previewEvent === event.id ? { backgroundColor: event.accentColor, color: '#000' } : {}}
          >
            <span>{event.emoji}</span>
            {event.shortName}
          </button>
        ))}
      </div>

      {/* Banner preview */}
      <SeasonalBanner products={products} forceEvent={previewEvent || undefined} />
    </div>
  );
}

export { SEASONAL_EVENTS, getCurrentEvent, getNextEvent };
