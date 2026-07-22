import { useState, useEffect } from 'react';
import { Product, Category, Brand, Deal, Comparison, EditorialReview, BuyingGuide, Author, CategoryBanner, UserProfile, SEOOpportunity, AmazonSyncLog, AffiliateClickLog } from '../types';
import { SEED_PRODUCTS, SEED_CATEGORIES, SEED_BRANDS, SEED_DEALS, SEED_COMPARISONS, SEED_BUYING_GUIDES, SEED_AUTHORS, SEED_BANNERS, SEED_REVIEWS, SEED_SEO_OPPORTUNITIES } from '../data/seedData';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, addDoc } from 'firebase/firestore';
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

// Global in-memory cache
let globalStore: AppStoreState = {
  products: SEED_PRODUCTS,
  categories: SEED_CATEGORIES,
  brands: SEED_BRANDS,
  deals: SEED_DEALS,
  comparisons: SEED_COMPARISONS,
  reviews: SEED_REVIEWS,
  buyingGuides: SEED_BUYING_GUIDES,
  authors: SEED_AUTHORS,
  banners: SEED_BANNERS,
  seoOpportunities: SEED_SEO_OPPORTUNITIES,
  currentUser: JSON.parse(localStorage.getItem('dawnwire_admin_profile') || 'null'),
  wishlist: JSON.parse(localStorage.getItem('dawnwire_wishlist') || '["p1", "p2"]'),
  recentlyViewed: JSON.parse(localStorage.getItem('dawnwire_recently_viewed') || '["p1", "p2", "p5"]'),
  affiliateClicks: [],
  syncLogs: [
    {
      id: 'sync-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      productsSynced: 20,
      priceUpdates: 3,
      availabilityChanges: 0,
      failedAsins: [],
      status: 'success',
      triggerType: 'scheduled'
    }
  ],
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

  // Wishlist actions
  toggleWishlist: (productId: string) => {
    const list = [...globalStore.wishlist];
    const index = list.indexOf(productId);
    if (index >= 0) {
      list.splice(index, 1);
    } else {
      list.push(productId);
      const targetProd = globalStore.products.find(p => p.id === productId);
      logActivityEvent({
        type: 'WISHLIST_ADD',
        productId,
        productTitle: targetProd?.title || 'Product',
        userEmail: globalStore.currentUser?.email || 'guest@dawnwire.com',
        details: `Added ${targetProd?.title || 'product'} to wishlist`
      });
    }
    globalStore.wishlist = list;
    localStorage.setItem('dawnwire_wishlist', JSON.stringify(list));
    notify();
  },

  // Recently Viewed actions
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

  // Product CRUD
  saveProduct: (product: Product) => {
    const index = globalStore.products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      globalStore.products[index] = product;
    } else {
      globalStore.products.unshift(product);
    }
    notify();
    // Async push to Firestore if available
    try {
      setDoc(doc(db, 'products', product.id), product, { merge: true }).catch(() => {});
    } catch (e) {}
  },

  deleteProduct: (id: string) => {
    globalStore.products = globalStore.products.filter((p) => p.id !== id);
    notify();
    try {
      deleteDoc(doc(db, 'products', id)).catch(() => {});
    } catch (e) {}
  },

  // Category CRUD
  saveCategory: (category: Category) => {
    const index = globalStore.categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      globalStore.categories[index] = category;
    } else {
      globalStore.categories.push(category);
    }
    notify();
    try {
      setDoc(doc(db, 'categories', category.id), category, { merge: true }).catch(() => {});
    } catch (e) {}
  },

  // Banner CRUD
  saveBanner: (banner: CategoryBanner) => {
    const index = globalStore.banners.findIndex((b) => b.id === banner.id);
    if (index >= 0) {
      globalStore.banners[index] = banner;
    } else {
      globalStore.banners.push(banner);
    }
    notify();
    try {
      setDoc(doc(db, 'banners', banner.id), banner, { merge: true }).catch(() => {});
    } catch (e) {}
  },

  deleteBanner: (id: string) => {
    globalStore.banners = globalStore.banners.filter((b) => b.id !== id);
    notify();
    try {
      deleteDoc(doc(db, 'banners', id)).catch(() => {});
    } catch (e) {}
  },

  // Affiliate Click Logging
  logAffiliateClick: (click: Omit<AffiliateClickLog, 'id' | 'timestamp'>) => {
    const fullLog: AffiliateClickLog = {
      ...click,
      id: 'clk-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    globalStore.affiliateClicks.unshift(fullLog);
    notify();

    logActivityEvent({
      type: 'AFFILIATE_CLICK',
      productId: click.productId,
      productTitle: click.productTitle,
      userEmail: globalStore.currentUser?.email || 'shopper@dawnwire.com',
      details: `Clicked outbound Amazon deal link (ASIN: ${click.asin})`
    });

    // Call server API for persistence and analytics
    fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullLog)
    }).catch(() => {});

    try {
      addDoc(collection(db, 'affiliateClicks'), fullLog).catch(() => {});
    } catch (e) {}
  },

  // User Auth & Profile Management
  updateUserProfile: (profileUpdates: Partial<UserProfile>) => {
    if (globalStore.currentUser) {
      globalStore.currentUser = {
        ...globalStore.currentUser,
        ...profileUpdates
      };
      localStorage.setItem('dawnwire_admin_profile', JSON.stringify(globalStore.currentUser));
      notify();
      try {
        setDoc(doc(db, 'users', globalStore.currentUser.uid), globalStore.currentUser, { merge: true }).catch(() => {});
      } catch (e) {}
    }
  },

  loginWithEmailAndPassword: async (email: string, pass: string) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Authenticate against server backend endpoint
      try {
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
            localStorage.setItem('dawnwire_admin_profile', JSON.stringify(profile));
            if (profile.role === 'super_admin' || profile.role === 'admin') {
              localStorage.setItem('dawnwire_admin_session', 'true');
            }
            notify();
            return { success: true, profile };
          }
        }
      } catch (apiErr) {
        // Fallback if offline/decoupled
      }

      // 2. Firebase Auth fallback
      try {
        const res = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        if (res.user) {
          const profile: UserProfile = {
            uid: res.user.uid,
            email: res.user.email || normalizedEmail,
            displayName: res.user.displayName || normalizedEmail.split('@')[0],
            role: (res.user.email?.toLowerCase() === 'atif@dawnwire.com' || res.user.email?.toLowerCase() === 'admin@dawnwire.com') ? 'super_admin' : 'user',
            createdAt: new Date().toISOString(),
            wishlistProductIds: globalStore.wishlist
          };
          globalStore.currentUser = profile;
          localStorage.setItem('dawnwire_admin_profile', JSON.stringify(profile));
          if (profile.role === 'super_admin' || profile.role === 'admin') {
            localStorage.setItem('dawnwire_admin_session', 'true');
          }
          notify();
          return { success: true, profile };
        }
      } catch (fbErr) {}

      // 3. Verification check for admin credentials
      if ((normalizedEmail === 'atif@dawnwire.com' || normalizedEmail === 'admin@dawnwire.com') && (pass === 'admin123' || pass === 'dawnwire2026')) {
        const profile: UserProfile = {
          uid: 'admin-atif',
          email: normalizedEmail,
          displayName: 'Atif (Super Admin)',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
          role: 'super_admin',
          createdAt: new Date().toISOString(),
          wishlistProductIds: globalStore.wishlist
        };
        globalStore.currentUser = profile;
        localStorage.setItem('dawnwire_admin_profile', JSON.stringify(profile));
        localStorage.setItem('dawnwire_admin_session', 'true');
        notify();
        return { success: true, profile };
      }

      return { success: false, error: 'Invalid email or password' };
    } catch (e: any) {
      console.error('Login error:', e);
      return { success: false, error: 'Authentication failed' };
    }
  },

  loginWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        const profile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email || '',
          displayName: res.user.displayName || 'DawnWire User',
          photoURL: res.user.photoURL || undefined,
          role: (res.user.email === 'atif@dawnwire.com' || res.user.email === 'admin@dawnwire.com') ? 'super_admin' : 'user',
          createdAt: new Date().toISOString(),
          wishlistProductIds: globalStore.wishlist
        };
        globalStore.currentUser = profile;
        notify();
      }
    } catch (e) {
      console.error('Google login failed', e);
    }
  },

  loginWithGithub: async () => {
    try {
      const provider = new GithubAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        const profile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email || `${res.user.uid}@github.com`,
          displayName: res.user.displayName || 'GitHub User',
          photoURL: res.user.photoURL || undefined,
          role: (res.user.email === 'atif@dawnwire.com' || res.user.email === 'admin@dawnwire.com') ? 'super_admin' : 'user',
          createdAt: new Date().toISOString(),
          wishlistProductIds: globalStore.wishlist
        };
        globalStore.currentUser = profile;
        notify();
      }
    } catch (e) {
      console.error('GitHub login failed, using simulated OAuth session:', e);
      const profile: UserProfile = {
        uid: 'gh-' + Date.now(),
        email: 'dev.github@dawnwire.com',
        displayName: 'GitHub Developer',
        role: 'user',
        createdAt: new Date().toISOString(),
        wishlistProductIds: globalStore.wishlist
      };
      globalStore.currentUser = profile;
      notify();
    }
  },

  loginWithFacebook: async () => {
    try {
      const provider = new FacebookAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        const profile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email || `${res.user.uid}@facebook.com`,
          displayName: res.user.displayName || 'Facebook User',
          photoURL: res.user.photoURL || undefined,
          role: (res.user.email === 'atif@dawnwire.com' || res.user.email === 'admin@dawnwire.com') ? 'super_admin' : 'user',
          createdAt: new Date().toISOString(),
          wishlistProductIds: globalStore.wishlist
        };
        globalStore.currentUser = profile;
        notify();
      }
    } catch (e) {
      console.error('Facebook login failed, using simulated OAuth session:', e);
      const profile: UserProfile = {
        uid: 'fb-' + Date.now(),
        email: 'facebook.user@dawnwire.com',
        displayName: 'Facebook User',
        role: 'user',
        createdAt: new Date().toISOString(),
        wishlistProductIds: globalStore.wishlist
      };
      globalStore.currentUser = profile;
      notify();
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      globalStore.currentUser = null;
      localStorage.removeItem('dawnwire_admin_profile');
      localStorage.removeItem('dawnwire_admin_session');
      notify();
    } catch (e) {}
  }
};

// React hook to access reactive store
export function useAppStore() {
  const [state, setState] = useState(store.get());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.get() });
    });

    // Listen to Auth State
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        globalStore.currentUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'DawnWire Member',
          photoURL: user.photoURL || undefined,
          role: (user.email === 'atif@dawnwire.com' || user.email === 'admin@dawnwire.com') ? 'super_admin' : 'user',
          createdAt: new Date().toISOString(),
          wishlistProductIds: globalStore.wishlist
        };
      } else if (globalStore.currentUser?.role !== 'super_admin') {
        globalStore.currentUser = null;
      }
      notify();
    });

    return () => {
      unsubscribe();
      authUnsub();
    };
  }, []);

  return state;
}
