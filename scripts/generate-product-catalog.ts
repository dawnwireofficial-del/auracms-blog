#!/usr/bin/env npx tsx
/**
 * Generate Static Product Catalog
 * 
 * Fetches all product data from Supabase and generates static JSON files:
 * 1. public/data/catalog.json — Full product catalog (for API fallback)
 * 2. public/data/homepage.json — Homepage data (products, categories, posts)
 * 3. public/data/products/{id}/specs.json — Already migrated (heavy data)
 * 
 * These files let the site work even when Supabase is paused/unreachable.
 * Run as part of build process or on a schedule.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!SB_URL || !SB_KEY) {
  console.log('[generate-catalog] Skipping — no Supabase env vars (build-time)');
  process.exit(0);
}

const sb = createClient(SB_URL, SB_KEY);
const OUT = path.join(process.cwd(), 'public', 'data');

// Light columns only — no specs/gallery/reviews blobs
const LIGHT_COLS = 'id,slug,product_name,brand,product_image,price,original_price,rating,review_count,editor_score,best_for,status,created_at,updated_at,discount_percentage,stock_status,deal_badge,coupon_code,affiliate_url,category_id,asin,amazon_url,final_verdict,seo_title,seo_description,pros,cons,review_summary,key_features,seo_keywords,click_count,page_views';

const MEDIUM_COLS = 'id,slug,product_name,brand,product_image,price,original_price,rating,review_count,editor_score,best_for,status,created_at,updated_at,discount_percentage,stock_status,deal_badge,coupon_code,affiliate_url,category_id,asin,amazon_url,final_verdict,seo_title,seo_description,pros,cons,review_summary,key_features,seo_keywords,click_count,page_views,review_article';

interface CatalogProduct {
  id: string;
  slug: string;
  product_name: string;
  brand: string;
  product_image: string;
  price: string;
  original_price: string;
  rating: number;
  review_count: number;
  editor_score: number;
  best_for: string;
  status: string;
  created_at: string;
  updated_at: string;
  discount_percentage: number;
  stock_status: string;
  deal_badge: string;
  coupon_code: string;
  affiliate_url: string;
  category_id: string;
  asin: string;
  amazon_url: string;
  final_verdict: string;
  seo_title: string;
  seo_description: string;
  pros: string[];
  cons: string[];
  review_summary: string;
  key_features: string[];
  seo_keywords: string;
  click_count: number;
  page_views: number;
}

async function fetchAllProducts(): Promise<CatalogProduct[]> {
  const products: CatalogProduct[] = [];
  const BATCH = 200;
  let offset = 0;
  
  while (true) {
    const { data, error } = await sb.from('product_reviews')
      .select(LIGHT_COLS)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(offset, offset + BATCH - 1);
    
    if (error) {
      console.error(`Query error at offset ${offset}:`, error.message);
      break;
    }
    
    if (!data || data.length === 0) break;
    products.push(...data as CatalogProduct[]);
    console.log(`  Fetched ${products.length} products...`);
    
    if (data.length < BATCH) break;
    offset += BATCH;
    
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 200));
  }
  
  return products;
}

async function fetchCategories() {
  const { data } = await sb.from('categories')
    .select('id,slug,name,image,status,parent_id')
    .eq('status', 'active')
    .order('name');
  return data || [];
}

async function fetchPosts() {
  const { data } = await sb.from('posts')
    .select('id,slug,title,excerpt,featured_image,category_id,readingTime,created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

async function main() {
  console.log('=== Generating Static Product Catalog ===\n');
  
  // Ensure output directory exists
  fs.mkdirSync(OUT, { recursive: true });
  
  // 1. Fetch all data in parallel
  console.log('Fetching products...');
  const products = await fetchAllProducts();
  console.log(`  → ${products.length} products fetched\n`);
  
  console.log('Fetching categories...');
  const categories = await fetchCategories();
  console.log(`  → ${categories.length} categories\n`);
  
  console.log('Fetching posts...');
  const posts = await fetchPosts();
  console.log(`  → ${posts.length} posts\n`);
  
  // 2. Generate catalog.json — full product list with all light fields
  const catalogPath = path.join(OUT, 'catalog.json');
  fs.writeFileSync(catalogPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    product_count: products.length,
    category_count: categories.length,
    post_count: posts.length,
    products,
  }, null, 0));
  console.log(`✅ catalog.json: ${(fs.statSync(catalogPath).size / 1024).toFixed(1)}KB`);
  
  // 3. Generate homepage.json — SSR data
  const homepagePath = path.join(OUT, 'homepage.json');
  const topProducts = products
    .filter(p => p.editor_score > 0)
    .sort((a, b) => (b.editor_score || 0) - (a.editor_score || 0))
    .slice(0, 20);
  
  fs.writeFileSync(homepagePath, JSON.stringify({
    generated_at: new Date().toISOString(),
    categories,
    products: topProducts.map(p => ({
      id: p.id, slug: p.slug, product_name: p.product_name,
      brand: p.brand, product_image: p.product_image, price: p.price,
      editor_score: p.editor_score, rating: p.rating, review_count: p.review_count,
      best_for: p.best_for,
    })),
    posts: posts.slice(0, 8),
  }, null, 0));
  console.log(`✅ homepage.json: ${(fs.statSync(homepagePath).size / 1024).toFixed(1)}KB`);
  
  // 4. Generate categories.json
  const catsPath = path.join(OUT, 'categories.json');
  fs.writeFileSync(catsPath, JSON.stringify(categories, null, 0));
  console.log(`✅ categories.json: ${(fs.statSync(catsPath).size / 1024).toFixed(1)}KB`);
  
  // 5. Generate brands.json from products
  const brandMap = new Map<string, { name: string; count: number }>();
  products.forEach(p => {
    if (!p.brand) return;
    const existing = brandMap.get(p.brand) || { name: p.brand, count: 0 };
    existing.count++;
    brandMap.set(p.brand, existing);
  });
  const brands = Array.from(brandMap.values()).sort((a, b) => b.count - a.count);
  const brandsPath = path.join(OUT, 'brands.json');
  fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 0));
  console.log(`✅ brands.json: ${(fs.statSync(brandsPath).size / 1024).toFixed(1)}KB (${brands.length} brands)`);
  
  // 6. Summary
  const totalSize = fs.readdirSync(OUT)
    .filter(f => f.endsWith('.json'))
    .reduce((sum, f) => sum + fs.statSync(path.join(OUT, f)).size, 0);
  
  console.log(`\n=== Done ===`);
  console.log(`Total static data: ${(totalSize / 1024).toFixed(1)}KB`);
  console.log(`Products: ${products.length} | Categories: ${categories.length} | Posts: ${posts.length}`);
  console.log(`\nFiles written to: ${OUT}/`);
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
