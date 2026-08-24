import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { AnimatedCategoryIcon } from '../common/AnimatedCategoryIcon';
import { useAppStore } from '../../lib/store';
import { navigate } from '../../lib/navigation';
import { logActivityEvent } from '../../lib/activityTracker';
import { proxyImageUrl } from '../../utils/safeRender';

const NotificationBell = lazy(() => import('../notifications/NotificationBell').then(m => ({ default: m.NotificationBell })));

interface HeaderProps {
  onOpenAiFinder?: () => void;
  onOpenChatbot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAiFinder, onOpenChatbot }) => {
  const { categories = [], products = [], wishlist = [], currentUser } = useAppStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSearchCat, setSelectedSearchCat] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dawnwire_recent_searches');
      return saved ? JSON.parse(saved) : ['Sony WH-1000XM5', 'Smart Home Hub', 'Logitech MX Master 3S', 'OLED Monitor'];
    } catch {
      return ['Sony WH-1000XM5', 'Smart Home Hub', 'Logitech MX Master 3S', 'OLED Monitor'];
    }
  });

  const addRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 6);
      try {
        localStorage.setItem('dawnwire_recent_searches', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save recent searches', err);
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('dawnwire_recent_searches');
    } catch (err) {
      console.error('Failed to clear recent searches', err);
    }
  };
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeMegaCat, setActiveMegaCat] = useState(categories[0]?.id || 'cat-electronics');
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );
  const [isHighContrast, setIsHighContrast] = useState(
    document.documentElement.classList.contains('high-contrast')
  );

  // Fetch products for active mega menu category
  useEffect(() => {
    if (!activeMegaCat || !isMegaMenuOpen) return;
    const cat = categories.find(c => c.id === activeMegaCat);
    if (!cat) return;
    fetch(`/api/public/product-reviews?categorySlug=${encodeURIComponent(cat.slug)}&limit=6&sort=rating`)
      .then(r => r.json())
      .then(data => {
        const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setCategoryProducts(items.slice(0, 6));
      })
      .catch(() => setCategoryProducts([]));
  }, [activeMegaCat, isMegaMenuOpen, categories]);

  // Click outside to close search live dropdown overlay
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener for Cmd+K (Focus search) and Escape (Close menus/blur)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          setIsSearchFocused(true);
        } else {
          setIsMobileMenuOpen(true);
        }
      }
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
        setIsMobileMenuOpen(false);
        setIsMegaMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const syncClasses = () => {
      const root = document.documentElement;
      setIsDarkMode(root.classList.contains('dark'));
      setIsHighContrast(root.classList.contains('high-contrast'));
    };

    // Initial check from localStorage / system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }

    const savedHC = localStorage.getItem('highContrast');
    if (savedHC === 'true') {
      document.documentElement.classList.add('high-contrast');
    } else if (savedHC === 'false') {
      document.documentElement.classList.remove('high-contrast');
    }

    syncClasses();

    // Observe document.documentElement class attribute changes to sync state automatically
    const observer = new MutationObserver(() => {
      syncClasses();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const toggleHighContrast = () => {
    const root = document.documentElement;
    if (root.classList.contains('high-contrast')) {
      root.classList.remove('high-contrast');
      localStorage.setItem('highContrast', 'false');
    } else {
      root.classList.add('high-contrast');
      localStorage.setItem('highContrast', 'true');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
      logActivityEvent({
        type: 'PRODUCT_SEARCH',
        details: `Searched for "${searchQuery}" in category "${selectedSearchCat}"`,
        userEmail: currentUser?.email || 'guest@dawnwire.com'
      });
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&cat=${selectedSearchCat}`);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const searchMatchesProducts = normalizedQuery
    ? products.filter((p) => {
        const matchCat = selectedSearchCat === 'all' || p.mainCategory.toLowerCase().includes(selectedSearchCat.toLowerCase());
        const matchText =
          p.title.toLowerCase().includes(normalizedQuery) ||
          p.brand.toLowerCase().includes(normalizedQuery) ||
          p.mainCategory.toLowerCase().includes(normalizedQuery) ||
          (p.mainFeatures && p.mainFeatures.some((f) => f.toLowerCase().includes(normalizedQuery)));
        return matchCat && matchText;
      }).slice(0, 5)
    : [];

  const searchMatchesCategories = normalizedQuery
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(normalizedQuery) ||
          (c.description && c.description.toLowerCase().includes(normalizedQuery)) ||
          c.slug.toLowerCase().includes(normalizedQuery)
      ).slice(0, 3)
    : [];

  const currentMegaCategory = categories.find((c) => c.id === activeMegaCat) || categories[0] || null;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-xs shadow-slate-900/5 transition-all duration-300">
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-slate-300 text-[10px] font-medium py-0.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-300 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span>Independent Reviews</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-300">Live Price Tracking</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-300">Expert Buying Guides</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[10px]">
            <a href="/affiliate-disclosure" className="hover:text-white transition-colors">Affiliate Disclosure</a>
            <span className="text-slate-600">•</span>
            <a href="/about" className="hover:text-white transition-colors">How We Review</a>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <a href="/contact" className="hidden sm:inline hover:text-white transition-colors">Help Center</a>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
        {/* Search Bar with Category Selector & Live Search Autocomplete */}
        <div ref={searchWrapperRef} className="hidden lg:block relative flex-1 max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-slate-50 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-all">
            <select
              value={selectedSearchCat}
              onChange={(e) => setSelectedSearchCat(e.target.value)}
              aria-label="Search category"
              className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 px-3.5 py-2.5 outline-none border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search Amazon products, reviews, deals, or guides..."
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold px-2 py-1"
                title="Clear search query"
              >
                ✕
              </button>
            )}
            <kbd className="hidden xl:inline-block bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 shrink-0 mr-1.5 shadow-xs" title="Shortcut: Cmd+K or Ctrl+K">
              ⌘K
            </kbd>
            <button type="submit" className="bg-[#246BFF] hover:bg-[#164EE8] text-white px-4 py-2 flex items-center gap-1 transition-colors font-bold text-xs shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
            </button>
          </form>

          {/* Live Search Autocomplete Overlay & Recent Searches */}
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-3 z-50 max-h-[440px] overflow-y-auto space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* If search query is empty, show Recent Searches & Trending Topics */}
              {normalizedQuery.length === 0 ? (
                <div className="space-y-4">
                  {/* Recent Searches Header & Chips */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#9CA3AF] px-1 mb-2 tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Recent Searches</span>
                      </div>
                      {recentSearches.length > 0 && (
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-[#9CA3AF] hover:text-red-500 transition-colors font-bold text-[10px]"
                        >
                          Clear History
                        </button>
                      )}
                    </div>

                    {recentSearches.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] px-1 py-1 italic">No recent search history.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((term, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSearchQuery(term);
                              addRecentSearch(term);
                              navigate(`/search?q=${encodeURIComponent(term)}&cat=${selectedSearchCat}`);
                              setIsSearchFocused(false);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#FAF8F5] dark:bg-[#252538] dark:hover:bg-[#252538] text-[#1A1A2E] dark:text-[#C8C4BC] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#E5E1DC]/60 dark:border-[#444460]/60 group"
                          >
                            <span className="text-[#9CA3AF] group-hover:text-blue-500">🔍</span>
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Popular Suggested Searches */}
                  <div className="pt-2 border-t border-[#E5E1DC] dark:border-[#333348]">
                    <div className="text-[10px] font-black uppercase text-[#9CA3AF] px-1 mb-2 tracking-wider flex items-center gap-1.5">
                      <span>🔥 Trending Categories & Reviews</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Wireless Headphones', 'Smart Home Hubs', '4K OLED TVs', 'Mechanical Keyboards', 'Ergonomic Chairs'].map((topic, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchQuery(topic);
                            addRecentSearch(topic);
                            navigate(`/search?q=${encodeURIComponent(topic)}&cat=all`);
                            setIsSearchFocused(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-bold border border-amber-500/20 transition-all"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* When search query is entered */
                <>
                  {/* Category Results */}
                  {searchMatchesCategories.length > 0 && (
                    <div>
                      <div className="text-[10px] font-black uppercase text-[#9CA3AF] px-2 mb-1.5 tracking-wider">
                        Matching Categories
                      </div>
                      <div className="space-y-1">
                        {searchMatchesCategories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setIsSearchFocused(false);
                              navigate(`/categories/${c.slug}`);
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-[#252538]/80 flex items-center justify-between text-xs transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-[10px]">📁</span>
                              <span className="font-bold text-[#1A1A2E] dark:text-[#F0EDE8] group-hover:text-blue-600 dark:group-hover:text-blue-400">{c.name}</span>
                            </div>
                            <span className="text-[10px] text-[#9CA3AF] font-medium">Browse Category →</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Matches */}
                  <div>
                    <div className="text-[10px] font-black uppercase text-[#9CA3AF] px-2 mb-1.5 tracking-wider flex items-center justify-between">
                      <span>Product Matches</span>
                      {searchMatchesProducts.length > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{searchMatchesProducts.length} Results</span>
                      )}
                    </div>

                    {searchMatchesProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#6B7280]">
                        No direct product matches found for "{searchQuery}".
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {searchMatchesProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setIsSearchFocused(false);
                              navigate(`/products/${p.slug}`);
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#FAF8F5] dark:hover:bg-[#252538]/80 flex items-center justify-between gap-3 text-xs transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={proxyImageUrl(p.images?.[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                                alt={p.title}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 object-contain rounded-lg bg-white dark:bg-[#252538] p-1 border border-[#E5E1DC] dark:border-[#444460] shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-[#1A1A2E] dark:text-[#F0EDE8] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {p.title}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
                                  <span>{p.brand}</span>
                                  <span>•</span>
                                  <span className="text-amber-500 font-bold">★ {p.rating}</span>
                                  {p.isDeal && (
                                    <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold px-1.5 rounded">
                                      DEAL
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                                ${p.currentPrice}
                              </div>
                              <span className="text-[10px] font-extrabold text-[#9CA3AF]">
                                Score: {p.editorScore}/100
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* View All Results Button */}
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>View all search results for "{searchQuery}"</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

{/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Product Finder Button */}
          {onOpenAiFinder && (
            <button
              onClick={onOpenAiFinder}
              className="hw-glass-btn hw-glass-cta px-3 py-1.5 hidden sm:inline-flex"
            >
              <span className="whitespace-nowrap flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Product Finder
              </span>
            </button>
          )}

{/* AI Chatbot Assistant */}
          {onOpenChatbot && (
            <button
              onClick={onOpenChatbot}
              className="hw-glass-btn hw-glass-cta px-3 py-1.5"
            >
              <span className="whitespace-nowrap flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="hidden md:inline">Ask Dawnwire AI</span>
              </span>
            </button>
          )}

          {/* Notifications */}
          <Suspense fallback={null}>
            <NotificationBell currentUser={currentUser} isDarkMode={isDarkMode} />
          </Suspense>

          {/* Wishlist */}
          <a href="/wishlist" aria-label="Wishlist" className="relative hw-glass-icon">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
              </span>
            )}
          </a>

          {/* Compare */}
          <a href="/compare" aria-label="Compare products" title="Compare products"
            className="relative hw-glass-icon hidden sm:inline-flex">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13V7m0 6a4 4 0 004-4h6m-2-2l2 2-2 2M16 11v6m0 0a4 4 0 01-4 4H6m2-2l-2-2 2-2" />
            </svg>
          </a>

          {/* Account */}
          <a
            href={currentUser ? '/account' : '/login'}
            className="hw-glass-btn px-3 py-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="hidden sm:inline">{currentUser ? 'Account' : 'Sign In'}</span>
          </a>

          {/* High Contrast Accessibility Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`hw-glass-btn px-3 py-2 hidden sm:inline-flex ${
              isHighContrast ? 'ring-2 ring-[#1A1A2E] dark:ring-white !border-[#9CA3AF]' : ''
            }`}
            title={isHighContrast ? "Disable High Contrast" : "Enable High Contrast"}
            aria-label="Toggle High Contrast mode"
          >
            <span className="text-sm leading-none">👁️</span>
            <span className="hidden xl:inline">{isHighContrast ? 'Contrast ON' : 'High Contrast'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="hw-glass-icon"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <svg className="w-[18px] h-[18px] text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-[18px] h-[18px] text-[#374151]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden hw-glass-icon"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Links Bar + Mega Menu Trigger */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Shop by Category Mega Menu Button */}
            <div
              className="relative"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <button
                className="hw-glass-btn px-3 py-1.5 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Shop by Category</span>
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isMegaMenuOpen && (
                <div className="absolute top-full left-0 w-[900px] max-h-[78vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl rounded-b-2xl rounded-tr-2xl overflow-hidden grid grid-cols-12 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Category Sidebar List — scrollable so every category is reachable */}
                  <div className="col-span-4 bg-slate-50 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-800 py-3 max-h-[78vh] overflow-y-auto overscroll-contain hw-mega-scroll">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onMouseEnter={() => setActiveMegaCat(cat.id)}
                        onClick={() => {
                          setIsMegaMenuOpen(false);
                          navigate(`/categories/${cat.slug}`);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold text-left transition-colors ${
                          activeMegaCat === cat.id ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <AnimatedCategoryIcon
                            slug={cat.slug}
                            icon={cat.icon || 'tag'}
                            image={cat.image}
                            animationStyle={cat.animationStyle}
                            className="w-5 h-5 text-blue-500"
                            imgClassName="w-10 h-10 drop-shadow-md shrink-0"
                          />
                          <span className="text-[13px]">{cat.name}</span>
                        </div>
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* Category Detail Panel */}
                  {currentMegaCategory && <div className="col-span-8 p-6 max-h-[78vh] overflow-y-auto overscroll-contain hw-mega-scroll">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {currentMegaCategory.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {currentMegaCategory.description}
                        </p>
                      </div>
                      <a
                        href={`/categories/${currentMegaCategory.slug}`}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>View All Products</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>

                    {/* Subcategories Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {categories.filter(c => c.parentId === currentMegaCategory.id && c.status !== 'inactive').map((sub) => (
                        <a
                          key={sub.id}
                          href={`/categories/${currentMegaCategory.slug}/${sub.slug}`}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50/60 dark:hover:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700 transition-all group"
                        >
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {sub.name}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {sub.description}
                          </div>
                        </a>
                      ))}
                    </div>

                    {/* Popular Products in this category */}
                    {categoryProducts.length > 0 && (
                      <div className="mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Popular Products</span>
                        <div className="grid grid-cols-3 gap-2">
                          {categoryProducts.map((p: any) => (
                            <a
                              key={p.id}
                              href={`/products/${p.slug}`}
                              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 transition-all group"
                            >
                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                {p.product_image || p.productImage ? (
                                  <img src={proxyImageUrl(p.product_image || p.productImage)} alt={p.product_name || p.productName} referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                  <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.product_name || p.productName}</p>
                                <span className="text-[9px] text-slate-400">
                                  {p.price ? `$${parseFloat(p.price).toFixed(2)}` : ''}
                                </span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Category Deals Promo */}
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border border-orange-200/80 dark:border-orange-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-orange-600 text-white rounded-lg">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </span>
                        <div>
                          <span className="text-xs font-bold text-orange-900 dark:text-orange-200">Featured {currentMegaCategory.name} Deals</span>
                          <p className="text-[10px] text-orange-700 dark:text-orange-300">Synchronized directly with Amazon price drops</p>
                        </div>
                      </div>
                      <a href="/deals" className="text-xs font-black text-orange-600 dark:text-orange-400 hover:underline">
                        See Deals &rarr;
                      </a>
                    </div>
                  </div>}
                </div>
              )}
            </div>

            {/* Direct Category & Feature Links */}
            <a href="/products" className="py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              All Products
            </a>
            <a href="/deals" className="py-1 text-orange-600 dark:text-orange-400 font-extrabold flex items-center gap-1 hover:text-orange-700">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Today's Deals</span>
            </a>
            <a href="/products?sort=rating" className="py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Best Products
            </a>
            <a href="/compare" className="py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Comparisons
            </a>
            <a href="/reviews" className="py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Expert Reviews
            </a>
            <a href="/guides" className="py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Buying Guides
            </a>
            <a href="/brands" className="py-1 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Brands
            </a>
            <a href="/deals" className="py-1 text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-700 transition-colors">
              Price Tracker
            </a>
          </div>

          </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#1C1C2E] border-b border-[#E5E1DC] dark:border-[#333348] p-4 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="space-y-2">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-[#FAF8F5] dark:bg-[#252538] rounded-xl overflow-hidden border border-[#E5E1DC] dark:border-[#333348]">
              <input
                type="text"
                placeholder="Search Amazon products, brands, or deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-[#1A1A2E] dark:text-[#F0EDE8] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-2 text-[#9CA3AF] text-xs font-bold"
                  title="Clear"
                >
                  ✕
                </button>
              )}
              <button type="submit" className="bg-blue-600 text-white px-4 py-2.5 text-xs font-bold shrink-0">Search</button>
            </form>

            {/* Mobile Instant Match Suggestions */}
            {normalizedQuery.length > 0 && (
              <div className="bg-[#FAF8F5] dark:bg-[#252538]/80 rounded-xl border border-[#E5E1DC] dark:border-[#444460] p-2.5 space-y-2 max-h-56 overflow-y-auto">
                <div className="text-[10px] font-black uppercase text-[#9CA3AF] tracking-wider">Instant Matches</div>
                {searchMatchesProducts.length === 0 ? (
                  <div className="text-xs text-[#6B7280] py-1">No products match "{searchQuery}"</div>
                ) : (
                  searchMatchesProducts.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate(`/products/${p.slug}`);
                      }}
                      className="w-full text-left p-2 rounded-lg bg-white dark:bg-[#1C1C2E] flex items-center justify-between text-xs gap-2 border border-[#E5E1DC]/60 dark:border-[#333348]"
                    >
                      <div className="truncate font-bold text-[#1A1A2E] dark:text-[#F0EDE8]">{p.title}</div>
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">${p.currentPrice}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm font-bold">
            <a href="/products" className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252538] text-[#1A1A2E] dark:text-[#F0EDE8]">All Products</a>
            <a href="/deals" className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">Today's Deals</a>
            <a href="/products?sort=rating" className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252538] text-[#1A1A2E] dark:text-[#F0EDE8]">Best Products</a>
            <a href="/compare" className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252538] text-[#1A1A2E] dark:text-[#F0EDE8]">Comparisons</a>
            <a href="/guides" className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252538] text-[#1A1A2E] dark:text-[#F0EDE8]">Buying Guides</a>
            <a href="/categories" className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252538] text-[#1A1A2E] dark:text-[#F0EDE8]">Categories</a>
          </div>

          <div className="pt-2 border-t border-[#E5E1DC] dark:border-[#333348] flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#6B7280]">
            <div className="flex items-center gap-3">
              <a href="/admin">Admin Dashboard</a>
              <a href="/about">About DawnWire</a>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleHighContrast}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  isHighContrast ? 'bg-black text-white border-white' : 'bg-[#FAF8F5] dark:bg-[#252538] text-[#1A1A2E] dark:text-[#C8C4BC] border-[#E5E1DC] dark:border-[#444460]'
                }`}
              >
                <span>👁️ {isHighContrast ? 'Contrast ON' : 'High Contrast'}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#252538] text-[#1A1A2E] dark:text-[#C8C4BC] border border-[#E5E1DC] dark:border-[#444460]"
              >
                <span>{isDarkMode ? '🌙 Night Mode' : '☀️ Day Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
