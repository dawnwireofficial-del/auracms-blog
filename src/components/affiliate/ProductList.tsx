import React, { useState, useEffect, useMemo } from 'react';
import { Grid3X3, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { ProductReview } from '../../types';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: ProductReview[];
  categories?: { id: string; name: string; slug: string }[];
  brands?: { id: string; name: string }[];
  showFilters?: boolean;
  title?: string;
  description?: string;
  onCompare?: (ids: string[]) => void;
  compareMode?: boolean;
}

export default function ProductList({ products, categories, brands, showFilters = true, title, description, onCompare, compareMode }: ProductListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sort, setSort] = useState('rating');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [minRating, setMinRating] = useState(0);
  const [showDealsOnly, setShowDealsOnly] = useState(false);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [maxPrice, setMaxPrice] = useState(5000);

  // Calculate max price from data
  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) return;
    const prices = products.map(p => parseFloat(String(p.price || p.currentPrice || '0')));
    const max = Math.max(...prices, 100);
    setMaxPrice(max);
    setPriceRange([0, max]);
  }, [products]);

  const filtered = useMemo(() => {
    let items = Array.isArray(products) ? [...products] : [];

    if (selectedCategory) {
      const cat = categories?.find(c => c.id === selectedCategory);
      items = items.filter(p => {
        if (p.categoryId === selectedCategory) return true;
        const bf = ((p as any).best_for || p.bestFor || '').toLowerCase();
        const cn = (cat?.name || '').toLowerCase();
        if (!bf) return false;
        const catWords = cn.split(/\s+/).filter(Boolean);
        const bestWords = bf.split(/\s+/).filter(Boolean);
        return catWords.some((w: string) => bestWords.includes(w));
      });
    }
    if (selectedBrand) items = items.filter(p => p.brand === selectedBrand || (p as any).brandId === selectedBrand);
    items = items.filter(p => {
      const price = parseFloat(String(p.price || p.currentPrice || '0'));
      return price >= priceRange[0] && price <= priceRange[1];
    });
    if (minRating > 0) items = items.filter(p => (p.rating || 0) >= minRating);
    if (showDealsOnly) items = items.filter(p => (p as any).isDeal || ((p as any).discountPercentage || 0) > 0 || (parseFloat(String(p.originalPrice || '0')) > parseFloat(String(p.price || p.currentPrice || '0'))));
    if (showInStockOnly) items = items.filter(p => p.stockStatus !== 'out_of_stock');

    switch (sort) {
      case 'price_asc': items.sort((a, b) => parseFloat(String(a.price || a.currentPrice || '0')) - parseFloat(String(b.price || b.currentPrice || '0'))); break;
      case 'price_desc': items.sort((a, b) => parseFloat(String(b.price || b.currentPrice || '0')) - parseFloat(String(a.price || a.currentPrice || '0'))); break;
      case 'rating': items.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'popularity': items.sort((a, b) => ((b as any).pageViews || 0) - ((a as any).pageViews || 0)); break;
      case 'discount': items.sort((a, b) => ((b as any).discountPercentage || 0) - ((a as any).discountPercentage || 0)); break;
      case 'newest': items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()); break;
      default: items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return items;
  }, [products, selectedCategory, selectedBrand, priceRange, minRating, showDealsOnly, showInStockOnly, sort]);

  const handleCompareToggle = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const activeFilterCount = [selectedCategory, selectedBrand, minRating > 0, showDealsOnly, showInStockOnly].filter(Boolean).length;

  return (
    <div>
      {/* Title & Description */}
      {title && <h1 className="text-2xl font-bold text-slate-800 dark:text-zinc-100">{title}</h1>}
      {description && <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">{description}</p>}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mt-6 mb-4">
        <div className="flex items-center gap-2">
          {/* Mobile filter toggle */}
          {showFilters && (
            <button onClick={() => setShowFiltersMobile(!showFiltersMobile)} className="lg:hidden flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && <span className="bg-brand-secondary text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{activeFilterCount}</span>}
            </button>
          )}
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            {filtered.length !== products.length && ` (filtered from ${products.length})`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center glass-panel shadow-sm border border-brand-secondary/20 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-brand-secondary text-white' : 'text-slate-400 hover:text-slate-600'}`}>
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-brand-secondary text-white' : 'text-slate-400 hover:text-slate-600'}`}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)} className="text-xs bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-slate-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-secondary">
            <option value="rating">Best Rated</option>
            <option value="popularity">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="discount">Biggest Discount</option>
          </select>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        {showFilters && (
          <div className={`${showFiltersMobile ? 'fixed inset-0 z-50 flex' : 'hidden'} lg:relative lg:flex lg:w-56 shrink-0`}>
            {/* Mobile overlay */}
            {showFiltersMobile && <div className="absolute inset-0 bg-black/30" onClick={() => setShowFiltersMobile(false)} />}
            <div className={`relative w-72 lg:w-full glass-panel border border-brand-secondary/20 rounded-xl p-4 overflow-y-auto ${showFiltersMobile ? 'max-h-screen' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Filters</span>
                <button onClick={() => setShowFiltersMobile(false)} className="lg:hidden text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
              </div>

              {/* Categories */}
              {categories && categories.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 mb-2">Category</p>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-slate-600 dark:text-zinc-300">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Brands */}
              {brands && brands.length > 0 && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 mb-2">Brand</p>
                  <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-slate-600 dark:text-zinc-300">
                    <option value="">All Brands</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}

              {/* Price Range */}
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 mb-2">Price Range</p>
                <div className="flex items-center gap-2">
                  <input type="number" value={priceRange[0]} onChange={e => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])} className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-slate-600 dark:text-zinc-300" placeholder="Min" />
                  <span className="text-xs text-slate-400">-</span>
                  <input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], parseFloat(e.target.value) || 0])} className="w-full text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-slate-600 dark:text-zinc-300" placeholder="Max" />
                </div>
              </div>

              {/* Rating */}
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-zinc-400 mb-2">Minimum Rating</p>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map(r => (
                    <button key={r} onClick={() => setMinRating(r)} className={`flex-1 text-[10px] py-1.5 rounded-lg border transition-colors ${minRating === r ? 'bg-brand-secondary text-white border-brand-secondary' : 'border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:border-brand-secondary'}`}>
                      {r === 0 ? 'All' : `${r}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle filters */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showDealsOnly} onChange={e => setShowDealsOnly(e.target.checked)} className="rounded border-slate-300 text-brand-secondary focus:ring-brand-secondary" />
                  <span className="text-xs text-slate-600 dark:text-zinc-300">Deals & Discounts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showInStockOnly} onChange={e => setShowInStockOnly(e.target.checked)} className="rounded border-slate-300 text-brand-secondary focus:ring-brand-secondary" />
                  <span className="text-xs text-slate-600 dark:text-zinc-300">In Stock Only</span>
                </label>
              </div>

              {/* Compare button */}
              {compareMode && compareIds.length >= 2 && (
                <button onClick={() => onCompare?.(compareIds)} className="w-full mt-4 bg-brand-secondary text-white text-xs font-bold py-2 rounded-lg hover:bg-brand-accent transition-colors">
                  Compare ({compareIds.length})
                </button>
              )}

              {/* Clear */}
              <button onClick={() => { setSelectedCategory(''); setSelectedBrand(''); setPriceRange([0, maxPrice]); setMinRating(0); setShowDealsOnly(false); setShowInStockOnly(false); }} className="w-full mt-2 text-[10px] text-slate-400 hover:text-slate-600 py-1">
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-zinc-500">
              <p className="text-sm">No products match your filters.</p>
              <button onClick={() => { setSelectedCategory(''); setSelectedBrand(''); setPriceRange([0, maxPrice]); setMinRating(0); setShowDealsOnly(false); setShowInStockOnly(false); }} className="text-xs text-brand-secondary font-semibold mt-2 hover:underline">
                Clear filters
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode="grid"
                  onWishlistToggle={handleCompareToggle}
                  inWishlist={compareIds.includes(product.id)}
                  onCompare={compareMode ? handleCompareToggle : undefined}
                  compareSelected={compareIds.includes(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode="list"
                  onWishlistToggle={handleCompareToggle}
                  inWishlist={compareIds.includes(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
