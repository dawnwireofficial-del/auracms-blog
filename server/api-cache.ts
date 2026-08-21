/**
 * In-Memory API Cache with Stale-While-Revalidate
 * 
 * Prevents every request from hitting Supabase.
 * Survives across warm Vercel invocations.
 * Falls back to stale data when Supabase is slow/paused.
 */

interface CacheEntry<T> {
  data: T;
  ts: number;
  loading?: Promise<T>;
}

const stores = new Map<string, CacheEntry<any>>();

export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 300_000, // 5 minutes
  staleMs: number = 600_000, // 10 minutes max stale
): Promise<T> {
  const existing = stores.get(key);
  const now = Date.now();

  // Fresh cache hit
  if (existing && now - existing.ts < ttlMs) {
    return existing.data;
  }

  // Stale but usable — return stale data while refreshing in background
  if (existing && now - existing.ts < staleMs && existing.loading) {
    // Already refreshing, wait for that
    return existing.loading;
  }

  if (existing && now - existing.ts < staleMs && !existing.loading) {
    // Stale but not refreshing — kick off refresh, return stale for now
    const refreshPromise = fetcher().then(data => {
      stores.set(key, { data, ts: Date.now() });
      return data;
    }).catch(e => {
      // Refresh failed — keep stale entry alive
      console.error(`[Cache] refresh failed for ${key}:`, e.message);
      stores.delete(key + ':loading');
      return existing.data;
    }).finally(() => {
      const entry = stores.get(key);
      if (entry) entry.loading = undefined;
    });

    if (existing) existing.loading = refreshPromise as Promise<any>;
    return existing.data;
  }

  // No cache or expired — must fetch
  if (existing?.loading) {
    return existing.loading;
  }

  const fetchPromise = fetcher().then(data => {
    stores.set(key, { data, ts: Date.now() });
    return data;
  }).catch(e => {
    console.error(`[Cache] fetch failed for ${key}:`, e.message);
    // If we have ANY stale data, return it
    if (existing) {
      stores.set(key, { ...existing, ts: existing.ts }); // keep alive
      return existing.data;
    }
    throw e;
  }).finally(() => {
    const entry = stores.get(key);
    if (entry) entry.loading = undefined;
  });

  const entry: CacheEntry<T> = { data: existing?.data, ts: existing?.ts || 0, loading: fetchPromise as Promise<any> };
  stores.set(key, entry);

  return fetchPromise;
}

/**
 * Try to read from static file first, then Supabase.
 * Returns null if both fail.
 */
export function readStaticCatalog(file: string): any {
  try {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'data', file);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch {}
  return null;
}

/**
 * Warm up the cache with static catalog data.
 * Call this on first request to avoid cold-start Supabase hits.
 */
export function warmCacheFromStatic(): void {
  try {
    const catalog = readStaticCatalog('catalog.json');
    if (catalog?.products) {
      stores.set('products:light', { data: catalog.products, ts: Date.now() });
      console.log(`[Cache] Warmed from catalog.json: ${catalog.products.length} products`);
    }
    const homepage = readStaticCatalog('homepage.json');
    if (homepage) {
      stores.set('home:ssr', { data: homepage, ts: Date.now() });
      console.log(`[Cache] Warmed from homepage.json`);
    }
    const categories = readStaticCatalog('categories.json');
    if (categories) {
      stores.set('categories:list', { data: categories, ts: Date.now() });
      console.log(`[Cache] Warmed from categories.json: ${categories.length} categories`);
    }
  } catch (e: any) {
    console.error('[Cache] Warm failed:', e.message);
  }
}

export function getCacheStats() {
  const entries: Record<string, { age: number; stale: boolean }> = {};
  const now = Date.now();
  stores.forEach((v, k) => {
    entries[k] = { age: Math.round((now - v.ts) / 1000), stale: now - v.ts > 300_000 };
  });
  return entries;
}
