import React, { useState, useEffect } from 'react';
import { Star, ShoppingBag, Search, Eye, Scale, X, CheckSquare, Square, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import SeoHelmet from './SeoHelmet';
import { CompareTable, CompareDrawer } from './CompareProducts';

interface PublicProductsPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export default function PublicProductsPage({ onNavigate }: PublicProductsPageProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCompareView, setShowCompareView] = useState(false);

  useEffect(() => {
    fetch('/api/public/product-reviews?limit=500')
      .then(r => r.json())
      .then(res => setReviews(res.data || res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(reviews.map(r => r?.best_for || 'General').filter(Boolean))];
  const filtered = reviews.filter(r => {
    if (!r) return false;
    const productName = (r.product_name || '').toLowerCase();
    const brandName = (r.brand || '').toLowerCase();
    const query = (searchTerm || '').toLowerCase();
    if (activeCategory !== 'all' && (r.best_for || 'General') !== activeCategory) return false;
    if (query && !productName.includes(query) && !brandName.includes(query)) return false;
    return true;
  });

  const selectedList = reviews.filter(r => selectedIds.has(r.id));
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 6) next.add(id);
      return next;
    });
  };

  if (showCompareView && selectedList.length >= 2) {
    return (
      <>
        <SeoHelmet title="Compare Products" description="Side-by-side product comparison." />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-[#246BFF]" />
              <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900 dark:text-white dark:text-white">Product Comparison</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCompareView(false)}
                className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 transition-colors px-4 py-2 cursor-pointer"
              >
                Back to list
              </button>
              <button
                onClick={() => { setSelectedIds(new Set()); setShowCompareView(false); }}
                className="text-xs font-bold text-red-600/70 dark:text-red-400/70 hover:text-red-600 dark:hover:text-red-400 transition-colors px-4 py-2 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          </div>
          <CompareTable products={selectedList} onNavigate={onNavigate} />
          <div className="mt-12 text-[10px] text-slate-500 dark:text-zinc-600 italic text-center border-t border-slate-200 dark:border-zinc-700 pt-6">
            Some links on this page are affiliate links. We may earn a commission at no extra cost to you.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHelmet title="Product Reviews" description="In-depth product reviews and buying guides by DawnWire." canonical="/products" ogType="website" />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white dark:text-white mb-2">Product Reviews</h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm">Honest, in-depth reviews of the latest products.</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <input
              type="text"
              id="product-search"
              name="product-search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/40 text-sm focus:outline-none focus:border-[#246BFF] br-input"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  activeCategory === cat
                    ? 'bg-[#246BFF] text-white shadow-md'
                    : 'bg-slate-50 dark:bg-zinc-900 dark:bg-zinc-950/40 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:border-[#246BFF]'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20 text-sm text-slate-500 dark:text-zinc-400">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-sm text-slate-500 dark:text-zinc-400">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((review, i) => {
              const isSelected = selectedIds.has(review.id);
              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-white dark:bg-zinc-950/60 border rounded-xl shadow-sm transition-all duration-300 group overflow-hidden flex flex-col ${
                    isSelected ? 'border-[#246BFF] ring-2 ring-[#246BFF]/30' : 'border-slate-200 dark:border-zinc-700/60 hover:shadow-lg'
                  }`}
                >
                  {/* Image */}
                  <div className="aspect-square bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden">
                    {review.product_image ? (
                      <img src={review.product_image} alt={review.product_name} className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-zinc-400 text-xs">No image</div>
                    )}
                    {review.best_for && (
                      <span className="absolute top-2 left-2 bg-[#7C3AED]/90 text-slate-900 dark:text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                        {review.best_for}
                      </span>
                    )}
                    {(review.rating || 0) > 0 && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-amber-500 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {(review.rating || 0).toFixed(1)}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#246BFF]/10 flex items-center justify-center">
                        <span className="bg-[#246BFF] text-white text-[9px] font-bold px-2 py-1 rounded-full">Selected</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    {review.brand && (
                      <p className="text-[9px] text-slate-500 dark:text-zinc-500 font-bold uppercase tracking-[0.15em]">{review.brand}</p>
                    )}
                    <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white dark:text-white leading-snug line-clamp-2 min-h-[2.5em]">
                      {review.product_name}
                    </h3>

                    <div className="mt-auto">
                      {review.price && (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900 dark:text-white dark:text-white">{review.price}</span>
                          {review.original_price && review.original_price !== review.price && (
                            <span className="text-[10px] text-red-500 line-through">{review.original_price}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {review.deal_badge && (
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">🔥 {review.deal_badge}</span>
                        )}
                        {review.coupon_code && (
                          <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">🏷️ {review.coupon_code}</span>
                        )}
                        {review.stock_status && review.stock_status !== 'in_stock' && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            review.stock_status === 'low_stock' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300' :
                            review.stock_status === 'limited' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300' :
                            'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'
                          }`}>{review.stock_status.replace('_', ' ')}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex gap-2">
                        <motion.a
                          href={review.affiliate_url ? (review.affiliate_url.includes('tag=') ? review.affiliate_url : `${review.affiliate_url}${review.affiliate_url.includes('?') ? '&' : '?'}tag=dawnwire-20`) : '#'}
                          target={review.affiliate_url ? '_blank' : undefined}
                          rel={review.affiliate_url ? 'noopener noreferrer sponsored' : undefined}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-[11px] font-extrabold px-3 py-2.5 rounded-lg shadow-sm transition-all duration-200 cursor-pointer uppercase tracking-wider"
                          whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(245,158,11,0.5)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={(e) => { 
                            if (!review.affiliate_url) { 
                              e.preventDefault(); 
                              onNavigate('review', review.id); 
                            } else {
                              fetch('/api/public/track/affiliate-click', { 
                                method: 'POST', 
                                headers: { 'Content-Type': 'application/json' }, 
                                body: JSON.stringify({ productId: review.id, pageUrl: window.location.pathname }) 
                              }).catch(() => {});
                            } 
                          }}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          {review.cta_text || 'Buy on Amazon'}
                        </motion.a>
                        <motion.button
                          onClick={() => onNavigate('review', review.slug || review.id)}
                          className="flex items-center justify-center gap-1 bg-slate-50 dark:bg-zinc-900 dark:bg-slate-900/40 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-[10px] font-semibold px-3 py-2.5 rounded-lg hover:bg-[#246BFF]/10 hover:text-[#246BFF] hover:border-[#246BFF]/30 transition-all shrink-0"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Read full review"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `${window.location.origin}/review/${review.slug || review.id}`;
                            const title = `${review.product_name} Review - DawnWire`;
                            if (navigator.share) {
                              navigator.share({ title, url });
                            } else {
                              navigator.clipboard.writeText(url);
                            }
                          }}
                          className="flex items-center justify-center gap-1 bg-slate-50 dark:bg-zinc-900 dark:bg-slate-900/40 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-[10px] font-semibold px-2.5 py-2.5 rounded-lg hover:bg-[#246BFF]/10 hover:text-[#246BFF] hover:border-[#246BFF]/30 transition-all shrink-0"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Share"
                        >
                          <Share2 className="w-3 h-3" />
                        </motion.button>
                      </div>
                      {/* Compare toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(review.id); }}
                        className={`flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition-all cursor-pointer ${
                          isSelected
                            ? 'text-[#246BFF] bg-[#246BFF]/5'
                            : 'text-slate-500 dark:text-zinc-500 hover:text-[#246BFF] hover:bg-[#246BFF]/5'
                        }`}
                      >
                        {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        {isSelected ? 'Added to compare' : `Compare${selectedIds.size >= 6 ? ' (max 6)' : ''}`}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Affiliate Disclosure */}
        <div className="mt-12 text-[10px] text-slate-500 dark:text-zinc-600 italic text-center border-t border-slate-200 dark:border-zinc-700 pt-6">
          Some links on this page are affiliate links. We may earn a commission at no extra cost to you.
        </div>
      </div>

      {/* Floating compare drawer */}
      <CompareDrawer
        selected={selectedList}
        onRemove={(id) => setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; })}
        onClear={() => setSelectedIds(new Set())}
        onCompare={() => setShowCompareView(true)}
        onClose={() => {}}
      />
      {selectedList.length > 0 && <div className="h-20" />}
    </>
  );
}
