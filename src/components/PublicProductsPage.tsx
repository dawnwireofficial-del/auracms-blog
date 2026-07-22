import React, { useState, useEffect, useMemo } from 'react';
import { Star, ShoppingBag, Search, Eye, Scale, CheckSquare, Square, Share2, Filter, RotateCcw, ChevronRight, Home, Flame, Tag, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SeoHelmet from './SeoHelmet';
import { CompareTable, CompareDrawer } from './CompareProducts';
import { normalizeProducts } from '../utils/productMapper';

interface PublicProductsPageProps {
  onNavigate: (route: string, param?: string) => void;
}

export default function PublicProductsPage({ onNavigate }: PublicProductsPageProps) {
  const [rawReviews, setRawReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [onlyDeals, setOnlyDeals] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');

  // Comparison State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCompareView, setShowCompareView] = useState(false);

  // Read initial query params from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      const cat = params.get('category') || 'all';
      const minP = params.get('minPrice') || '';
      const maxP = params.get('maxPrice') || '';
      const minR = parseFloat(params.get('minRating') || '0');
      const inStock = params.get('inStock') === 'true';
      const deals = params.get('isDeal') === 'true' || params.get('deal') === 'true';
      const sort = params.get('sort') || 'newest';

      if (q) setSearchTerm(q);
      if (cat) setActiveCategory(cat);
      if (minP) setMinPrice(minP);
      if (maxP) setMaxPrice(maxP);
      if (minR > 0) setMinRating(minR);
      if (inStock) setOnlyInStock(true);
      if (deals) setOnlyDeals(true);
      if (sort) setSortBy(sort);
    }
  }, []);

  // Fetch products
  useEffect(() => {
    fetch('/api/public/product-reviews?limit=500')
      .then(r => r.json())
      .then(res => setRawReviews(Array.isArray(res) ? res : res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const normalizedReviews = useMemo(() => normalizeProducts(rawReviews), [rawReviews]);

  // Derived category list
  const categoryList = useMemo(() => {
    const set = new Set<string>();
    normalizedReviews.forEach(r => {
      if (r.bestFor) set.add(r.bestFor);
      if (r.brand) set.add(r.brand);
    });
    return ['all', ...Array.from(set)];
  }, [normalizedReviews]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return normalizedReviews.filter(r => {
      if (!r) return false;

      // Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const pName = (r.productName || '').toLowerCase();
        const bName = (r.brand || '').toLowerCase();
        const summary = (r.reviewSummary || '').toLowerCase();
        if (!pName.includes(query) && !bName.includes(query) && !summary.includes(query)) {
          return false;
        }
      }

      // Category / BestFor Filter
      if (activeCategory !== 'all') {
        const catMatch = r.bestFor?.toLowerCase() === activeCategory.toLowerCase() ||
                         r.brand?.toLowerCase() === activeCategory.toLowerCase() ||
                         r.categoryId === activeCategory;
        if (!catMatch) return false;
      }

      // Price Range Filter
      const numPrice = parseFloat((r.price || '0').toString().replace(/[^0-9.]/g, ''));
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        if (numPrice < parseFloat(minPrice)) return false;
      }
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        if (numPrice > parseFloat(maxPrice)) return false;
      }

      // Rating Filter
      if (minRating > 0 && (r.rating || 0) < minRating) return false;

      // In Stock Filter
      if (onlyInStock && r.stockStatus === 'out_of_stock') return false;

      // Deals Filter
      if (onlyDeals && !r.dealBadge && !r.couponCode) return false;

      return true;
    }).sort((a, b) => {
      const priceA = parseFloat((a.price || '0').toString().replace(/[^0-9.]/g, ''));
      const priceB = parseFloat((b.price || '0').toString().replace(/[^0-9.]/g, ''));

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'popularity') return (b.clickCount || 0) - (a.clickCount || 0);

      // Default 'newest'
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [normalizedReviews, searchTerm, activeCategory, minPrice, maxPrice, minRating, onlyInStock, onlyDeals, sortBy]);

  // Sync state changes with URL query string
  const updateUrlParams = (updates: Record<string, string | null>) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '' || val === 'all' || val === '0' || val === 'false' || val === 'newest') {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, val);
      }
    });
    window.history.replaceState({}, '', url.toString());
  };

  // Full reset function
  const handleClearFilters = () => {
    setActiveCategory('all');
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setOnlyInStock(false);
    setOnlyDeals(false);
    setSortBy('newest');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const selectedList = rawReviews.filter(r => r && selectedIds.has(r.id));
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 6) next.add(id);
      return next;
    });
  };

  const isFiltered = activeCategory !== 'all' || !!searchTerm || !!minPrice || !!maxPrice || minRating > 0 || onlyInStock || onlyDeals || sortBy !== 'newest';

  // Structured Data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.dawnwire.com/' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://www.dawnwire.com/products' }
    ]
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'All Products, Reviews and Amazon Deals',
    numberOfItems: filteredProducts.length,
    itemListElement: filteredProducts.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: p.productName,
      url: `https://www.dawnwire.com/products/${p.slug || p.id}`
    }))
  };

  if (showCompareView && selectedList.length >= 2) {
    return (
      <>
        <SeoHelmet
          title="Compare Products | DawnWire"
          description="Side-by-side product comparison."
          canonical="https://www.dawnwire.com/products"
        />
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-[#246BFF]" />
              <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900 dark:text-white">Product Comparison</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCompareView(false)}
                className="text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 transition-colors px-4 py-2 cursor-pointer"
              >
                Back to products
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
        </div>
      </>
    );
  }

  return (
    <>
      <SeoHelmet
        title="All Products, Reviews and Amazon Deals | DawnWire"
        description="Browse DawnWire’s curated products, expert reviews, comparisons and Amazon deals across popular categories."
        canonical="https://www.dawnwire.com/products"
        ogType="website"
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Breadcrumb Header */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 mb-6">
          <button onClick={() => onNavigate('home')} className="hover:text-[#246BFF] flex items-center gap-1 transition-colors">
            <Home className="w-3.5 h-3.5" />
            Home
          </button>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-900 dark:text-zinc-200">Products</span>
        </nav>

        {/* Page Title & Intro */}
        <div className="mb-8 border-b border-slate-200 dark:border-zinc-800 pb-6">
          <h1 className="font-display font-bold text-3xl md:text-4xl text-slate-900 dark:text-white mb-2">
            All Products
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-3xl">
            Browse DawnWire’s curated products, expert reviews, comparisons and Amazon deals across popular categories.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-slate-50 dark:bg-zinc-900/50 p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 mb-8 space-y-4">
          
          {/* Top Row: Search input + Category Pills */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  updateUrlParams({ q: e.target.value });
                }}
                placeholder="Search products or brands..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 focus:outline-none focus:border-[#246BFF]"
              />
            </div>

            {/* Category Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
              {categoryList.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    updateUrlParams({ category: cat });
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#246BFF] text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-950 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 hover:border-[#246BFF]'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Row: Advanced Controls (Sort, Price, Rating, Deals, Stock) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-zinc-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Sort By */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={e => {
                    setSortBy(e.target.value);
                    updateUrlParams({ sort: e.target.value });
                  }}
                  className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-zinc-200 font-semibold focus:outline-none focus:border-[#246BFF]"
                >
                  <option value="newest">Newest First</option>
                  <option value="popularity">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              {/* Price Min/Max */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Price:</span>
                <input
                  type="number"
                  placeholder="Min $"
                  value={minPrice}
                  onChange={e => { setMinPrice(e.target.value); updateUrlParams({ minPrice: e.target.value }); }}
                  className="w-16 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-slate-700 dark:text-zinc-200 focus:outline-none"
                />
                <span className="text-slate-400">-</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={maxPrice}
                  onChange={e => { setMaxPrice(e.target.value); updateUrlParams({ maxPrice: e.target.value }); }}
                  className="w-16 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-slate-700 dark:text-zinc-200 focus:outline-none"
                />
              </div>

              {/* Min Rating */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Min Rating:</span>
                <select
                  value={minRating}
                  onChange={e => {
                    const r = parseFloat(e.target.value);
                    setMinRating(r);
                    updateUrlParams({ minRating: r ? r.toString() : null });
                  }}
                  className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-zinc-200 font-semibold focus:outline-none"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              {/* Deals Toggle */}
              <button
                onClick={() => {
                  setOnlyDeals(prev => {
                    updateUrlParams({ isDeal: (!prev).toString() });
                    return !prev;
                  });
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                  onlyDeals
                    ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                    : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-red-400'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Deals Only
              </button>

              {/* Stock Toggle */}
              <button
                onClick={() => {
                  setOnlyInStock(prev => {
                    updateUrlParams({ inStock: (!prev).toString() });
                    return !prev;
                  });
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                  onlyInStock
                    ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                    : 'bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-green-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                In Stock Only
              </button>

            </div>

            {/* Clear Filters Button */}
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-slate-500 hover:text-red-600 font-bold transition-colors px-2 py-1 cursor-pointer ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}

          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 mb-6">
          <span>
            Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}
            {isFiltered && ` (filtered from ${normalizedReviews.length})`}
          </span>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-20 text-sm text-slate-500 dark:text-zinc-400">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-zinc-900/30 rounded-2xl border border-slate-200 dark:border-zinc-800 p-8">
            <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 dark:text-zinc-200 mb-1">No products match your filters</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">Try clearing filters or adjusting your search term.</p>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-[#246BFF] text-white text-xs font-bold rounded-xl hover:bg-[#1A5AD6] transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((review, i) => {
              const isSelected = selectedIds.has(review.id);
              const productDetailUrl = `/products/${review.slug || review.id}`;

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
                  <div
                    onClick={() => onNavigate('review', review.slug || review.id)}
                    className="aspect-square bg-slate-50 dark:bg-slate-900/30 relative overflow-hidden cursor-pointer"
                  >
                    {review.productImage ? (
                      <img src={review.productImage} alt={review.productName} className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-zinc-400 text-xs">No image</div>
                    )}
                    {review.bestFor && (
                      <span className="absolute top-2 left-2 bg-[#7C3AED]/90 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                        {review.bestFor}
                      </span>
                    )}
                    {(review.rating || 0) > 0 ? (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-amber-500 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {(review.rating || 0).toFixed(1)}
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                        Not rated
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
                    <h3
                      onClick={() => onNavigate('review', review.slug || review.id)}
                      className="font-display font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[2.5em] hover:text-[#246BFF] cursor-pointer transition-colors"
                    >
                      {review.productName}
                    </h3>

                    <div className="mt-auto">
                      {review.price && (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-slate-900 dark:text-white">{review.price}</span>
                          {review.originalPrice && review.originalPrice !== review.price && (
                            <span className="text-[10px] text-red-500 line-through">{review.originalPrice}</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {review.dealBadge && (
                          <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">🔥 {review.dealBadge}</span>
                        )}
                        {review.couponCode && (
                          <span className="text-[9px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-full">🏷️ {review.couponCode}</span>
                        )}
                        {review.stockStatus && review.stockStatus !== 'in_stock' && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            review.stockStatus === 'low_stock' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300' :
                            review.stockStatus === 'limited' ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300' :
                            'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-300'
                          }`}>{review.stockStatus.replace('_', ' ')}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex gap-2">
                        <motion.a
                          href={review.affiliateUrl ? (review.affiliateUrl.includes('tag=') ? review.affiliateUrl : `${review.affiliateUrl}${review.affiliateUrl.includes('?') ? '&' : '?'}tag=dawnwire-20`) : '#'}
                          target={review.affiliateUrl ? '_blank' : undefined}
                          rel={review.affiliateUrl ? 'noopener noreferrer sponsored' : undefined}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-[11px] font-extrabold px-3 py-2.5 rounded-lg shadow-sm transition-all duration-200 cursor-pointer uppercase tracking-wider"
                          whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(245,158,11,0.5)' }}
                          whileTap={{ scale: 0.97 }}
                          onClick={(e) => { 
                            if (!review.affiliateUrl) { 
                              e.preventDefault(); 
                              onNavigate('review', review.slug || review.id); 
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
                          {review.ctaText || 'Buy on Amazon'}
                        </motion.a>
                        <motion.button
                          onClick={() => onNavigate('review', review.slug || review.id)}
                          className="flex items-center justify-center gap-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-[10px] font-semibold px-3 py-2.5 rounded-lg hover:bg-[#246BFF]/10 hover:text-[#246BFF] hover:border-[#246BFF]/30 transition-all shrink-0 cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Read full review"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `${window.location.origin}${productDetailUrl}`;
                            const title = `${review.productName} Review - DawnWire`;
                            if (navigator.share) {
                              navigator.share({ title, url });
                            } else {
                              navigator.clipboard.writeText(url);
                            }
                          }}
                          className="flex items-center justify-center gap-1 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 text-[10px] font-semibold px-2.5 py-2.5 rounded-lg hover:bg-[#246BFF]/10 hover:text-[#246BFF] hover:border-[#246BFF]/30 transition-all shrink-0 cursor-pointer"
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
