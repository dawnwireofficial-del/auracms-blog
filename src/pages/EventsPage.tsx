import React, { useEffect, useState } from 'react';
import { proxyImageUrl } from '../utils/safeRender';

const NO_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="#f8fafc"/><g fill="none" stroke="#cbd5e1" stroke-width="2"><circle cx="150" cy="138" r="46"/><path d="M66 238c8-48 46-72 84-72s76 24 84 72"/></g></svg>'
);

interface ShoppingEvent {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  emoji?: string | null;
  hero_image?: string | null;
  theme_color?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  featured?: boolean;
}

interface EventProduct {
  id: string;
  slug: string;
  product_name: string;
  brand?: string | null;
  product_image?: string | null;
  price?: number | null;
  original_price?: number | null;
  rating?: number | null;
  review_count?: number | null;
  editor_score?: number | null;
  deal_badge?: string | null;
}

function dateLabel(iso?: string | null): string {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return ''; }
}

function eventStatus(e: ShoppingEvent): 'live' | 'upcoming' | '' {
  const now = Date.now();
  if (e.start_date && new Date(e.start_date).getTime() > now) return 'upcoming';
  if (e.end_date && new Date(e.end_date).getTime() + 86400000 < now) return '';
  return 'live';
}

export function EventCard({ ev }: { ev: ShoppingEvent }) {
  const status = eventStatus(ev);
  return (
    <a
      href={`/events/${ev.slug}`}
      className="group relative flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      <div
        className="relative h-24 flex items-center px-5"
        style={{ background: `linear-gradient(120deg, ${ev.theme_color || '#0A1F44'} 0%, #0A1F44 130%)` }}
      >
        {ev.hero_image ? (
          <img src={proxyImageUrl(ev.hero_image)} alt={ev.name} loading="lazy" referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-contain opacity-90"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        ) : (
          <>
            <span className="text-3xl drop-shadow">{ev.emoji || '🎉'}</span>
            <span className="absolute right-4 bottom-2 text-[64px] leading-none opacity-15 select-none">{ev.emoji || '🎉'}</span>
          </>
        )}
        {status === 'live' && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-white/95 text-[10px] font-black uppercase tracking-wider text-slate-900 px-2 py-0.5 rounded-full shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </span>
        )}
        {status === 'upcoming' && (
          <span className="absolute top-3 right-3 bg-white/95 text-[10px] font-black uppercase tracking-wider text-slate-700 px-2 py-0.5 rounded-full shadow">
            Coming {dateLabel(ev.start_date)}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ev.name}</h3>
        {ev.tagline && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{ev.tagline}</p>}
        {(ev.start_date || ev.end_date) && (
          <p className="mt-2 text-[11px] font-bold text-slate-400">
            🗓️ {[dateLabel(ev.start_date), dateLabel(ev.end_date)].filter(Boolean).join(' – ')}
          </p>
        )}
        <span className="mt-auto pt-3 text-xs font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Shop deals →
        </span>
      </div>
    </a>
  );
}

