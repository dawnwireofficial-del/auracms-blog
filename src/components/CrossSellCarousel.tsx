import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Star, ShoppingBag } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { proxyImageUrl } from '../utils/safeRender';

interface CrossSellProduct {
  id: string;
  slug?: string;
  product_name: string;
  brand?: string;
  product_image?: string;
  price?: string;
  rating: number;
  best_for?: string;
  affiliate_url?: string;
  stock_status?: string;
  deal_badge?: string;
}

interface CrossSellCarouselProps {
  products: CrossSellProduct[];
  currentId: string;
  onNavigate: (route: string, param?: string) => void;
}

export default function CrossSellCarousel({ products, currentId, onNavigate }: CrossSellCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const filtered = Array.isArray(products) ? products.filter(p => p.id !== currentId).slice(0, 10) : [];
  if (filtered.length === 0) return null;

  const scroll = (dir: number) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  return (
    <ScrollReveal as="section" variant="fadeUp">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#246BFF]" />
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">People Also Bought</h2>
        </div>
        <div className="flex gap-1">
          <button onClick={() => scroll(-1)} className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all" aria-label="Scroll left">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll(1)} className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all" aria-label="Scroll right">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="overflow-x-auto no-scrollbar -mx-1 px-1">
        <div className="flex gap-4 pb-2">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
              whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
              className="min-w-[220px] w-[220px] bg-white dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700 p-4 hover:shadow-md hover:border-[#246BFF]/30 transition-all shrink-0"
            >
              {p.product_image && (
                <div className="w-full h-28 bg-white dark:bg-zinc-900 rounded-lg mb-3 p-3 border border-slate-100 dark:border-zinc-700/50 overflow-hidden">
                  <img src={proxyImageUrl(p.product_image)} alt={p.product_name} className="w-full h-full object-contain" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
              {p.brand && <p className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">{p.brand}</p>}
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 leading-snug line-clamp-2 mb-1.5">{p.product_name}</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-3 h-3 ${n <= Math.round(p.rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-600'}`} />
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">{p.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{p.price || '—'}</span>
                  {p.deal_badge && <span className="ml-1.5 text-[9px] font-bold text-red-500">🔥 {p.deal_badge}</span>}
                </div>
                {p.stock_status && p.stock_status !== 'in_stock' && (
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                    p.stock_status === 'low_stock' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300' :
                    p.stock_status === 'limited' ? 'bg-dw-blue/10 text-dw-blue dark:text-blue-300' :
                    'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'
                  }`}>{p.stock_status.replace('_', ' ')}</span>
                )}
              </div>
              <div className="flex gap-1.5 mt-3">
                <button
                  onClick={() => onNavigate('review', p.slug || p.id)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[10px] font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all"
                >
                  View
                </button>
                <a
                  href={p.affiliate_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#246BFF] text-white text-[10px] font-semibold hover:bg-[#1a5ae0] transition-all text-center"
                  onClick={() => { if (p.affiliate_url) { fetch('/api/public/track/affiliate-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id, pageUrl: window.location.pathname }) }).catch(() => {}); } }}
                >
                  Buy
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
