import React, { useState, useEffect } from 'react';
import { Tag, ExternalLink, Copy, Check, Clock, ShoppingBag, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import ScrollReveal from '../ScrollReveal';

export default function DealsPage({ onNavigate }: { onNavigate: (r: string, p?: string) => void }) {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        const res = await fetch('/api/public/product-reviews');
        if (res.ok) {
          const body = await res.json();
          // Filter only products that have a deal badge or discount
          const allProducts = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
          const activeDeals = allProducts.filter((p: any) => p.deal_badge || (p.original_price && p.price && p.original_price !== p.price));
          setDeals(activeDeals);
        }
      } catch (e) {
        console.error("Failed to load deals:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  const copyCoupon = (e: React.MouseEvent, id: string, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 min-h-screen pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-bold mb-4">
              <Tag className="h-4 w-4" />
              Active Deals & Discounts
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight mb-4">
              Today's Top Offers
            </h1>
            <p className="text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Curated discounts, flash sales, and exclusive coupons on the best gear across the web.
            </p>
          </div>
        </ScrollReveal>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 border-4 border-[#246BFF] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Active Deals Right Now</h3>
            <p className="text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
              We're currently scouting for the best discounts. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden hover:shadow-xl hover:shadow-[#246BFF]/10 hover:border-[#246BFF]/30 transition-all group flex flex-col cursor-pointer"
                onClick={() => onNavigate('product', deal.slug || deal.id)}
              >
                {/* Image & Badges */}
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-zinc-800 p-6 flex items-center justify-center overflow-hidden">
                  <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {deal.deal_badge && (
                      <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {deal.deal_badge}
                      </span>
                    )}
                  </div>
                  
                  {deal.product_image ? (
                    <img src={deal.product_image} alt={deal.product_name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-zinc-700" />
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {deal.brand && <div className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">{deal.brand}</div>}
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-3 line-clamp-2 flex-1 group-hover:text-[#246BFF] transition-colors">
                    {deal.product_name}
                  </h3>

                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-xl font-black text-slate-900 dark:text-white">{deal.price}</span>
                    {deal.original_price && (
                      <span className="text-sm font-medium text-slate-400 dark:text-zinc-500 line-through mb-0.5">{deal.original_price}</span>
                    )}
                  </div>

                  {/* Coupon Area */}
                  {deal.coupon_code && (
                    <div className="mt-auto mb-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase block mb-1">Use Code</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-white tracking-wider">{deal.coupon_code}</span>
                        </div>
                        <button
                          onClick={(e) => copyCoupon(e, deal.id, deal.coupon_code!)}
                          className={`p-2 rounded-md transition-colors ${copiedId === deal.id ? 'bg-green-100 text-green-600' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 hover:bg-orange-200'}`}
                        >
                          {copiedId === deal.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                      {deal.coupon_expiry && (
                        <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-orange-600/70 dark:text-orange-400/70">
                          <Clock className="h-3 w-3" />
                          Expires: {new Date(deal.coupon_expiry).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <div className={`mt-auto w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    deal.coupon_code ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700' : 'bg-[#246BFF] text-white hover:bg-[#1A5AD6] shadow-md hover:shadow-lg hover:shadow-[#246BFF]/20'
                  }`}>
                    {deal.cta_text || 'View Deal'} <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
