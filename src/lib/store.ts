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

let _fetchRequestId = 0;
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
    const isAdding = index < 0;
    if (isAdding) {
      list.push(productId);
    } else {
      list.splice(index, 1);
    }
    globalStore.wishlist = list;
    localStorage.setItem('dawnwire_wishlist', JSON.stringify(list));
    notify();
    const sessionId = localStorage.getItem('dawnwire_session_id') || (() => {
      const id = 'sess-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('dawnwire_session_id', id);
      return id;
    })();
    const userId = globalStore.currentUser?.uid || '';
    if (isAdding) {
      fetch('/api/public/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId, productId }),
      }).then(r => r.json().then((d: any) => {
        if (d && d.id) localStorage.setItem(`dawnwire_wishlist_item_${productId}`, d.id);
      })).catch(() => {});
    } else {
      const wishlistItemId = localStorage.getItem(`dawnwire_wishlist_item_${productId}`) || '';
      if (wishlistItemId) {
        fetch(`/api/public/wishlist/${wishlistItemId}`, { method: 'DELETE' }).catch(() => {});
      }
    }
  },

  addRecentlyViewed: (productId: string) => {
    let list = [...globalStore.recentlyViewed];
    list = list.filter((id) => id !== productId);
    list.unshift(productId);
    if (list.length > 12) list = list.slice(0, 12);
    globalStore.recentlyViewed = list;
    localStorage.setItem('dawnwire_recently_viewed', JSON.stringify(list));
    notify();
    const sessionId = localStorage.getItem('dawnwire_session_id') || (() => {
      const id = 'sess-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('dawnwire_session_id', id);
      return id;
    })();
    fetch('/api/public/recently-viewed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: globalStore.currentUser?.uid || '', sessionId, productId }),
    }).catch(() => {});
  },

  clearRecentlyViewed: () => {
    globalStore.recentlyViewed = [];
    localStorage.setItem('dawnwire_recently_viewed', JSON.stringify([]));
    notify();
  },

  fetchProducts: async () => {
    const requestId = ++_fetchRequestId;
    try {
      const token = localStorage.getItem('dawnwire_auth_token') || '';
      const mapper = (d: any): Product => ({
        id: d.id || d.asin || 'p-' + Math.random().toString(36).substring(2, 7),
        title: d.product_name || d.title || 'Product Review',
        slug: d.slug || (d.product_name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        asin: d.asin || '',
        brand: d.brand || '',
        mainCategory: d.category || d.mainCategory || '',
        subcategory: d.subcategory || '',
        productType: 'Physical Product',
        shortDescription: d.review_summary || d.shortDescription || '',
        fullDescription: d.review_summary || d.fullDescription || '',
        images: (() => {
          const imgs: string[] = [];
          if (d.product_image) imgs.push(d.product_image);
          const dbGallery = d.gallery;
          if (Array.isArray(dbGallery)) dbGallery.forEach((u: string) => { if (u && !imgs.includes(u)) imgs.push(u); });
          const specsGallery = d.specs?.gallery;
          if (Array.isArray(specsGallery)) specsGallery.forEach((u: string) => { if (u && !imgs.includes(u)) imgs.push(u); });
          return imgs;
        })(),
        amazonOriginalUrl: d.amazon_url || d.amazonOriginalUrl || '',
        affiliateUrl: d.affiliate_url || d.affiliateUrl || '',
        amazonMarketplace: 'US',
        associateTrackingId: 'dawnwire-20',
        currentPrice: Number(parseFloat(String(d.price || d.currentPrice || '0').replace(/[^0-9.]/g, ''))) || 0,
        referencePrice: Number(parseFloat(String(d.original_price || d.referencePrice || '0').replace(/[^0-9.]/g, ''))) || 0,
        currency: 'USD',
        discountPercentage: Number(d.discount_percentage || d.discountPercentage) || 0,
        isAvailable: d.stock_status !== 'out_of_stock',
        isDeal: Boolean(d.is_deal || d.isDeal),
        isPrime: true,
        rating: Number(d.rating) || 0,
        reviewCount: Number(d.review_count || d.reviewCount) || 0,
        mainFeatures: Array.isArray(d.key_features) ? d.key_features : (Array.isArray(d.mainFeatures) ? d.mainFeatures : []),
        specifications: d.specs || d.specifications || {},
        pros: Array.isArray(d.pros) ? d.pros : [],
        cons: Array.isArray(d.cons) ? d.cons : [],
        bestFor: d.best_for || d.bestFor || '',
        editorVerdict: d.review_summary || d.editorVerdict || '',
        editorScore: Number(d.editor_score) || (Number(d.rating) ? Number(d.rating) * 2 : 0),
        similarProductIds: [],
        alternativeProductIds: [],
        relatedComparisonIds: [],
        relatedGuideIds: [],
        isFeatured: !!d.is_featured,
        isTrending: !!d.is_trending,
        isBestSeller: !!d.is_best_seller,
        published: d.status !== 'draft',
        status: d.status || 'published',
        lastSyncedAt: d.last_synced_at || '',
        videoUrl: d.specs?.video_url || d.videoUrl || '',
        categoryId: d.category_id || d.categoryId || ''
      });

      const tryFetch = async (url: string, headers?: Record<string, string>): Promise<Product[] | null> => {
        const res = await fetch(url, headers ? { headers } : {});
        if (!res.ok) return null;
        const raw = await res.json();
        const items = Array.isArray(raw) ? raw : (raw.data || raw.products || raw.items || []);
        if (!items.length) return null;
        return items.map(mapper);
      };

      let mapped: Product[] | null = null;
      if (token) mapped = await tryFetch('/api/admin/product-reviews?limit=500&light=1', { 'Authorization': `Bearer ${token}` });
      if (!mapped) mapped = await tryFetch('/api/public/product-reviews?limit=500&light=1');
      if (mapped && mapped.length > 0 && requestId === _fetchRequestId) {
        globalStore.products = mapped;
        notify();
      }
    } catch (e) {
      console.warn('Failed to fetch products for store', e);
    }
  },

  fetchCategories: async () => {
    try {
      const res = await fetch('/api/public/categories');
      if (res.ok) {
        const raw = await res.json();
        const items = Array.isArray(raw) ? raw : (raw.data || raw.categories || raw.items || []);
        if (items.length > 0) {
          globalStore.categories = items;
          notify();
        }
      }
    } catch {
      const { toast } = await import('./toastStore');
      toast.error('Failed to load categories');
    }
  },

  saveProduct: async (product: Product) => {
    const index = globalStore.products.findIndex((p) => p.id === product.id);
    const isUpdate = index >= 0;
    const previous = isUpdate ? { ...globalStore.products[index] } : null;
    if (isUpdate) {
      globalStore.products[index] = product;
    } else {
      globalStore.products.unshift(product);
    }
    notify();
    try {
      const token = localStorage.getItem('dawnwire_auth_token') || '';
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const body = JSON.stringify(product);
      let res;
      if (isUpdate && product.id && !product.id.startsWith('p-')) {
        res = await fetch(`/api/admin/seo/product-reviews/${product.id}`, {
          method: 'PUT', headers, body
        });
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST', headers, body
        });
      }
      if (!res.ok) {
        if (previous !== null) {
          globalStore.products[index] = previous;
        } else {
          globalStore.products = globalStore.products.filter((p) => p.id !== product.id);
        }
        notify();
        const errText = await res.text().catch(() => '');
        let msg = `Save failed (${res.status})`;
        try {
          const j = JSON.parse(errText);
          if (j.error) msg = j.error;
        } catch { /* ignore */ }
        return { ok: false, error: msg, status: res.status };
      }
      return { ok: true, status: res.status };
    } catch (e: any) {
      if (previous !== null) {
        globalStore.products[index] = previous;
      } else {
        globalStore.products = globalStore.products.filter((p) => p.id !== product.id);
      }
      notify();
      return { ok: false, error: e.message || 'Network error' };
    }
  },

  deleteProduct: async (id: string) => {
    const token = localStorage.getItem('dawnwire_auth_token') || '';
    try {
      const res = await fetch(`/api/admin/seo/product-reviews/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        globalStore.products = globalStore.products.filter((p) => p.id !== id);
        notify();
      }
    } catch (e) {
      console.warn('Failed to delete product on server', e);
    }
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

  fetchBanners: async () => {
    try {
      const res = await fetch('/api/public/homepage-hero');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || []);
        if (items.length > 0) {
          globalStore.banners = items.map((s: any) => ({
            id: s.id || 'hs-' + Date.now(),
            categoryId: '',
            desktopImage: s.desktop_image || s.desktopImage || '',
            mobileImage: s.mobile_image || s.mobileImage || '',
            title: s.heading || s.title || '',
            heading: s.heading || '',
            subtitle: s.subtitle || '',
            description: s.description || '',
            badgeText: s.badge_text || s.badgeText || '',
            ctaText: s.cta_text || s.ctaText || '',
            targetUrl: s.cta_link || s.targetUrl || '',
            ctaLink: s.cta_link || s.ctaLink || '',
            altText: s.alt_text || s.altText || '',
            affiliateUrl: s.affiliate_url || s.affiliateUrl || '',
            sortOrder: s.sort_order ?? s.sortOrder ?? 0,
            order: s.sort_order ?? s.sortOrder ?? 0,
            isEnabled: s.is_active ?? s.isActive ?? true,
            isActive: s.is_active ?? s.isActive ?? true,
            overlayStrength: s.overlay_strength ?? s.overlayStrength ?? 50,
            imageOnly: s.image_only ?? s.imageOnly ?? false,
          }));
          notify();
        }
      }
    } catch (e) {
      console.warn('Failed to fetch homepage banners', e);
    }
  },

  saveBanner: async (banner: CategoryBanner) => {
    const token = localStorage.getItem('dawnwire_auth_token') || '';
    const isUpdate = globalStore.banners.some((b) => b.id === banner.id);

    // Optimistic local update
    if (isUpdate) {
      globalStore.banners = globalStore.banners.map((b) => b.id === banner.id ? banner : b);
    } else {
      globalStore.banners.push(banner);
    }
    notify();

    try {
      const body = {
        heading: banner.title || banner.heading || '',
        description: banner.description || '',
        ctaText: banner.ctaText || '',
        ctaLink: banner.targetUrl || banner.ctaLink || '',
        desktopImage: banner.desktopImage || '',
        mobileImage: banner.mobileImage || banner.desktopImage || '',
        altText: banner.altText || banner.title || '',
        sortOrder: banner.order ?? banner.sortOrder ?? 0,
        isActive: banner.isEnabled ?? banner.isActive ?? true,
        imageOnly: banner.imageOnly ?? false,
      };

      let res;
      if (isUpdate) {
        res = await fetch(`/api/admin/homepage-hero/${banner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/admin/homepage-hero', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        const saved = await res.json();
        if (saved && saved.id) {
          globalStore.banners = globalStore.banners.map((b) =>
            b.id === banner.id ? { ...banner, id: saved.id } : b
          );
          notify();
        }
      }
    } catch (e) {
      console.warn('Failed to save banner to server', e);
    }
  },

  deleteBanner: async (id: string) => {
    const token = localStorage.getItem('dawnwire_auth_token') || '';
    globalStore.banners = globalStore.banners.filter((b) => b.id !== id);
    notify();
    try {
      await fetch(`/api/admin/homepage-hero/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (e) {
      console.warn('Failed to delete banner on server', e);
    }
  },

  logAffiliateClick: (click: Omit<AffiliateClickLog, 'id' | 'timestamp'>) => {
    const fullLog: AffiliateClickLog = {
      ...click,
      id: 'clk-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString()
    };
    globalStore.affiliateClicks.unshift(fullLog);
    notify();

    fetch('/api/public/track/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: click.productId,
        pageUrl: click.pageSource || window.location.pathname,
        pageType: 'product',
        ctaPosition: click.ctaPosition,
        deviceType: click.device,
        asin: click.asin,
        productTitle: click.productTitle,
        category: click.category,
        brand: click.brand,
        ctaText: click.ctaText,
        marketplace: click.marketplace
      })
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
      globalStore.products = [];
      globalStore.categories = [];
      globalStore.brands = [];
      globalStore.deals = [];
      globalStore.wishlist = [];
      globalStore.recentlyViewed = [];
      globalStore.affiliateClicks = [];
      localStorage.removeItem('dawnwire_admin_profile');
      localStorage.removeItem('dawnwire_admin_session');
      localStorage.removeItem('dawnwire_auth_token');
      localStorage.removeItem('dawnwire_wishlist');
      localStorage.removeItem('dawnwire_recently_viewed');
      notify();
    } catch (e) {}
  }
};

export function getCategoryTree(categories: Category[]) {
  const map = new Map<string, Category & { children: Category[] }>();
  const roots: (Category & { children: Category[] })[] = [];
  categories.forEach(c => map.set(c.id, { ...c, children: [] }));
  categories.forEach(c => {
    const node = map.get(c.id);
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node!);
    } else if (!c.parentId) {
      roots.push(node!);
    }
  });
  return roots;
}

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
