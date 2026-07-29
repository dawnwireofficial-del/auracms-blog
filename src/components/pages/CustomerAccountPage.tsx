import React, { useState, useEffect } from 'react';
import { User, Heart, Clock, ArrowRight, LayoutGrid, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import ScrollReveal from '../ScrollReveal';
import { proxyImageUrl } from '../../utils/safeRender';

export default function CustomerAccountPage({ currentUser, onNavigate, onOpenLogin }: { currentUser: any, onNavigate: (r: string, p?: string) => void, onOpenLogin: () => void }) {
  const [activeTab, setActiveTab] = useState<'wishlist' | 'history' | 'comparisons'>('wishlist');
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [comparisons, setComparisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Simple session ID generator for guest tracking
  const getSessionId = () => {
    let sid = localStorage.getItem('dawnwire_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('dawnwire_session_id', sid);
    }
    return sid;
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const sid = getSessionId();
      const token = localStorage.getItem('dawnwire_token');
      const headers: any = { 'x-session-id': sid };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        const [wRes, hRes, cRes] = await Promise.all([
          fetch('/api/public/user/wishlist', { headers }),
          fetch('/api/public/user/history', { headers }),
          fetch('/api/public/user/comparisons', { headers }),
        ]);

        if (wRes.ok) setWishlist(await wRes.json());
        if (hRes.ok) setHistory(await hRes.json());
        if (cRes.ok) setComparisons(await cRes.json());
      } catch (e) {
        console.error("Failed to load user data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 min-h-screen pt-32 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-slate-200 dark:border-zinc-800 shadow-sm mb-8">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#246BFF] to-[#7C3AED] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#246BFF]/20">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="h-8 w-8" />}
              </div>
              <div>
                <h1 className="text-3xl font-display font-black text-slate-900 dark:text-white mb-1">
                  {currentUser?.name ? `Hello, ${currentUser.name}` : 'Guest Dashboard'}
                </h1>
                <p className="text-slate-500 dark:text-zinc-400 font-medium">
                  {currentUser?.email || 'Manage your saved items and history locally.'}
                </p>
              </div>
            </div>
            {!currentUser && (
              <div className="mt-6 md:mt-0 flex flex-col items-center md:items-end">
                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-3 text-center md:text-right">Create an account to sync your data across devices.</p>
                <button 
                  onClick={onOpenLogin}
                  className="bg-[#246BFF] hover:bg-[#1A5AD6] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-[#246BFF]/20"
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'wishlist' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'}`}
          >
            <Heart className="h-4 w-4" /> My Watchlist ({wishlist.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'}`}
          >
            <Clock className="h-4 w-4" /> Recently Viewed ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('comparisons')}
            className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'comparisons' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800'}`}
          >
            <LayoutGrid className="h-4 w-4" /> Saved Comparisons ({comparisons.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 text-[#246BFF] animate-spin" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-zinc-800 shadow-sm"
            >
              {activeTab === 'wishlist' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" /> Price Drop Alerts & Wishlist
                  </h2>
                  {wishlist.length === 0 ? (
                    <EmptyState message="You haven't saved any products to your watchlist yet." icon={<Heart className="h-12 w-12 text-slate-300 dark:text-zinc-700" />} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {wishlist.map(item => (
                        <div key={item.id} className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 hover:border-[#246BFF]/30 transition-all cursor-pointer group" onClick={() => onNavigate('product', item.slug || item.productId)}>
                           {item.productImage && <img src={proxyImageUrl(item.productImage)} referrerPolicy="no-referrer" className="w-full h-32 object-contain mb-4 rounded-lg bg-slate-50 dark:bg-zinc-950 p-2 mix-blend-multiply dark:mix-blend-normal" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                           <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 line-clamp-2 mb-2 group-hover:text-[#246BFF] transition-colors">{item.productName}</h3>
                           <div className="flex justify-between items-center text-xs">
                             <span className="font-semibold text-slate-900 dark:text-white">{item.price}</span>
                             {item.targetPrice && <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded font-bold">Target: ${item.targetPrice}</span>}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#246BFF]" /> Recently Viewed
                  </h2>
                  {history.length === 0 ? (
                    <EmptyState message="Your browsing history is empty." icon={<Clock className="h-12 w-12 text-slate-300 dark:text-zinc-700" />} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {history.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer" onClick={() => onNavigate('product', item.slug || item.productId)}>
                           {item.productImage ? (
                              <img src={proxyImageUrl(item.productImage)} referrerPolicy="no-referrer" className="w-16 h-16 object-contain rounded-lg bg-slate-100 dark:bg-zinc-950 p-1 mix-blend-multiply dark:mix-blend-normal" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                             <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-zinc-900 flex items-center justify-center text-slate-400"><ShoppingBag className="h-6 w-6" /></div>
                           )}
                           <div>
                             <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-200 line-clamp-2 hover:text-[#246BFF] transition-colors">{item.productName}</h3>
                             <span className="text-xs text-slate-500 dark:text-zinc-400 mt-1 block">Viewed {new Date(item.viewedAt).toLocaleDateString()}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comparisons' && (
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-purple-500" /> Saved Comparisons
                  </h2>
                  {comparisons.length === 0 ? (
                    <EmptyState message="You haven't saved any product comparisons." icon={<LayoutGrid className="h-12 w-12 text-slate-300 dark:text-zinc-700" />} />
                  ) : (
                    <div className="space-y-4">
                      {/* Placeholder UI for comparisons */}
                      <p className="text-slate-500">Feature coming soon based on your data structure!</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, icon }: { message: string, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 opacity-50">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200 mb-2">Nothing to see here</h3>
      <p className="text-slate-500 dark:text-zinc-400 max-w-sm">{message}</p>
    </div>
  );
}
