import React from 'react';
import { useAppStore } from '../../lib/store';
import { navigate } from '../../lib/navigation';

interface MobileBottomNavProps {
  onOpenAiFinder?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenAiFinder }) => {
  const { wishlist = [], comparisons = [] } = useAppStore();
  const currentPath = window.location.pathname;

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      isActive: currentPath === '/',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: 'catalog',
      label: 'Catalog',
      path: '/products',
      isActive: currentPath.startsWith('/products') || currentPath.startsWith('/categories') || currentPath === '/search',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      id: 'deals',
      label: 'Deals',
      path: '/deals',
      isActive: currentPath === '/deals',
      icon: (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
          />
        </svg>
      ),
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      path: '/wishlist',
      isActive: currentPath === '/wishlist',
      badge: (wishlist || []).length > 0 ? wishlist.length : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
    {
      id: 'compare',
      label: 'Compare',
      path: '/compare',
      isActive: currentPath === '/compare',
      badge: (comparisons || []).length > 0 ? comparisons.length : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 shadow-2xl px-1 pb-[calc(0.375rem+env(safe-area-inset-bottom))] pt-1.5 flex items-center justify-around transition-colors">
      {tabs.map((tab) => {
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 px-0.5 rounded-xl transition-all relative ${
              tab.isActive
                ? 'text-blue-600 dark:text-blue-400 font-black'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative shrink-0">
              {tab.icon}
              {tab.badge !== undefined && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full">{tab.label}</span>
            {tab.isActive && (
              <span className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5 shrink-0" />
            )}
          </button>
        );
      })}

      {/* AI Assistant Quick Trigger */}
      {onOpenAiFinder && (
        <button
          onClick={onOpenAiFinder}
          className="flex flex-col items-center justify-center flex-1 min-w-0 py-1 px-0.5 rounded-xl text-dw-blue dark:text-blue-400 font-bold transition-all relative hover:scale-105 active:scale-95"
          title="AI Product Finder"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-dw-navy to-dw-blue text-white flex items-center justify-center shadow-sm shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 font-extrabold truncate max-w-full">AI Finder</span>
        </button>
      )}
    </nav>
  );
};
