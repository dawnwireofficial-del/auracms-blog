import React, { useState, useEffect } from 'react';
import { ProductCard } from '../components/common/ProductCard';
import { DisclosureBanner } from '../components/common/DisclosureBanner';
import { ProductCatalogSkeleton } from '../components/common/Skeletons';
import { SideBySideComparisonModal } from '../components/product/SideBySideComparisonModal';
import { NoResultsEmptyState } from '../components/common/EmptyState';
import { useAppStore } from '../lib/store';
import { triggerPageLoadProgress } from '../lib/navigation';
import { AmbientGlow } from '../components/visual/AmbientGlow';
import { TechnicalGrid } from '../components/visual/TechnicalGrid';
import { GradientDivider } from '../components/visual/GradientDivider';

interface ProductCatalogPageProps {
  initialCategory?: string;
  initialQuery?: string;
  initialBrand?: string;
  isLoading?: boolean;
}

export const ProductCatalogPage: React.FC<ProductCatalogPageProps> = ({
  initialCategory = 'all',
  initialQuery = '',
  initialBrand = '',
  isLoading: externalIsLoading = false,
}) => {
  const { products, categories } = useAppStore();

  // Resolve initialCategory slug to category ID
  const resolvedInitial = initialCategory && initialCategory !== 'all'
    ? categories.find(c => c.slug === initialCategory)?.id || 'all'
    : 'all';

  const [selectedCategory, setSelectedCategory] = useState(resolvedInitial);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [onlyPrime, setOnlyPrime] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<'score' | 'price_asc' | 'price_desc' | 'rating'>('score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const perPage = 24;

  // Comparison selection state
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const handleToggleCompare = (productId: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 2) {
        // Replace second item
        return [prev[0], productId];
      }
      return [...prev, productId];
    });
  };

  useEffect(() => {
    const newCat = initialCategory && initialCategory !== 'all'
      ? categories.find(c => c.slug === initialCategory)?.id || 'all'
      : 'all';
    setSelectedCategory(newCat);
    setSearchQuery(initialQuery);
    setSelectedBrand(initialBrand);
  }, [initialCategory, initialQuery, initialBrand, categories]);

  useEffect(() => {
    if (selectedCompareIds.length === 2) {
      setIsCompareModalOpen(true);
    }
  }, [selectedCompareIds]);

  // Simulated smooth loading transition state when category or query updates
  const [isInternalLoading, setIsInternalLoading] = useState(true);

  useEffect(() => {
    setIsInternalLoading(true);
    triggerPageLoadProgress();
    const timer = setTimeout(() => {
      setIsInternalLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, initialCategory, initialQuery, initialBrand]);

  // Reset page when filters change (must be before early return)
  useEffect(() => { setPage(0); }, [selectedCategory, searchQuery, selectedBrand, onlyDeals, onlyPrime, minRating, sortBy]);

  const isLoading = externalIsLoading || isInternalLoading;

  if (isLoading) {
    return <ProductCatalogSkeleton />;
  }

  // Collect all descendant category IDs for cascade filtering
  const getCategoryIds = (catId: string): string[] => {
    const ids = [catId];
    categories.filter(c => c.parentId === catId).forEach(child => {
      ids.push(...getCategoryIds(child.id));
    });
    return ids;
  };
  const selectedCategoryIds = selectedCategory !== 'all' ? getCategoryIds(selectedCategory) : null;
  const selectedCategoryName = selectedCategory !== 'all'
    ? categories.find(c => c.id === selectedCategory)?.name || ''
    : '';

  // Distinct brands from loaded products (sorted by name)
  const availableBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));

  // Filter Logic
  let filtered = products.filter((p) => {
    if (selectedCategoryIds) {
      // Primary: category_id membership (including descendants)
      const byCategory = p.categoryId && selectedCategoryIds.includes(p.categoryId);
      // Fallback: word-level best_for / brand / name matching against the category name
      const nameWords = selectedCategoryName.toLowerCase().split(/[^a-z0-9+]+/).filter(w => w.length > 1);
      const haystack = `${p.bestFor || ''} ${p.brand || ''} ${p.title || ''}`.toLowerCase();
      const byBestFor = nameWords.length > 0 && nameWords.some(w => haystack.includes(w));
      if (!byCategory && !byBestFor) return false;
    }
    if (selectedBrand && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim() && !p.title.toLowerCase().includes(searchQuery.toLowerCase()) && !p.brand.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (onlyDeals && !p.isDeal) return false;
    if (onlyPrime && !p.isPrime) return false;
    if (minRating > 0 && (p.rating || 0) < minRating) return false;
    return true;
  });

  // Sort Logic
  filtered.sort((a, b) => {
    if (sortBy === 'price_asc') return (a.currentPrice || 0) - (b.currentPrice || 0);
    if (sortBy === 'price_desc') return (b.currentPrice || 0) - (a.currentPrice || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return b.editorScore - a.editorScore; // default score
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const goToPage = (p: number) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <DisclosureBanner />

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#EAF2FF] via-white to-[#FFF3E6] text-slate-900 py-12 md:py-14 px-4 border-b border-[#E2E8F0] shadow-[0_10px_40px_-20px_rgba(36,107,255,0.25)]">
        <TechnicalGrid opacity={0.04} />
        <AmbientGlow color="blue" position="top-right" size="lg" />
        <AmbientGlow color="blue" position="bottom-left" size="lg" />
        <div className="relative z-10 max-w-7xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#111827] via-[#246BFF] to-[#4F7CFF]">
            {selectedCategory === 'all' ? 'All Products & Amazon Discovery' : `${categories.find(c => c.id === selectedCategory)?.name || ''} Products`}
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl font-medium">
            Browse independently bench-marked products, verified Amazon buyer ratings, and current price drops.
          </p>
          {/* Deals countdown strip — matches homepage Hot Deals module */}
          {filtered.some(p => p.isDeal || p.discountPercentage || (Number(p.referencePrice) > Number(p.currentPrice))) && (
            <div className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-white/80 border border-[#FF8A00]/30 px-4 py-2 shadow-sm backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF334F] opacity-70" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF334F]" />
              </span>
              <span className="text-[12px] font-bold text-slate-700">
                <span className="text-[#FF334F]">{filtered.filter(p => p.isDeal || p.discountPercentage || (Number(p.referencePrice) > Number(p.currentPrice))).length}</span> active deals — prices checked daily from Amazon
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Filters Sidebar */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-24 lg:self-start max-h-[calc(100vh-120px)] overflow-y-auto pb-2">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Filter Products
            </h3>

            {/* Keyword Search */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Search Keywords</label>
              <input
                type="text"
                placeholder="Title, brand, feature..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1.5">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-700 cursor-pointer font-bold"
              >
                <option value="all">All Categories</option>
                {categories.filter(c => !c.parentId).map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    <option value={c.id}>{c.name}</option>
                    {categories.filter(child => child.parentId === c.id).map(child => (
                      <option key={child.id} value={child.id}>— {child.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Brand Select */}
            {availableBrands.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5">Brand</label>
                <input
                  type="text"
                  placeholder="Search brands..."
                  defaultValue=""
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (!v) { setSelectedBrand(''); return; }
                    const match = availableBrands.find((b) => b.toLowerCase() === v.toLowerCase()) || availableBrands.find((b) => b.toLowerCase().includes(v.toLowerCase()));
                    setSelectedBrand(match || v);
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-700"
                />
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full mt-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-700 cursor-pointer font-bold"
                >
                  <option value="">All Brands</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Checkboxes */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyDeals}
                  onChange={(e) => setOnlyDeals(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                <span className="text-orange-600 dark:text-orange-400">🔥 Show Amazon Deals Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyPrime}
                  onChange={(e) => setOnlyPrime(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-sky-500"
                />
                <span>Amazon Prime Eligible</span>
              </label>
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setSelectedBrand('');
                setOnlyDeals(false);
                setOnlyPrime(false);
                setMinRating(0);
              }}
              className="w-full text-center text-xs font-bold text-red-600 dark:text-red-400 hover:underline pt-2"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Right Col: Catalog Items Grid */}
        <div className="lg:col-span-9 space-y-6">
          {/* Controls Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-500">
              Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> Products
            </span>

            <div className="flex items-center gap-4">
              {/* Sort dropdown */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <option value="score">Editor's Score</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rating</option>
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-400'}`}
                  title="Grid View"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 002-2h2a2 2 0 002 2v2a2 2 0 002-2h-2a2 2 0 00-2-2V5zM11 13a2 2 0 002-2h2a2 2 0 002 2v2a2 2 0 002-2h-2a2 2 0 00-2-2v-2z" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-400'}`}
                  title="List View"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Grid / List Display */}
          {paginated.length === 0 ? (
            <NoResultsEmptyState
              query={searchQuery}
              category={selectedCategory !== 'all' ? (categories.find(c => c.id === selectedCategory)?.name || selectedCategory) : undefined}
              onReset={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setSelectedBrand('');
                setOnlyDeals(false);
                setOnlyPrime(false);
                setMinRating(0);
              }}
              onNavigatePopular={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setSortBy('rating');
              }}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode="grid"
                  onSelectCompare={handleToggleCompare}
                  isComparing={selectedCompareIds.includes(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  viewMode="list"
                  onSelectCompare={handleToggleCompare}
                  isComparing={selectedCompareIds.includes(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-4 pb-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const startPage = Math.max(0, Math.min(page - 4, totalPages - 10));
            const p = startPage + i;
            if (p >= totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                  p === page ? 'bg-[#246BFF] text-white shadow' : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {p + 1}
              </button>
            );
          })}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Side-by-Side Split-Screen Comparison Modal */}
      {isCompareModalOpen && selectedCompareIds.length === 2 && (() => {
        const pA = products.find((p) => p.id === selectedCompareIds[0]);
        const pB = products.find((p) => p.id === selectedCompareIds[1]);
        if (!pA || !pB) return null;
        return (
          <SideBySideComparisonModal
            productA={pA}
            productB={pB}
            onClose={() => {
              setIsCompareModalOpen(false);
              setSelectedCompareIds([]);
            }}
          />
        );
      })()}
    </div>
  );
};
