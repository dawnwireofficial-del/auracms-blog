import { useState, useEffect, useRef } from 'react';
import Link from 'vike-react';
import { Sun, Moon, Menu, X, ChevronDown, ArrowRight, Search, Heart, History, ShoppingBag, DollarSign, TrendingUp, Award, BookOpen, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, SiteSettings } from '../types';
import MegaMenu from './affiliate/MegaMenu';
import AiIndicator from './AiIndicator';
import SearchPulse from './motion/SearchPulse';
import NeuralOrb from './motion/NeuralOrb';
import { proxyImageUrl } from '../utils/safeRender';

interface HeaderProps {
  scrolled: boolean;
  isHome: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onNavigate: (route: string, param?: string) => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  settings: SiteSettings | null;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

interface SearchSuggestion {
  id: string;
  name: string;
  image?: string;
  price?: string;
  rating?: number;
  slug?: string;
}

export default function Header({
  scrolled, isHome, darkMode, toggleDarkMode, onNavigate, currentUser, onOpenLogin, settings, mobileMenuOpen, setMobileMenuOpen,
}: HeaderProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handleScroll = () => {
      const header = headerRef.current;
      if (!header) return;
      const scrollY = window.scrollY;
      if (scrollY >= 250) header.classList.add('is-sticky');
      else header.classList.remove('is-sticky');
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.nav-dropdown-trigger')) setActiveDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Load categories for mega menu
  useEffect(() => {
    fetch('/api/public/categories').then(r => r.json()).then(data => setCategories(data || [])).catch(() => {});
  }, []);

  // Search debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/public/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        const data = await r.json();
        setSearchSuggestions(data.products || []);
        setShowSearchSuggestions(true);
      } catch {}
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery]);

  const headerClass = scrolled || !isHome
    ? 'bg-dw-header/95 backdrop-blur-md shadow-sm border-b border-dw-border/30'
    : 'bg-transparent';

  const textClass = scrolled || !isHome
    ? 'text-dw-text-muted hover:text-dw-text hover:bg-white/5'
    : 'text-white/90 hover:text-white hover:bg-white/10';

  const logoFilter = scrolled || !isHome ? '' : 'brightness(0) invert(1)';

  const navLinks = [
    { label: 'Products', route: 'products', icon: ShoppingBag },
    { label: 'Deals', route: 'deals', icon: DollarSign, highlight: true },
    { label: 'Best Sellers', route: 'best', icon: Award },
    { label: 'Buying Guides', route: 'buying-guides', icon: BookOpen },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('search', searchQuery.trim());
      setShowSearchSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSearchSuggestions(false);
    setSearchQuery('');
    onNavigate('product', suggestion.slug || suggestion.id);
  };

  // Build mega menu categories
  const topLevelCats = categories.filter((c: any) => !c.parentId && c.status === 'active');
  const megaCategories = topLevelCats.map((cat: any) => ({
    ...cat,
    children: categories.filter((c: any) => c.parentId === cat.id && c.status === 'active'),
  }));

  return (
    <div ref={headerRef} className={`header-sticky ${headerClass} transition-all duration-300 z-50`}>
      <div className="Container">
        {/* Top bar: logo + search + actions */}
        <div className="flex items-center justify-between h-14 lg:h-16 gap-4">
          {/* Logo */}
          <div onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }} className="flex items-center gap-3 cursor-pointer shrink-0">
            <img
              src={proxyImageUrl('/logo-transparent.png')}
              alt={settings?.siteName || 'DawnWire'}
              width={140} height={36}
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              className="h-8 lg:h-9 w-auto object-contain"
              style={{ filter: logoFilter }}
            />
          </div>

          {/* Search bar - desktop (Futuristic AI Search) */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-3xl relative">
            <SearchPulse state={searchQuery.length > 0 ? 'typing' : 'idle'} className="w-full">
            <form onSubmit={handleSearch} className="relative flex w-full h-12 bg-dw-card/90 backdrop-blur-md rounded-full border border-dw-border-soft items-center pl-2 pr-1 shadow-inner">
              
              <div className="flex-shrink-0 px-2">
                <NeuralOrb size="compact" state={searchQuery.length > 2 ? 'processing' : 'idle'} />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="text-xs bg-transparent border-r border-dw-border-soft/50 px-2 py-1 text-dw-text-muted focus:outline-none cursor-pointer appearance-none font-medium max-w-[100px] truncate"
              >
                <option value="">All Categories</option>
                {topLevelCats.slice(0, 10).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchSuggestions.length > 0 && setShowSearchSuggestions(true)}
                placeholder="Ask AI or search products, brands..."
                className="flex-1 text-sm bg-transparent px-4 py-2 text-dw-text placeholder:text-dw-text-muted focus:outline-none"
              />
              <button type="button" className="p-2 text-cyan hover:text-primary transition-colors mr-1" title="Natural Language Search">
                <Sparkles className="h-4 w-4" />
              </button>
              <button type="submit" className="bg-primary hover:bg-primary2 text-white h-10 w-10 flex items-center justify-center rounded-full transition-all shadow-[0_0_15px_rgba(8,102,255,0.4)]">
                <Search className="h-4 w-4" />
              </button>
            </form>
            </SearchPulse>

            {/* Search suggestions dropdown */}
            {showSearchSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-dw-card border border-dw-border-soft rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-2 max-h-80 overflow-y-auto">
                  {searchSuggestions.map(item => (
                    <button key={item.id} onClick={() => handleSuggestionClick(item)} className="flex items-center gap-3 w-full p-2 hover:bg-white/5 rounded-lg transition-colors text-left">
                      {item.image && <img src={proxyImageUrl(item.image)} alt="" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} className="w-10 h-10 object-contain rounded-lg bg-dw-section" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-dw-text truncate">{item.name}</p>
                        {item.price && <p className="text-[11px] text-primary font-bold">${parseFloat(item.price).toFixed(2)}</p>}
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={handleSearch} className="w-full p-2 text-[11px] font-semibold text-primary hover:bg-white/5 border-t border-dw-border-soft/50">
                  See all results for "{searchQuery}" →
                </button>
              </div>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Navigation links */}
            {navLinks.map(link => (
              <button key={link.label} onClick={() => onNavigate(link.route, (link as any).params)} className={`text-[11px] font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                link.highlight ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : textClass
              }`}>
                {link.label}
              </button>
            ))}

            {/* Wishlist */}
            <button onClick={() => onNavigate('wishlist')} className={`p-2 rounded-lg transition-colors ${textClass}`} title="Wishlist">
              <Heart className="h-4 w-4" />
            </button>

            {/* Recently viewed */}
            <button onClick={() => onNavigate('recently-viewed')} className={`p-2 rounded-lg transition-colors ${textClass}`} title="Recently Viewed">
              <History className="h-4 w-4" />
            </button>

            <div className="w-px h-5 bg-slate-200 dark:bg-zinc-700 mx-1" />

            <button onClick={toggleDarkMode} className={`p-2 rounded-lg transition-colors ${textClass}`} aria-label="Toggle dark mode">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2 ml-1">
                {currentUser.role !== 'subscriber' && (
                  <button onClick={() => onNavigate('admin')} className="primary-btn !py-1.5 !px-4 !text-[10px]">
                    Console
                  </button>
                )}
                <img src={proxyImageUrl(currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100')} alt="" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} width={30} height={30} className="h-7 w-7 rounded-full object-cover border-2 border-gray-200 dark:border-zinc-600" />
              </div>
            ) : (
              <button onClick={onOpenLogin} className={`text-[10px] font-bold tracking-wider px-4 py-2 rounded-lg transition-all ${
                scrolled || !isHome
                  ? 'text-dw-text-muted hover:text-dw-text hover:bg-white/5'
                  : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20'
              }`}>
                Sign In
              </button>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex lg:hidden items-center gap-1">
            {/* Mobile search icon */}
            <button onClick={() => onNavigate('search')} className={`p-2 rounded-lg ${textClass}`}>
              <Search className="h-4 w-4" />
            </button>
            <button onClick={toggleDarkMode} className={`p-2 rounded-lg ${textClass}`}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 rounded-lg ${textClass}`}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Bottom bar: category navigation + deals links - desktop */}
        <div className="hidden lg:flex items-center border-t border-dw-border-soft/30 py-1 gap-1">
          {/* Shop by Category */}
          <div className="relative nav-dropdown-trigger" onMouseEnter={() => setMegaMenuOpen(true)} onMouseLeave={() => setMegaMenuOpen(false)}>
            <button className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${textClass}`}>
              <ShoppingBag className="h-3.5 w-3.5" />
              Shop by Category
              <ChevronDown className={`h-3 w-3 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {megaMenuOpen && (
              <MegaMenu categories={megaCategories} onClose={() => setMegaMenuOpen(false)} onNavigate={onNavigate} />
            )}
          </div>

          {/* Top categories as quick links */}
          {topLevelCats.slice(0, 6).map((cat: any) => (
            <button key={cat.id} onClick={() => onNavigate('category', cat.slug)} className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${textClass}`}>
              {cat.name}
            </button>
          ))}

          <div className="flex-1" />

          {/* Trending */}
          <button onClick={() => onNavigate('products', '?isTrending=true')} className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${textClass}`}>
            <TrendingUp className="h-3 w-3" />
            Trending
          </button>

          {/* Deals badge */}
          <button onClick={() => onNavigate('deals')} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
            <DollarSign className="h-3 w-3" />
            Today's Deals
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden bg-white dark:bg-[#041424] border-t border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="Container py-4 flex flex-col gap-1">
              {/* Mobile search */}
              <form onSubmit={handleSearch} className="flex mb-3">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products..." className="flex-1 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-l-lg px-4 py-2.5 text-slate-700 dark:text-zinc-200 placeholder:text-slate-400 focus:outline-none" />
                <button type="submit" className="bg-brand-secondary hover:bg-brand-accent transition-colors text-white px-4 py-2.5 rounded-r-lg"><Search className="h-4 w-4" /></button>
              </form>

              {/* Deal links */}
              <div className="flex gap-2 mb-2">
                <button onClick={() => { onNavigate('deals'); setMobileMenuOpen(false); }} className="flex items-center gap-1 flex-1 text-center justify-center bg-red-500 text-white text-[11px] font-bold px-3 py-2 rounded-lg">
                  <DollarSign className="h-3.5 w-3.5" /> Today's Deals
                </button>
                <button onClick={() => { onNavigate('products', '?sort=popularity'); setMobileMenuOpen(false); }} className="flex items-center gap-1 flex-1 text-center justify-center bg-amber-500 text-white text-[11px] font-bold px-3 py-2 rounded-lg">
                  <Award className="h-3.5 w-3.5" /> Best Sellers
                </button>
              </div>

              {/* Categories */}
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 mt-2 mb-1">Categories</p>
              {topLevelCats.map((cat: any) => (
                <button key={cat.id} onClick={() => { onNavigate('category', cat.slug); setMobileMenuOpen(false); }} className="text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg">
                  {cat.name}
                </button>
              ))}

              <div className="border-t border-gray-100 dark:border-zinc-800 mt-2 pt-3">
                <button onClick={() => { onNavigate('wishlist'); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg">
                  <Heart className="h-4 w-4" /> Wishlist
                </button>
                <button onClick={() => { onNavigate('buying-guides'); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg">
                  <BookOpen className="h-4 w-4" /> Buying Guides
                </button>
              </div>

              <div className="border-t border-gray-100 dark:border-zinc-800 mt-3 pt-4 flex flex-col gap-2 px-4">
                {currentUser ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">{currentUser.name}</span>
                    {currentUser.role !== 'subscriber' && (
                      <button onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }} className="primary-btn !py-1.5 !px-4 !text-[10px]">Console</button>
                    )}
                  </div>
                ) : (
                  <>
                    <button onClick={() => { onOpenLogin(); setMobileMenuOpen(false); }} className="w-full bg-primary text-white text-sm font-bold px-5 py-3 rounded-lg shadow-md">Sign In</button>
                    <button onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }} className="w-full text-sm font-semibold text-gray-600 dark:text-zinc-400 px-5 py-3 rounded-lg border border-gray-200 dark:border-zinc-700">Browse as Guest</button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
