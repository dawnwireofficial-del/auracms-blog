#!/usr/bin/env npx tsx
/**
 * Generate Static Product Catalog
 *
 * Production backend is MySQL (Supabase is frozen), so this reads from MySQL
 * first and falls back to Supabase only when no MySQL env is configured.
 * Outputs static JSON the public API / SSR use as cache + fallback:
 *   1. public/data/catalog.json   — full published product catalog
 *   2. public/data/homepage.json  — homepage data (top products, categories, posts)
 *   3. public/data/categories.json
 *   4. public/data/brands.json    — derived from product brands
 *
 * GUARD: if the fetch returns ZERO products while an existing catalog file
 * already holds data (DB down / grants revoked / frozen Supabase), the script
 * ABORTS and leaves the current files untouched — so a broken run can never
 * silently wipe good data again (this happened repeatedly in Sept 2026:
 * commit 7f6dc3c and later shipped catalog.json with product_count 0).
 *
 * Run as part of build process or manually:  npx tsx scripts/generate-product-catalog.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createConnection } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const MYSQL_URL = process.env.MYSQL_URL || '';
const MYSQL = {
  host: process.env.MYSQL_HOST || '',
  user: process.env.MYSQL_USER || '',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || '',
};

const useMysql = !!(MYSQL_URL || (MYSQL.host && MYSQL.user && MYSQL.database));

if (!useMysql && (!SB_URL || !SB_KEY)) {
  console.log('[generate-catalog] Skipping — no MySQL or Supabase env vars (build-time)');
  process.exit(0);
}

const OUT = path.join(process.cwd(), 'public', 'data');
const NUMERIC = ['rating', 'review_count', 'editor_score', 'click_count', 'page_views', 'discount_percentage'];

function pick(o: any, keys: string[]): any {
  const out: any = {};
  for (const k of keys) if (o && k in o) out[k] = o[k];
  return out;
}

function parseMaybeArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try { const j = JSON.parse(v); return Array.isArray(j) ? j : []; } catch { return []; }
  }
  return [];
}

// ─── MySQL source (production backend) ───────────────────────────────────────
async function mysqlFetch() {
  const conn = await createConnection(MYSQL_URL || MYSQL);
  try {
    const [pRows] = await conn.query("SELECT * FROM product_reviews WHERE status='published' ORDER BY created_at DESC");
    const products = (pRows as any[]).map((r) => {
      const p: any = { ...r };
      for (const k of NUMERIC) if (k in p) p[k] = Number(p[k] || 0);
      for (const k of ['pros', 'cons', 'key_features']) p[k] = parseMaybeArray(p[k]);
      if (typeof p.seo_keywords === 'string') {
        const parsed = parseMaybeArray(p.seo_keywords);
        p.seo_keywords = parsed.length || /^\[/.test(p.seo_keywords) ? parsed : p.seo_keywords;
      }
      return p;
    });

    const [cRows] = await conn.query('SELECT * FROM categories');
    const categories = (cRows as any[])
      .filter((c: any) => c.status === 'active')
      .sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || '')))
      .map((c: any) => pick(c, ['id', 'slug', 'name', 'image', 'status', 'parent_id']));

    const [poRows] = await conn.query("SELECT * FROM posts WHERE status='published' ORDER BY created_at DESC LIMIT 50");
    const posts = (poRows as any[]).map((p: any) =>
      pick(p, ['id', 'slug', 'title', 'excerpt', 'featured_image', 'category_id', 'created_at'])
    );
    return { products, categories, posts };
  } finally {
    await conn.end().catch(() => {});
  }
}

// ─── Supabase fallback (legacy; frozen since Aug 2026) ───────────────────────
const sb = createClient(SB_URL, SB_KEY);
const LIGHT_COLS = 'id,slug,product_name,brand,product_image,price,original_price,rating,review_count,editor_score,best_for,status,created_at,updated_at,discount_percentage,stock_status,deal_badge,coupon_code,affiliate_url,category_id,asin,amazon_url,final_verdict,seo_title,seo_description,pros,cons,review_summary,key_features,seo_keywords,click_count,page_views';

async function sbFetchAllProducts(): Promise<any[]> {
  const products: any[] = [];
  const BATCH = 200;
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from('product_reviews')
      .select(LIGHT_COLS)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + BATCH - 1);
    if (error) { console.error(`Query error at offset ${offset}:`, error.message); break; }
    if (!data || data.length === 0) break;
    products.push(...(data as any[]));
    if (data.length < BATCH) break;
    offset += BATCH;
    await new Promise((r) => setTimeout(r, 200));
  }
  return products;
}

async function sbFetchCategories(): Promise<any[]> {
  const { data } = await sb.from('categories')
    .select('id,slug,name,image,status,parent_id')
    .eq('status', 'active')
    .order('name');
  return data || [];
}

async function sbFetchPosts(): Promise<any[]> {
  const { data } = await sb.from('posts')
    .select('id,slug,title,excerpt,featured_image,category_id,readingTime,created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

// ─── Existing-file helpers + no-wipe guard ───────────────────────────────────
function readJson(file: string): any {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function hasRows(v: any): boolean {
  if (Array.isArray(v)) return v.length > 0;
  if (v && typeof v === 'object') {
    for (const k of ['products', 'categories', 'posts']) {
      if (Array.isArray(v[k]) && v[k].length > 0) return true;
    }
  }
  return false;
}

function existingDataOr(file: string, fresh: any[]): any[] {
  return fresh.length > 0 ? fresh : hasRows(readJson(path.join(OUT, file))) ? [] : [];
}

async function main() {
  console.log('=== Generating Static Product Catalog ===\n');
  fs.mkdirSync(OUT, { recursive: true });

  let products: any[] = [];
  let categories: any[] = [];
  let posts: any[] = [];

  if (useMysql) {
    console.log('Source: MySQL (production backend)');
    try {
      const r = await mysqlFetch();
      products = r.products; categories = r.categories; posts = r.posts;
    } catch (e: any) {
      console.error(`[generate-catalog] MySQL fetch FAILED: ${e.code || e.message}`);
      console.error('          Falling through — existing files will be kept if populated.');
    }
  } else {
    console.log('Source: Supabase');
    console.log('Fetching products...');
    products = await sbFetchAllProducts();
    console.log(`  → ${products.length} products\n`);
    console.log('Fetching categories...');
    categories = await sbFetchCategories();
    console.log(`  → ${categories.length} categories\n`);
    console.log('Fetching posts...');
    posts = await sbFetchPosts();
    console.log(`  → ${posts.length} posts\n`);
  }

  // GUARD: never replace populated catalog files with an empty DB result.
  if (products.length === 0) {
    const populated = ['catalog.json', 'homepage.json', 'categories.json', 'brands.json']
      .some((f) => hasRows(readJson(path.join(OUT, f))));
    if (populated) {
      console.error('\n[generate-catalog] ABORT: fetched 0 products but existing catalog files hold data.');
      console.error('          DB is unreachable or privileges are missing. NOT overwriting good data.');
      console.error('          Restore MySQL grants (Hostinger) then re-run. Exit 1.');
      process.exit(1);
    }
    console.log('[generate-catalog] 0 products fetched and no prior data — writing empty bootstrap files.');
  } else {
    // Partial results: keep prior sections when a fetch comes back empty.
    const prevCats = readJson(path.join(OUT, 'categories.json'));
    const prevPosts = readJson(path.join(OUT, 'homepage.json'))?.posts;
    if (categories.length === 0 && hasRows(prevCats)) categories = Array.isArray(prevCats) ? prevCats : [];
    if (posts.length === 0 && Array.isArray(prevPosts) && prevPosts.length > 0) posts = prevPosts;
  }

  // 1. catalog.json
  const catalogPath = path.join(OUT, 'catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    product_count: products.length,
    category_count: categories.length,
    post_count: posts.length,
    products,
  }, null, 0));
  console.log(`✅ catalog.json: ${(fs.statSync(catalogPath).size / 1024).toFixed(1)}KB (${products.length} products)`);

  // 2. homepage.json
  const homepagePath = path.join(OUT, 'homepage.json');
  const topProducts = products
    .filter((p) => Number(p.editor_score) > 0)
    .sort((a, b) => (Number(b.editor_score) || 0) - (Number(a.editor_score) || 0))
    .slice(0, 20);
  fs.writeFileSync(homepagePath, JSON.stringify({
    generated_at: new Date().toISOString(),
    categories,
    products: topProducts.map((p) => ({
      id: p.id, slug: p.slug, product_name: p.product_name,
      brand: p.brand, product_image: p.product_image, price: p.price,
      editor_score: p.editor_score, rating: p.rating, review_count: p.review_count,
      best_for: p.best_for,
    })),
    posts: posts.slice(0, 8),
  }, null, 0));
  console.log(`✅ homepage.json: ${(fs.statSync(homepagePath).size / 1024).toFixed(1)}KB`);

  // 3. categories.json
  const catsPath = path.join(OUT, 'categories.json');
  fs.writeFileSync(catsPath, JSON.stringify(categories, null, 0));
  console.log(`✅ categories.json: ${(fs.statSync(catsPath).size / 1024).toFixed(1)}KB (${categories.length} categories)`);

  // 4. brands.json (derived from products)
  const brandMap = new Map<string, { name: string; count: number }>();
  products.forEach((p) => {
    if (!p.brand) return;
    const existing = brandMap.get(p.brand) || { name: p.brand, count: 0 };
    existing.count++;
    brandMap.set(p.brand, existing);
  });
  const brands = Array.from(brandMap.values()).sort((a, b) => b.count - a.count);
  const brandsPath = path.join(OUT, 'brands.json');
  fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 0));
  console.log(`✅ brands.json: ${(fs.statSync(brandsPath).size / 1024).toFixed(1)}KB (${brands.length} brands)`);

  const totalSize = fs.readdirSync(OUT)
    .filter((f) => f.endsWith('.json'))
    .reduce((sum, f) => sum + fs.statSync(path.join(OUT, f)).size, 0);

  console.log(`\n=== Done ===`);
  console.log(`Total static data: ${(totalSize / 1024).toFixed(1)}KB`);
  console.log(`Products: ${products.length} | Categories: ${categories.length} | Posts: ${posts.length}`);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
