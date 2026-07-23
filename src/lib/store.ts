import { useState, useEffect } from 'react';
import { Product, Category, Brand, Deal, Comparison, EditorialReview, BuyingGuide, Author, CategoryBanner, UserProfile, SEOOpportunity, AmazonSyncLog, AffiliateClickLog } from '../types';
import { logActivityEvent } from './activityTracker';

export interface AppStoreState {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  deals: Deal[];
  comparisons: Comparison[];
  reviews: EditorialReview[];
  buyingGuides: BuyingGuide[];
  authors: Author[];
  banners: CategoryBanner[];
  seoOpportunities: SEOOpportunity[];
  currentUser: UserProfile | null;
  wishlist: string[];
  recentlyViewed: string[];
  affiliateClicks: AffiliateClickLog[];
  syncLogs: AmazonSyncLog[];
  isLoading: boolean;
}

let globalStore: AppStoreState = {
  products: [],
  categories: [],
  brands: [],
  deals: [],
  comparisons: [],
  reviews: [],
  buyingGuides: [],
  authors: [],
  banners: [],
  seoOpportunities: [],
  currentUser: null,
  wishlist: JSON.parse(localStorage.getItem('dawnwire_wishlist') || '[]'),
  recentlyViewed: JSON.parse(localStorage.getItem('dawnwire_recently_viewed') || '[]'),
  affiliateClicks: [],
  syncLogs: [],
  isLoading: false
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export const store = {
  get: () => globalStore,
  
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  toggleWishlist: (productId: string) => {
    const list = [...globalStore.wishlist];
    const index = list.indexOf(productId);
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(productId);
    }
    globalStore.wishlist = list;
    localStorage.setItem('dawnwire_wishlist', JSON.stringify(list));
    notify();
  },

  addRecentlyViewed: (productId: string) => {
    let list = [...globalStore.recentlyViewed];
    list = list.filter((id) => id !== productId);
    list.unshift(productId);
    if (list.length > 12) list = list.slice(0, 12);
    globalStore.recentlyViewed = list;
    localStorage.setItem('dawnwire_recently_viewed', JSON.stringify(list));
    notify();
  },

  clearRecentlyViewed: () => {
    globalStore.recentlyViewed = [];
    localStorage.setItem('dawnwire_recently_viewed', JSON.stringify([]));
    notify();
  },

  saveProduct: (product: Product) => {
    const index = globalStore.products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      globalStore.products[index] = product;
    } else {
      globalStore.products.unshift(product);
    }
    notify();
    try {
      fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('dawnwire_auth_token')}` },
        body: JSON.stringify(product)
      }).catch(() => {});
    } catch (e) {}
  },

  deleteProduct: (id: string) => {
    globalStore.products = globalStore.products.filter((p) => p.id !== id);
    notify();
  },

  saveCategory: (category: Category) => {
    const index = globalStore.categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      globalStore.categories[index] = category;
    } else {
      globalStore.categories.push(category);
    }
    notify();
  },

  saveBanner: (banner: CategoryBanner) => {
    const index = globalStore.banners.findIndex((b) => b.id === banner.id);
    if (index >= 0) {
      globalStore.banners[index] = banner;
    } else {
      globalStore.banners.push(banner);
    }
    notify();
  },

  deleteBanner: (id: string) => {
    globalStore.banners = globalStore.banners.filter((b) => b.id !== id);
    notify();
  },

  logAffiliateClick: (click: Omit<AffiliateClickLog, 'id' | 'timestamp'>) => {
    const fullLog: AffiliateClickLog = {
      ...click,
      id: 'clk-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    globalStore.affiliateClicks.unshift(fullLog);
    notify();

    fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullLog)
    }).catch(() => {});
  },

  updateUserProfile: (profileUpdates: Partial<UserProfile>) => {
    if (globalStore.currentUser) {
      globalStore.currentUser = {
        ...globalStore.currentUser,
        ...profileUpdates
      };
      notify();
    }
  },

  setUser: (user: UserProfile) => {
    globalStore.currentUser = user;
    notify();
  },

  loginWithEmailAndPassword: async (email: string, pass: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password: pass })
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.user) {
          const profile: UserProfile = {
            uid: data.user.id || 'usr-' + Date.now(),
            email: data.user.email,
            displayName: data.user.name || normalizedEmail.split('@')[0],
            role: data.user.role || 'user',
            createdAt: data.user.createdAt || new Date().toISOString(),
            wishlistProductIds: globalStore.wishlist
          };
          globalStore.currentUser = profile;
          if (data.token) {
            localStorage.setItem('dawnwire_auth_token', data.token);
          }
          notify();
          return { success: true, profile };
        }
      }

      return { success: false, error: 'Invalid email or password' };
    } catch (e: any) {
      console.error('Login error:', e);
      return { success: false, error: 'Authentication failed' };
    }
  },

  loginWithGoogle: async () => {
    return { success: false, error: 'Social login not available. Use email/password.' };
  },

  loginWithGithub: async () => {
    return { success: false, error: 'Social login not available. Use email/password.' };
  },

  loginWithFacebook: async () => {
    return { success: false, error: 'Social login not available. Use email/password.' };
  },

  logout: async () => {
    try {
      globalStore.currentUser = null;
      localStorage.removeItem('dawnwire_admin_profile');
      localStorage.removeItem('dawnwire_admin_session');
      localStorage.removeItem('dawnwire_auth_token');
      notify();
    } catch (e) {}
  }
};

export function useAppStore() {
  const [state, setState] = useState(store.get());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.get() });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return state;
}
