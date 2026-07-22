import React, { useState, useEffect, useRef, Suspense } from 'react';
import { 
  Mail, Lock, User as UserIcon, X, 
  AlertTriangle, RefreshCw 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Head } from 'vike-react/Head';
import PublicPages from './components/PublicPages';
import AdminPanel from './components/AdminPanel';
import { Post, Category, Comment, AffiliateLink, Page, SiteSettings, User, TopicCluster, ContentUpgrade } from './types';
import AnalyticsScripts from './components/AnalyticsScripts';
import LoaderAnimation from './components/LoaderAnimation';
import ErrorBoundary from './components/ErrorBoundary';
import { resolveRouteFromPath } from './utils/routeResolver';

interface AppProps {
  initialData?: {
    posts: Post[];
    categories: Category[];
    settings: SiteSettings | null;
    pages: Page[];
    affiliateLinks: AffiliateLink[];
    productReviews?: any[];
  };
  initialRoute?: { name: string; param?: string };
  routeSpecific?: {
    post: Post | null;
    comments: Comment[];
    clusters: TopicCluster[];
    upgrades: ContentUpgrade[];
    prevArticle: Post | null;
    nextArticle: Post | null;
  };
}

export default function App({ initialData, routeSpecific, initialRoute }: AppProps) {
  // Navigation Routing State
  // Format: { name: 'home' | 'post' | 'posts-by-category' | 'page' | 'contact' | 'admin', param?: string }
  const [route, setRoute] = useState<{ name: string; param?: string }>(initialRoute || { name: 'home' });

  // Custom magnetic/trailing cursor states
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Update global CSS custom properties for hover spots and follow-lights
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isInteractive = target.closest('button, a, input, select, [role="button"], .cursor-pointer-trigger, img, h1, h2, h3, h4');
      setIsHovering(!!isInteractive);
    };

    const handleMouseDown = () => setClicked(true);
    const handleMouseUp = () => setClicked(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Auth States
  const [token, setToken] = useState<string | null>(typeof window !== 'undefined' ? localStorage.getItem('dawnwire_token') : null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Authentication Form Fields
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Core CMS State Data
  const [posts, setPosts] = useState<Post[]>(initialData?.posts || []);
  const [categories, setCategories] = useState<Category[]>(initialData?.categories || []);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>(initialData?.affiliateLinks || []);
  const [pages, setPages] = useState<Page[]>(initialData?.pages || []);
  const [settings, setSettings] = useState<SiteSettings | null>(initialData?.settings ?? null);
  const [dataLoading, setDataLoading] = useState(!initialData);

  // Track global state refresh triggers
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Simple client-side cache (store last fetch result)
  const dataCache = useRef<{ key: string; data: any; ts: number } | null>(null);

  // Handle browser navigation with clean URLs (no hash)
  useEffect(() => {
    const handlePop = () => {
      if (typeof window !== 'undefined') {
        setRoute(resolveRouteFromPath(window.location.pathname + window.location.search));
      }
    };

    window.addEventListener('popstate', handlePop);
    if (!initialRoute && typeof window !== 'undefined') {
      setRoute(resolveRouteFromPath(window.location.pathname + window.location.search));
    }

    return () => window.removeEventListener('popstate', handlePop);
  }, [initialRoute]);

  // Sync state route changes with URL bar (uses history.pushState, no hash)
  const navigateTo = (routeName: string, param?: string) => {
    let newPath = '/';
    if (routeName === 'post' && param) newPath = `/post/${param}`;
    else if (routeName === 'review' && param) newPath = `/products/${param}`;
    else if (routeName === 'product' && param) newPath = `/products/${param}`;
    else if (routeName === 'product') newPath = '/products';
    else if (routeName === 'categories') newPath = '/categories';
    else if (routeName === 'deals') newPath = '/deals';
    else if (routeName === 'wishlist') newPath = '/wishlist';
    else if (routeName === 'buying-guides') newPath = '/buying-guides';
    else if (routeName === 'recently-viewed') newPath = '/recently-viewed';
    else if (routeName === 'search') newPath = param ? `/search?q=${encodeURIComponent(param)}` : '/search';

    window.history.pushState({}, '', newPath);
    setRoute({ name: routeName, param });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Fetch current logged-in user profile
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setCurrentUser(null);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          setCurrentUser(profile);
        } else {
          // Token is invalid/expired
          localStorage.removeItem('dawnwire_token');
          setToken(null);
          setCurrentUser(null);
        }
      } catch (e) {
        console.error('Server offline or auth fetch failed');
      }
    };
    fetchMe();
  }, [token]);

  // 2. Fetch public database resources (cached, only re-fetches on token change or explicit refresh)
  useEffect(() => {
    if (initialData) return;

    const cacheKey = `public-data-${token || 'anon'}`;
    const cached = dataCache.current;

    if (cached && cached.key === cacheKey && Date.now() - cached.ts < 30000) {
      const d = cached.data;
      if (Array.isArray(d.posts)) setPosts(d.posts);
      if (Array.isArray(d.categories)) setCategories(d.categories);
      if (d.settings) setSettings(d.settings);
      if (Array.isArray(d.pages)) setPages(d.pages);
      if (Array.isArray(d.affiliateLinks)) setAffiliateLinks(d.affiliateLinks);
      setDataLoading(false);
      return;
    }

    const fetchPublicData = async () => {
      try {
        const [postsRes, catRes, settingsRes, pagesRes, affiliateRes] = await Promise.all([
          fetch('/api/public/posts').then(r => r.json()),
          fetch('/api/public/categories').then(r => r.json()),
          fetch('/api/public/settings').then(r => r.json()),
          fetch('/api/public/pages').then(r => r.json()),
          fetch('/api/public/affiliate').then(r => r.json())
        ]);

        const postsData = postsRes.data || postsRes;
        const data = { posts: postsData, categories: catRes, settings: settingsRes, pages: pagesRes, affiliateLinks: affiliateRes };
        dataCache.current = { key: cacheKey, data, ts: Date.now() };

        if (Array.isArray(postsData)) setPosts(postsData);
        if (Array.isArray(catRes)) setCategories(catRes);
        if (settingsRes && !settingsRes.error) setSettings(settingsRes);
        if (Array.isArray(pagesRes)) setPages(pagesRes);
        if (Array.isArray(affiliateRes)) setAffiliateLinks(affiliateRes);

      } catch (e) {
        console.error('Error fetching dynamic platform resources', e);
      } finally {
        setDataLoading(false);
      }
    };
    fetchPublicData();
  }, [token, refreshTrigger]);

  // Handle sign-in submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const url = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegistering 
      ? { name: authName, email: authEmail, password: authPassword }
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('dawnwire_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setShowLoginModal(false);
        setAuthName('');
        setAuthEmail('');
        setAuthPassword('');
        setRefreshTrigger(prev => prev + 1);

        // If newly signed-in as an author or administrator, auto-navigate to Console!
        if (data.user.role !== 'subscriber') {
          navigateTo('admin');
        }
      } else {
        setAuthError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setAuthError('Unable to connect to login authentication servers.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Helper: auto-fill evaluator account credentials (dev-only)
  const fillEvaluatorCredentials = (role: 'admin' | 'writer') => {
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isDev) return;
    if (role === 'admin') {
      setAuthEmail('admin@dawnwire.com');
      setAuthPassword('admin123');
    } else {
      setAuthEmail('editor@dawnwire.com');
      setAuthPassword('editor123');
    }
    setAuthError('');
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('dawnwire_token');
    setToken(null);
    setCurrentUser(null);
    navigateTo('home');
  };

  if (dataLoading) {
    return <LoaderAnimation />;
  }

  return (
    <>
    <Head>
      <link rel="stylesheet" href="/assets/styles.css" />
    </Head>
    <AnalyticsScripts settings={settings || undefined} />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-[#246BFF] focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-bold focus:shadow-lg focus:outline-none" aria-label="Skip to main content">
        Skip to main content
      </a>
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-900 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 flex flex-col selection:bg-[#246BFF] selection:text-white" id="dawnwire-root-application">
      
      {/* 1. ADMIN BAR (visible only to logged-in users) */}
      {currentUser && currentUser.role !== 'subscriber' && (
        <ErrorBoundary>
        <div className="bg-slate-900/90 dark:bg-zinc-950 text-white/90 text-[11px] py-1.5 px-6 flex flex-wrap justify-between items-center gap-3 border-b border-slate-200/50 dark:border-zinc-700/50 dark:border-zinc-800 backdrop-blur-sm" id="admin-bar">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-[#246BFF] text-white font-bold px-2 py-0.5 rounded text-[9px]">ADMIN</span>
            <span className="text-white/70 dark:text-zinc-300">Signed in as <strong className="text-[#7C3AED] capitalize">{currentUser.role.replace('_', ' ')} ({currentUser.name})</strong></span>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigateTo('admin')}
              className="text-white/80 hover:text-[#7C3AED] font-semibold underline cursor-pointer text-[11px]"
            >
              Go to Console &rarr;
            </button>
          </div>
        </div>
        </ErrorBoundary>
      )}

      {/* 2. VIEWS ROUTER SCREEN */}
      {route.name === 'admin' && currentUser && currentUser.role !== 'subscriber' ? (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-zinc-900 dark:bg-zinc-950 flex items-center justify-center"><RefreshCw className="h-8 w-8 text-[#246BFF] animate-spin" /></div>}>
          <ErrorBoundary>
            <AdminPanel 
              token={token!} 
              user={currentUser} 
              onLogout={handleLogout} 
            />
          </ErrorBoundary>
        </Suspense>
      ) : (
        <ErrorBoundary>
          <PublicPages
            currentRoute={route}
            onNavigate={navigateTo}
            posts={posts}
            categories={categories}
            affiliateLinks={affiliateLinks}
            pages={pages}
            settings={settings}
            currentUser={currentUser}
            onOpenLogin={() => { setIsRegistering(false); setShowLoginModal(true); }}
            routeSpecific={routeSpecific}
            initialProductReviews={initialData?.productReviews}
          />
        </ErrorBoundary>
      )}


      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="auth-modal-overlay">
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" onClick={() => setShowLoginModal(false)}></div>
          
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 dark:border-zinc-800 max-w-md w-full overflow-hidden relative z-10 p-6 md:p-8 space-y-6" id="auth-modal-box">
            
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-100 dark:hover:text-white p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-900 dark:hover:bg-zinc-900 rounded-lg transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-slate-800 dark:text-zinc-100 dark:text-white text-lg tracking-tight">
                {isRegistering ? 'Create Account' : 'Sign In to DawnWire'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isRegistering ? 'Join our community and participate in discussions.' : 'Access your administrative console or contributor desk.'}
              </p>
            </div>



            {authError && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-400 border border-red-100 dark:border-red-900 rounded-lg p-3 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{authError}</span>
        </div>
      )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1.5">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Alex Smith"
                      className="w-full br-input border border-slate-200 dark:border-zinc-700 p-3 pl-10 text-xs bg-slate-50 dark:bg-zinc-900 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white"
                      required
                    />
                    <UserIcon className="h-4 w-4 text-slate-500 dark:text-zinc-400 absolute left-3 top-3.5" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1.5">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@email.com"
                    className="w-full br-input border border-slate-200 dark:border-zinc-700 p-3 pl-10 text-xs bg-slate-50 dark:bg-zinc-900 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white"
                    required
                  />
                  <Mail className="h-4 w-4 text-slate-500 dark:text-zinc-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full br-input border border-slate-200 dark:border-zinc-700 p-3 pl-10 text-xs bg-slate-50 dark:bg-zinc-900 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#246BFF] dark:text-white"
                    required
                  />
                  <Lock className="h-4 w-4 text-slate-500 dark:text-zinc-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#246BFF] hover:bg-[#1A5AD6] text-white font-semibold text-xs py-3.5 br-btn transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {authLoading ? 'Verifying...' : isRegistering ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError('');
                }}
                className="text-xs text-[#246BFF] font-bold hover:underline"
              >
                {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="hidden md:block pointer-events-none fixed inset-0 z-[9999]" id="magnetic-cursor-container">
        <motion.div
          animate={{
            x: mousePosition.x - 20,
            y: mousePosition.y - 20,
            scale: isHovering ? 1.5 : 1,
            borderColor: isHovering ? '#246BFF' : 'rgba(100, 116, 139, 0.3)',
            backgroundColor: isHovering ? 'rgba(36, 107, 255, 0.08)' : 'rgba(255, 255, 255, 0.01)',
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.4 }}
          className="fixed h-10 w-10 rounded-full border border-zinc-400/20 backdrop-blur-[0.5px] pointer-events-none"
        />
        <motion.div
          animate={{
            x: mousePosition.x - 3,
            y: mousePosition.y - 3,
            scale: clicked ? 0.5 : 1,
            backgroundColor: isHovering ? '#246BFF' : '#0A1F44',
          }}
          transition={{ type: 'spring', damping: 15, stiffness: 800 }}
          className="fixed h-1.5 w-1.5 rounded-full shadow-[0_0_12px_#246BFF] pointer-events-none"
        />
      </div>

    </div>
    </>
  );
}
