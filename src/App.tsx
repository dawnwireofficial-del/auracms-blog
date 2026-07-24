import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { HomePage } from './pages/HomePage';
import { ProductCatalogPage } from './pages/ProductCatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { DealsPage } from './pages/DealsPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ReviewsPage, BuyingGuidesPage } from './pages/EditorialPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ChatbotDrawer } from './components/ai/ChatbotDrawer';
import { AIProductFinderModal } from './components/ai/AIProductFinderModal';
import { Product } from './types';
import { useAppStore, store } from './lib/store';
import { ProductCard } from './components/common/ProductCard';
import { EmptyWishlistState } from './components/common/EmptyState';
import { PageProgressBar } from './components/common/PageProgressBar';
import { ToastContainer } from './components/common/ToastContainer';
import { setupGlobalLinkInterceptor, triggerPageLoadProgress } from './lib/navigation';

export function App() {
  const [pathname, setPathname] = useState(window.location.pathname);
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  
  // Modals state
  const [isAiFinderOpen, setIsAiFinderOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatbotContextProduct, setChatbotContextProduct] = useState<Product | undefined>(undefined);

  const { wishlist = [], products = [], currentUser } = useAppStore();

  useEffect(() => {
    store.fetchProducts();
    store.fetchCategories();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAiFinderOpen(false);
        setIsChatbotOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('dawnwire_auth_token');
    if (token && !currentUser) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => {
          if (r.status === 401) localStorage.removeItem('dawnwire_auth_token');
          return r.ok ? r.json() : null;
        })
        .then(data => {
          if (data && data.email) {
            store.setUser({
              uid: data.id || 'usr-' + Date.now(),
              email: data.email,
              displayName: data.name || data.email.split('@')[0],
              role: data.role || 'user',
              createdAt: data.createdAt || new Date().toISOString(),
              wishlistProductIds: [],
            });
          }
        })
        .catch(() => localStorage.removeItem('dawnwire_auth_token'));
    }
  }, []);

  useEffect(() => {
    const cleanupInterceptor = setupGlobalLinkInterceptor();

    const handlePopState = () => {
      setPathname(window.location.pathname);
      setSearchParams(new URLSearchParams(window.location.search));
      triggerPageLoadProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);

    // System Preference listener using matchMedia('(prefers-color-scheme: dark)')
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      cleanupInterceptor();
      window.removeEventListener('popstate', handlePopState);
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  const openChatbotWithProduct = (product: Product) => {
    setChatbotContextProduct(product);
    setIsChatbotOpen(true);
  };

  const [loginEmailInput, setLoginEmailInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [loginMsg, setLoginMsg] = useState('');

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMsg('');
    const res = await store.loginWithEmailAndPassword(loginEmailInput, loginPasswordInput);
    if (!res.success) {
      setLoginMsg(res.error || 'Invalid credentials');
    }
  };

  // Simple Router Switch
  const renderRoute = () => {
    // Product Detail (/products/:slug)
    if (pathname.startsWith('/products/')) {
      const slug = pathname.replace('/products/', '');
      return <ProductDetailPage productSlug={slug} onOpenChatbotForProduct={openChatbotWithProduct} />;
    }

    // Categories (/categories or /categories/:slug)
    if (pathname.startsWith('/categories')) {
      const parts = pathname.split('/').filter(Boolean);
      const catSlug = parts[1] || 'all';
      return <ProductCatalogPage initialCategory={catSlug} />;
    }

    // Catalog (/products or /search)
    if (pathname === '/products' || pathname === '/search') {
      const q = searchParams.get('q') || '';
      const cat = searchParams.get('cat') || 'all';
      return <ProductCatalogPage initialCategory={cat} initialQuery={q} />;
    }

    // Today's Deals
    if (pathname === '/deals') {
      return <DealsPage />;
    }

    // Comparisons
    if (pathname.startsWith('/compare')) {
      return <ComparisonPage />;
    }

    // Reviews
    if (pathname.startsWith('/reviews')) {
      return <ReviewsPage />;
    }

    // Buying Guides
    if (pathname.startsWith('/guides')) {
      return <BuyingGuidesPage />;
    }

    // Wishlist
    if (pathname === '/wishlist') {
      const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
          <div className="max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">My Saved Wishlist ({wishlistedProducts.length})</h1>
            {wishlistedProducts.length === 0 ? (
              <EmptyWishlistState
                onBrowseProducts={() => {
                  window.history.pushState({}, '', '/products');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Admin Dashboard
    if (pathname.startsWith('/admin')) {
      return <AdminDashboardPage />;
    }

    // Account / Auth
    if (pathname === '/account' || pathname === '/login') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4 flex items-center justify-center">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
            <h2 className="text-2xl font-black">{currentUser ? 'User Account Profile' : 'Sign In to DawnWire'}</h2>
            {currentUser ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs space-y-1 text-left">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{currentUser.displayName}</div>
                  <div className="text-slate-500">{currentUser.email}</div>
                  <div className="font-bold text-amber-500 uppercase mt-2">Role: {currentUser.role}</div>
                </div>

                {(currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
                  <button
                    onClick={() => {
                      window.history.pushState({}, '', '/admin');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow"
                  >
                    Go to Admin Dashboard
                  </button>
                )}

                <button
                  onClick={() => store.logout()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {loginMsg && (
                  <div className="p-3 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl border border-red-200 dark:border-red-800">
                    {loginMsg}
                  </div>
                )}

                <form onSubmit={handleUserLogin} className="space-y-3 text-left">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={loginEmailInput}
                      onChange={(e) => setLoginEmailInput(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      value={loginPasswordInput}
                      onChange={(e) => setLoginPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 dark:text-white"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md"
                  >
                    Sign In with Email
                  </button>
                </form>

                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                  <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] font-extrabold uppercase text-slate-400">OR SOCIAL SIGN IN</span>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => store.loginWithGoogle()}
                    className="w-full bg-[#0A1F44] hover:bg-blue-900 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-md transition-all"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/></svg>
                    <span>Continue with Google</span>
                  </button>

                  <button
                    onClick={() => store.loginWithGithub()}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-md border border-slate-700 transition-all"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                    <span>Continue with GitHub</span>
                  </button>

                  <button
                    onClick={() => store.loginWithFacebook()}
                    className="w-full bg-[#1877F2] hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-md transition-all"
                  >
                    <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span>Continue with Facebook</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default Home
    return <HomePage onOpenAiFinder={() => setIsAiFinderOpen(true)} onOpenChatbot={() => setIsChatbotOpen(true)} />;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-orange-500 selection:text-white">
      <PageProgressBar />
      <Header
        onOpenAiFinder={() => setIsAiFinderOpen(true)}
        onOpenChatbot={() => {
          setChatbotContextProduct(undefined);
          setIsChatbotOpen(true);
        }}
      />

      <div className="flex-1 pb-16 md:pb-0">
        {renderRoute()}
      </div>

      <Footer />

      {/* Mobile Bottom Tab Navigation Bar */}
      <MobileBottomNav onOpenAiFinder={() => setIsAiFinderOpen(true)} />

      {/* Floating Interactive Chatbot Widget Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setChatbotContextProduct(undefined);
            setIsChatbotOpen(true);
          }}
          className="relative group bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-full shadow-2xl shadow-blue-600/50 border border-blue-400/40 flex items-center justify-center gap-2"
        >
          {/* Pulsing ring indicator */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white dark:border-slate-900"></span>
          </span>

          <svg className="w-6 h-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>

          <span className="hidden sm:inline font-black text-xs pr-1">Ask AI Assistant</span>
        </motion.button>
      </motion.div>

      {/* AI Assistant Drawer */}
      <ChatbotDrawer
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        initialContextProduct={chatbotContextProduct}
      />

      {/* AI Product Finder Quiz Modal */}
      <AIProductFinderModal
        isOpen={isAiFinderOpen}
        onClose={() => setIsAiFinderOpen(false)}
      />

      {/* Global Toast Notification System */}
      <ToastContainer />
    </div>
  );
}

export default App;
