import React, { useState, useRef } from 'react';
import { Star, ShoppingBag, CheckCircle, XCircle, ChevronLeft, ChevronRight, Eye, Scale, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from './useReducedMotion';
import ComparisonScanner from './motion/ComparisonScanner';
import { proxyImageUrl } from '../utils/safeRender';
import { cloakHref } from '../lib/cloak';

interface CompareProduct {
  id: string;
  slug?: string;
  product_name: string;
  brand?: string;
  product_image?: string;
  price?: string;
  rating?: number;
  best_for?: string;
  pros?: string[];
  cons?: string[];
  key_features?: string[];
  affiliate_url?: string;
  cta_text?: string;
  review_summary?: string;
  final_verdict?: string;
}

interface CompareProductsProps {
  products: CompareProduct[];
  highlightId?: string;
  onNavigate: (route: string, param?: string) => void;
  onClose?: () => void;
}

function RowLabel(props: { children: React.ReactNode; key?: string }) {
  return (
    <div className="sticky left-0 z-10 bg-white dark:bg-zinc-950/95 w-28 md:w-32 shrink-0 flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 border-r border-slate-200 dark:border-zinc-700/60 p-3">
      {props.children}
    </div>
  );
}

function Cell(props: { children: React.ReactNode; isHighlight?: boolean; key?: string }) {
  return (
    <div className={`w-[280px] shrink-0 p-3 flex flex-col justify-center text-xs ${props.isHighlight ? 'bg-[#246BFF]/5 dark:bg-[#246BFF]/10' : 'bg-white dark:bg-zinc-950/60'} border-r border-b border-slate-200 dark:border-zinc-700/60`}>
      {props.children}
    </div>
  );
}

function CompareTable({ products, highlightId, onNavigate }: CompareProductsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const cols = products.length;
  const colWidth = 280;

  const scroll = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * colWidth, behavior: 'smooth' });
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-200 dark:text-zinc-600'}`} />
      ))}
      <span className="ml-1 text-[10px] font-bold text-slate-800 dark:text-zinc-300">{rating.toFixed(1)}</span>
    </div>
  );

  return (
    <ComparisonScanner className="relative">
      {cols > 2 && (
        <>
          <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-zinc-950/90 hover:bg-white dark:hover:bg-zinc-950 text-slate-800 dark:text-white p-2 rounded-full shadow-lg border border-slate-200 dark:border-zinc-700 transition-all" aria-label="Scroll left">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-zinc-950/90 hover:bg-white dark:hover:bg-zinc-950 text-slate-800 dark:text-white p-2 rounded-full shadow-lg border border-slate-200 dark:border-zinc-700 transition-all" aria-label="Scroll right">
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
      <div ref={scrollRef} className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-200 dark:border-zinc-700/60 shadow-sm">
        <div style={{ minWidth: cols * colWidth + 128 }}>
          {/* Sticky header row */}
          <div className="sticky top-0 z-20 flex bg-white dark:bg-zinc-950 border-b-2 border-slate-200 dark:border-zinc-700">
            <div className="shrink-0 w-28 md:w-32 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-700" />
            {products.map((p) => (
              <div
                key={p.id}
                className={`w-[280px] shrink-0 p-4 flex flex-col items-center text-center gap-2 border-r ${highlightId === p.id ? 'border-[#246BFF] bg-[#246BFF]/5 dark:bg-[#246BFF]/10' : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/60'}`}
              >
                {p.product_image && (
                  <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-900/30 p-2 border border-slate-200 dark:border-zinc-700/60">
                    <img src={proxyImageUrl(p.product_image)} alt={p.product_name} width={64} height={64} className="w-full h-full object-contain" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <div className="min-w-0">
                  {p.brand && <p className="text-[8px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-widest">{p.brand}</p>}
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">{p.product_name}</p>
                </div>
                {highlightId === p.id && <span className="text-[8px] text-[#246BFF] font-bold uppercase tracking-widest bg-[#246BFF]/10 px-2 py-0.5 rounded-full">This review</span>}
              </div>
            ))}
          </div>

          {/* Rating */}
          <div className="flex w-full">
            <RowLabel>Rating</RowLabel>
            {products.map((p) => (
              <Cell key={p.id} isHighlight={highlightId === p.id}>
                {p.rating ? renderStars(p.rating) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
              </Cell>
            ))}
          </div>

          {/* Price */}
          <div className="flex w-full">
            <RowLabel>Price</RowLabel>
            {products.map((p) => (
              <Cell key={p.id} isHighlight={highlightId === p.id}>
                {p.price ? <span className="font-bold text-slate-900 dark:text-white text-sm">{p.price}</span> : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
              </Cell>
            ))}
          </div>

          {/* Best For */}
          {products.some(p => p.best_for) && (
            <div className="flex w-full">
              <RowLabel>Best For</RowLabel>
              {products.map((p) => (
                <Cell key={p.id} isHighlight={highlightId === p.id}>
                  {p.best_for ? <span className="bg-[#246BFF]/10 text-[#246BFF] text-[9px] font-bold px-2 py-1 rounded-full self-start">{p.best_for}</span> : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                </Cell>
              ))}
            </div>
          )}

          {/* Pros */}
          {products.some(p => p.pros && p.pros.length > 0) && (
            <div className="flex w-full">
              <RowLabel>Pros</RowLabel>
              {products.map((p) => (
                <Cell key={p.id} isHighlight={highlightId === p.id}>
                  {(p.pros || []).length > 0 ? (
                    <ul className="space-y-1">
                      {(p.pros || []).slice(0, 4).map((pro, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-green-700 dark:text-green-300">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{pro}</span>
                        </li>
                      ))}
                      {(p.pros || []).length > 4 && <li className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold">+{p.pros!.length - 4} more</li>}
                    </ul>
                  ) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                </Cell>
              ))}
            </div>
          )}

          {/* Cons */}
          {products.some(p => p.cons && p.cons.length > 0) && (
            <div className="flex w-full">
              <RowLabel>Cons</RowLabel>
              {products.map((p) => (
                <Cell key={p.id} isHighlight={highlightId === p.id}>
                  {(p.cons || []).length > 0 ? (
                    <ul className="space-y-1">
                      {(p.cons || []).slice(0, 4).map((con, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-red-700 dark:text-red-300">
                          <XCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                          <span className="line-clamp-1">{con}</span>
                        </li>
                      ))}
                      {(p.cons || []).length > 4 && <li className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold">+{p.cons!.length - 4} more</li>}
                    </ul>
                  ) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                </Cell>
              ))}
            </div>
          )}

          {/* Key Features */}
          {products.some(p => p.key_features && p.key_features.length > 0) && (
            <div className="flex w-full">
              <RowLabel>Features</RowLabel>
              {products.map((p) => (
                <Cell key={p.id} isHighlight={highlightId === p.id}>
                  {(p.key_features || []).length > 0 ? (
                    <ul className="space-y-1">
                      {(p.key_features || []).slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-800 dark:text-zinc-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#246BFF] mt-1.5 shrink-0" />
                          <span className="line-clamp-1">{f}</span>
                        </li>
                      ))}
                      {(p.key_features || []).length > 4 && <li className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold">+{p.key_features!.length - 4} more</li>}
                    </ul>
                  ) : <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                </Cell>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="flex w-full">
            <RowLabel>Action</RowLabel>
            {products.map((p) => (
              <Cell key={p.id} isHighlight={highlightId === p.id}>
                <div className="flex flex-col gap-1.5">
                  <motion.a
                    href={cloakHref(p.slug, 'comparison') || p.affiliate_url || '#'}
                    target={cloakHref(p.slug, 'comparison') || p.affiliate_url ? '_blank' : undefined}
                    rel="noopener noreferrer sponsored"
                    className="inline-flex items-center justify-center gap-1 bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-[10px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer"
                    whileHover={prefersReduced ? {} : { scale: 1.03 }}
                    whileTap={prefersReduced ? {} : { scale: 0.97 }}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    {p.cta_text || 'Buy Now'}
                  </motion.a>
                  <motion.button
                    onClick={() => onNavigate('review', p.slug || p.id)}
                    className="inline-flex items-center justify-center gap-1 text-[9px] font-bold text-slate-500 dark:text-zinc-400 hover:text-[#246BFF] transition-all cursor-pointer"
                    whileHover={prefersReduced ? {} : { scale: 1.03 }}
                  >
                    <Eye className="w-3 h-3" />
                    Read Review
                  </motion.button>
                </div>
              </Cell>
            ))}
          </div>
        </div>
      </div>
    </ComparisonScanner>
  );
}

function CompareDrawer({
  selected,
  onRemove,
  onClear,
  onCompare,
  onClose,
}: {
  selected: CompareProduct[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
  onClose: () => void;
}) {
  const prefersReduced = useReducedMotion();
  return (
    <AnimatePresence>
      {selected.length > 0 && (
        <motion.div
          initial={prefersReduced ? {} : { y: 100, opacity: 0 }}
          animate={prefersReduced ? {} : { y: 0, opacity: 1 }}
          exit={prefersReduced ? {} : { y: 100, opacity: 0 }}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-700/60 shadow-2xl backdrop-blur-lg bg-white/95 dark:bg-zinc-950/95 p-3 md:p-4"
        >
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Scale className="w-5 h-5 text-[#246BFF] shrink-0" />
              <span className="text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap">Compare ({selected.length})</span>
              <div className="hidden md:flex items-center gap-2 overflow-x-auto max-w-md">
                {selected.map(p => (
                  <span key={p.id} className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-900 dark:bg-slate-900/60 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-[10px] font-medium text-slate-800 dark:text-zinc-300 whitespace-nowrap">
                    {p.product_name}
                    <button onClick={() => onRemove(p.id)} className="text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer" aria-label={`Remove ${p.product_name}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={onClear} className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-all px-3 py-2 cursor-pointer">
                Clear all
              </button>
              <motion.button
                onClick={onCompare}
                className="inline-flex items-center gap-1.5 bg-[#246BFF] hover:bg-[#1A5AD6] text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-lg cursor-pointer"
                whileHover={prefersReduced ? {} : { scale: 1.03 }}
                whileTap={prefersReduced ? {} : { scale: 0.97 }}
              >
                <Scale className="w-4 h-4" />
                Compare
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { CompareTable, CompareDrawer };
export type { CompareProduct };
