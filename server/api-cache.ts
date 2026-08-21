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
    const pathMod = require('path');
    const candidates = [
      pathMod.join(process.cwd(), 'public', 'data', file),
      pathMod.join(process.cwd(), 'dist', 'data', file),
      pathMod.join(process.cwd(), 'data', file),
    ];
    for (const filePath of candidates) {
      try {
        if (fs.existsSync(filePath)) {
          return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      } catch {}
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

/** Invalidate product cache entries so next request fetches fresh data */
export function invalidateProductCache(): void {
  stores.delete('products:light');
  stores.delete('products:full');
  console.log('[Cache] Product cache invalidated');
}

/**
 * Regenerate the static product catalog from Supabase.
 * Called automatically after product imports.
 * Runs in background — doesn't block the import response.
 */
let _regenerating = false;
export async function regenerateCatalog(): Promise<void> {
  if (_regenerating) { console.log('[Catalog] Already regenerating, skipping'); return; }
  _regenerating = true;
  const startTime = Date.now();
  try {
    const fs = require('fs');
    const pathMod = require('path');
    const { createClient } = require('@supabase/supabase-js');
    const OUT = pathMod.join(process.cwd(), 'public', 'data');
    const SB_URL = process.env.SUPABASE_URL || '';
    const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
    if (!SB_URL || !SB_KEY) { _regenerating = false; return; }
    const sb = createClient(SB_URL, SB_KEY);
    const LIGHT = 'id,slug,product_name,brand,product_image,price,original_price,rating,review_count,editor_score,best_for,status,created_at,updated_at,discount_percentage,stock_status,deal_badge,coupon_code,affiliate_url,category_id,asin,amazon_url,final_verdict,seo_title,seo_description,pros,cons,review_summary,key_features,seo_keywords,click_count,page_views';
    // Fetch products in batches
    const products: any[] = [];
    for (let offset = 0; offset < 2000; offset += 200) {
      const { data } = await sb.from('product_reviews').select(LIGHT).eq('status', 'published').order('created_at', { ascending: false }).range(offset, offset + 199);
      if (!data || data.length === 0) break;
      products.push(...data);
      if (data.length < 200) break;
    }
    // Fetch categories and posts in parallel
    const [catRes, postRes] = await Promise.all([
      sb.from('categories').select('id,slug,name,image,status,parent_id').eq('status', 'active').order('name'),
      sb.from('posts').select('id,slug,title,excerpt,featured_image,category_id,readingTime,created_at').eq('status', 'published').order('created_at', { ascending: false }).limit(50),
    ]);
    const categories = catRes.data || [];
    const posts = postRes.data || [];
    // Write files
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(pathMod.join(OUT, 'catalog.json'), JSON.stringify({ generated_at: new Date().toISOString(), product_count: products.length, category_count: categories.length, post_count: posts.length, products }));
    const topProducts = products.filter((p: any) => p.editor_score > 0).sort((a: any, b: any) => (b.editor_score || 0) - (a.editor_score || 0)).slice(0, 20);
    fs.writeFileSync(pathMod.join(OUT, 'homepage.json'), JSON.stringify({ generated_at: new Date().toISOString(), categories, products: topProducts.map((p: any) => ({ id: p.id, slug: p.slug, product_name: p.product_name, brand: p.brand, product_image: p.product_image, price: p.price, editor_score: p.editor_score, rating: p.rating, review_count: p.review_count, best_for: p.best_for })), posts: posts.slice(0, 8) }));
    fs.writeFileSync(pathMod.join(OUT, 'categories.json'), JSON.stringify(categories));
    // Brands from products
    const brandMap = new Map<string, number>();
    products.forEach((p: any) => { if (p.brand) brandMap.set(p.brand, (brandMap.get(p.brand) || 0) + 1); });
    const brands = Array.from(brandMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    fs.writeFileSync(pathMod.join(OUT, 'brands.json'), JSON.stringify(brands));
    // Update in-memory cache
    stores.set('products:light', { data: products, ts: Date.now() });
    stores.set('categories:list', { data: categories, ts: Date.now() });
    stores.set('home:ssr', { data: { categories, products: topProducts, posts: posts.slice(0, 8) }, ts: Date.now() });
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Catalog] ✅ Regenerated in ${elapsed}s: ${products.length} products, ${categories.length} categories, ${brands.length} brands`);
  } catch (e: any) {
    console.error('[Catalog] ❌ Regeneration failed:', e.message);
  } finally {
    _regenerating = false;
  }
}