export function ProductGrid({ products }: { products: EventProduct[] }) {
  if (!products.length) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Deals are being curated for this event — check back shortly.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {products.map((p) => {
        const discount = p.original_price && p.price && p.original_price > p.price
          ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0;
        return (
          <a key={p.id} href={`/products/${p.slug}`}
            className="group flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
            <div className="relative p-3 pb-0 aspect-square flex items-center justify-center bg-white">
              <img src={proxyImageUrl(p.product_image) || NO_IMAGE} alt={p.product_name} loading="lazy" referrerPolicy="no-referrer"
                className="max-h-full max-w-full w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = NO_IMAGE; }} />
              {(discount > 0 || p.deal_badge) && (
                <span className="absolute top-2 left-2 bg-[#FF334F] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow">
                  {p.deal_badge || `-${discount}%`}
                </span>
              )}
              {!!p.editor_score && Number(p.editor_score) >= 9 && (
                <span className="absolute top-2 right-2 bg-[#246BFF] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow">
                  {Number(p.editor_score).toFixed(0)}/10
                </span>
              )}
            </div>
            <div className="p-3 pt-2 flex-1 flex flex-col">
              {p.brand && <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase truncate">{p.brand}</p>}
              <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mt-0.5">{p.product_name}</h3>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                ★ {Number(p.rating || 0).toFixed(1)}{p.review_count ? <span className="text-slate-400"> ({p.review_count})</span> : null}
              </div>
              <div className="mt-auto pt-2 flex items-baseline gap-1.5">
                {p.price ? <span className="text-sm font-black text-slate-900 dark:text-white">${Number(p.price).toFixed(2)}</span> : null}
                {discount > 0 && <span className="text-[10px] text-slate-400 line-through">${Number(p.original_price).toFixed(2)}</span>}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export default function EventsPage({ eventSlug }: { eventSlug?: string }) {
  const [events, setEvents] = useState<ShoppingEvent[]>([]);
  const [event, setEvent] = useState<ShoppingEvent | null>(null);
  const [products, setProducts] = useState<EventProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (eventSlug) {
          const r = await fetch(`/api/public/events/${encodeURIComponent(eventSlug)}`);
          if (r.ok) {
            const d = await r.json();
            if (!cancelled) { setEvent(d.event); setProducts(d.products || []); }
          } else if (!cancelled) setEvent(null);
        } else {
          const r = await fetch('/api/public/events');
          const d = await r.json();
          if (!cancelled) setEvents(Array.isArray(d) ? d : []);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [eventSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto animate-pulse space-y-4">
          <div className="h-40 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-6 w-64 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
          </div>
        </div>
      </div>
    );
  }

  // ===== Landing page (/events/:slug) =====
  if (eventSlug) {
    if (!event) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 pt-32 pb-20 text-center px-4">
          <p className="text-6xl mb-4">🗓️</p>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Event not found</h1>
          <a href="/events" className="inline-block mt-4 text-sm font-bold text-blue-600 hover:underline">← Browse all events</a>
        </div>
      );
    }
    const color = event.theme_color || '#246BFF';
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
        <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, ${color} 0%, #0A1F44 120%)` }}>
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 py-14 relative z-10">
            <nav className="text-xs font-bold text-white/70 mb-3">
              <a href="/" className="hover:text-white">Home</a><span className="mx-1.5">/</span>
              <a href="/events" className="hover:text-white">Events</a><span className="mx-1.5">/</span>
              <span className="text-white/90">{event.name}</span>
            </nav>
            <div className="flex items-center gap-4">
              <span className="text-5xl sm:text-6xl drop-shadow-lg">{event.emoji || '🎉'}</span>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{event.name}</h1>
                {event.tagline && <p className="mt-1 text-sm text-white/85 font-medium">{event.tagline}</p>}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs font-bold">
              {(event.start_date || event.end_date) && (
                <span className="bg-white/15 border border-white/25 rounded-full px-3 py-1 backdrop-blur">
                  🗓️ {[dateLabel(event.start_date), dateLabel(event.end_date)].filter(Boolean).join(' – ')}
                </span>
              )}
              {eventStatus(event) === 'live' && (
                <span className="bg-emerald-500/25 border border-emerald-300/40 rounded-full px-3 py-1 inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" /> Happening now
                </span>
              )}
              <span className="bg-white/15 border border-white/25 rounded-full px-3 py-1">✔ Price-checked daily</span>
            </div>
            {event.description && <p className="mt-4 max-w-2xl text-sm text-white/80 leading-relaxed">{event.description}</p>}
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
          <div className="flex items-end justify-between gap-3 mb-5">
            <h2 className="text-xl font-black">Top {event.name} picks</h2>
            <span className="text-xs font-bold text-slate-400">{products.length} curated deals</span>
          </div>
          <ProductGrid products={products} />
          <p className="mt-8 text-[11px] text-slate-400 max-w-3xl">
            As an Amazon Associate, DawnWire earns from qualifying purchases. Prices shown were accurate at the time of review — tap any deal to see today's live price on Amazon.
          </p>
        </div>
      </div>
    );
  }

  // ===== Hub (/events) =====
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1F44] via-[#123A7A] to-[#246BFF] text-white">
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-14 relative z-10">
          <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider bg-white/15 border border-white/25 px-2.5 py-0.5 rounded-md mb-2">🗓️ Sale Calendar</span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Shopping Events & Seasonal Deals</h1>
          <p className="mt-2 text-sm text-white/80 max-w-2xl font-medium">
            Every major shopping event of the year — Black Friday to Back-to-School — with editor-picked, price-tracked Amazon deals in one place.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-10">
        {events.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            No events are live right now — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {events.map((ev) => <EventCard key={ev.id} ev={ev} />)}
          </div>
        )}
      </div>
    </div>
  );
}
