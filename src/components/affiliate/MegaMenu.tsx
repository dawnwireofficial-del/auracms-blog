import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, DollarSign, Star, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { proxyImageUrl } from '../../utils/safeRender';

interface MegaCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  children?: MegaCategory[];
  featured?: boolean;
}

interface MegaMenuProps {
  categories: MegaCategory[];
  onClose: () => void;
  onNavigate: (route: string, param?: string) => void;
}

const DEAL_LINKS = [
  { label: "Today's Deals", href: '/deals?type=daily', icon: DollarSign },
  { label: 'Best Sellers', href: '/products?sort=popularity', icon: Award },
  { label: 'Trending Now', href: '/products?isTrending=true', icon: TrendingUp },
  { label: 'Top Rated', href: '/products?sort=rating', icon: Star },
];

export default function MegaMenu({ categories, onClose, onNavigate }: MegaMenuProps) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleMouseEnter = (id: string) => {
    clearTimeout(timerRef.current);
    setActiveCat(id);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => setActiveCat(null), 200);
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const topCats = categories.filter(c => !c.featured).slice(0, 8);
  const featuredCats = categories.filter(c => c.featured).slice(0, 4);

  return (
    <AnimatePresence>
      <motion.div
        key="mega-menu"
        ref={menuRef}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="absolute left-0 top-[120%] w-full rounded-2xl glass-dark-effect shadow-2xl z-50 overflow-hidden"
      >
        <div className="flex p-2">
          {/* Left column - main categories */}
          <div className="w-64 bg-white/5 dark:bg-black/20 rounded-xl py-4 shrink-0 shadow-inner">
            <div className="px-4 pb-2 mb-2 border-b border-brand-secondary/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Shop by Category</span>
            </div>
            {topCats.map(cat => (
              <button
                key={cat.id}
                onMouseEnter={() => handleMouseEnter(cat.id)}
                onClick={() => { onNavigate('category', cat.slug); onClose(); }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left transition-all ${
                  activeCat === cat.id
                    ? 'bg-brand-secondary/10 text-brand-secondary font-semibold border-l-2 border-brand-secondary'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-white/5 dark:hover:bg-white/5 hover:text-brand-secondary border-l-2 border-transparent'
                }`}
              >
                <span>{cat.name}</span>
                {(cat.children?.length ?? 0) > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
              </button>
            ))}
            <div className="mt-2 px-4 pt-2 border-t border-brand-secondary/10">
              <button onClick={() => { onNavigate('categories'); onClose(); }} className="text-xs font-semibold text-brand-secondary hover:underline">
                View All Categories →
              </button>
            </div>
          </div>

          {/* Right column - subcategories, deals, featured */}
          <div className="flex-1 grid grid-cols-4 gap-6 p-6">
            {/* Active category's children */}
            <div className="col-span-2">
              <AnimatePresence mode="wait">
                {activeCat ? (
                  (() => {
                    const active = categories.find(c => c.id === activeCat);
                    if (!active) return null;
                    const children = active.children || [];
                    const mid = Math.ceil(children.length / 2);
                    return (
                      <motion.div
                        key={activeCat}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button onClick={() => { onNavigate('category', active.slug); onClose(); }} className="text-sm font-display font-bold text-slate-800 dark:text-zinc-100 hover:text-brand-secondary mb-3 block">
                          {active.name}
                        </button>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                          <div>
                            {children.slice(0, mid).map(child => (
                              <button key={child.id} onClick={() => { onNavigate('category', child.slug); onClose(); }} className="block text-xs text-slate-600 dark:text-zinc-400 hover:text-brand-secondary py-1 transition-colors">
                                {child.name}
                              </button>
                            ))}
                            {children.length === 0 && (
                              <p className="text-xs text-slate-400 dark:text-zinc-500 italic">All products in this category</p>
                            )}
                          </div>
                          <div>
                            {children.slice(mid).map(child => (
                              <button key={child.id} onClick={() => { onNavigate('category', child.slug); onClose(); }} className="block text-xs text-slate-600 dark:text-zinc-400 hover:text-brand-secondary py-1 transition-colors">
                                {child.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center py-8 text-slate-400 dark:text-zinc-500"
                  >
                    <p className="text-xs">Hover over a category to see subcategories</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Deals column */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">Deals & Trends</span>
              <div className="space-y-2">
                {DEAL_LINKS.map(deal => (
                  <button
                    key={deal.label}
                    onClick={() => { onNavigate(deal.href.startsWith('/') ? deal.href.substring(1).split('?')[0] : deal.href); onClose(); }}
                    className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 hover:text-brand-secondary py-1.5 transition-colors w-full text-left"
                  >
                    <deal.icon className="h-3.5 w-3.5" />
                    {deal.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-brand-secondary/10">
                <button onClick={() => { onNavigate('buying-guides'); onClose(); }} className="text-xs font-semibold text-brand-secondary hover:underline block mb-2">
                  Buying Guides →
                </button>
                <button onClick={() => { onNavigate('deals'); onClose(); }} className="text-xs font-semibold text-brand-accent hover:underline block">
                  All Deals →
                </button>
              </div>
            </div>

            {/* Featured brands / image */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-3">Featured</span>
              <div className="space-y-2">
                {featuredCats.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { onNavigate('category', cat.slug); onClose(); }}
                    className="block relative rounded-lg overflow-hidden aspect-[4/3] bg-slate-100 dark:bg-zinc-800 group w-full text-left border border-brand-secondary/10"
                  >
                    {cat.image ? (
                      <img src={proxyImageUrl(cat.image)} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-tr from-brand-secondary/20 to-brand-accent/20 group-hover:scale-110 transition-transform duration-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                    <span className="absolute bottom-2 left-2 text-xs font-bold text-white z-10 group-hover:text-brand-secondary transition-colors">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
