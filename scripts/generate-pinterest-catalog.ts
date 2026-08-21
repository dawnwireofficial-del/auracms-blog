#!/usr/bin/env npx tsx
/**
 * Pinterest Product Catalog CSV Generator
 *
 * Generates a Pinterest-compatible CSV feed from the product database.
 * Uses affiliate URLs with proper UTM tracking for Pinterest attribution.
 *
 * Pinterest CSV format: https://developers.pinterest.com/docs/shopping/setup-catalog/
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SB_URL = process.env.SUPABASE_URL!;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
const BASE_URL = 'https://www.dawnwire.com';

// Pinterest-recommended category mapping
const CATEGORY_MAP: Record<string, string> = {
  'electronics': 'Electronics & Accessories',
  'beauty': 'Beauty & Personal Care',
  'personal care': 'Beauty & Personal Care',
  'home': 'Home Decor',
  'kitchen': 'Kitchen & Dining',
  'fashion': 'Clothing & Accessories',
  'health': 'Health & Wellness',
  'sports': 'Sports & Outdoors',
  'outdoors': 'Sports & Outdoors',
  'toys': 'Toys & Games',
  'games': 'Toys & Games',
  'automotive': 'Automotive',
  'office': 'Office Supplies',
  'baby': 'Baby Products',
  'pet': 'Pet Supplies',
  'garden': 'Garden & Outdoor',
  'tools': 'Tools & Home Improvement',
  'software': 'Software',
  'ai': 'Software',
  'computer': 'Electronics & Accessories',
  'laptop': 'Electronics & Accessories',
  'phone': 'Electronics & Accessories',
  'headphone': 'Electronics & Accessories',
  'camera': 'Electronics & Accessories',
};

function mapCategory(productType: string, category: string): string {
  const text = `${productType || ''} ${category || ''}`.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (text.includes(key)) return val;
  }
  return 'Home & Living';
}

function buildPinterestUrl(originalUrl: string, productId: string): string {
  const url = new URL(originalUrl);
  url.searchParams.set('utm_source', 'Pinterest');
  url.searchParams.set('utm_medium', 'organic');
  url.searchParams.set('utm_campaign', 'product_catalog');
  url.searchParams.set('utm_content', productId);
  return url.toString();
}

function buildPinTitle(name: string, brand: string, bestFor: string): string {
  const b = brand || '';
  const prefix = b ? `${b} ` : '';
  const suffix = bestFor ? ` — Best for ${bestFor}` : '';
  const maxLen = 100;
  const title = `${prefix}${name}${suffix}`;
  return title.length > maxLen ? title.substring(0, maxLen - 3) + '...' : title;
}

function buildPinDescription(name: string, brand: string, score: number, verdict: string, bestFor: string): string {
  const parts: string[] = [];
  if (brand) parts.push(`${brand} ${name}`);
  else parts.push(name);
  if (bestFor) parts.push(`Great for: ${bestFor}`);
  if (score > 0) parts.push(`DawnWire Score: ${score}/10`);
  if (verdict) parts.push(verdict.substring(0, 200));
  parts.push('Reviewed by DawnWire — independent product research and buying guides.');
  parts.push('DawnWire may earn a commission from qualifying purchases.');
  return parts.join('. ');
}

function escapeCSV(value: string): string {
  if (!value) return '';
  // Wrap in quotes if contains comma, quote, or newline
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function main() {
  console.log('=== Pinterest Catalog CSV Generator ===\n');

  const sb = createClient(SB_URL, SB_KEY);

  // Fetch all published products
  console.log('Fetching products from Supabase...');
  const { data: products, error } = await sb
    .from('product_reviews')
    .select(`
      id, slug, product_name, brand, product_image, price, original_price,
      rating, review_count, editor_score, best_for, status,
      category_id, affiliate_url, amazon_url, seo_title, seo_description,
      final_verdict, discount_percentage, stock_status, deal_badge, asin
    `)
    .eq('status', 'published')
    .order('editor_score', { ascending: false });

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${products?.length || 0} published products\n`);

  // Fetch categories for mapping
  const { data: categories } = await sb
    .from('categories')
    .select('id, name, slug');

  const catMap = new Map<string, string>();
  (categories || []).forEach((c: any) => catMap.set(c.id, c.name));

  // Pinterest CSV headers
  const headers = [
    'id',
    'item_group_id',
    'title',
    'description',
    'link',
    'image_link',
    'price',
    'availability',
    'condition',
    'google_product_category',
    'product_type',
    'additional_image_link',
    'sale_price',
    'brand',
    'gender',
    'age_group',
    'size',
    'size_type',
    'shipping',
    'custom_label_0',
    'adwords_redirect',
  ];

  const rows: string[] = [headers.join(',')];

  let processed = 0;
  let skipped = 0;

  for (const p of products || []) {
    const name = p.product_name || '';
    if (!name) { skipped++; continue; }

    const brand = p.brand || '';
    const price = parseFloat(String(p.price || '0').replace(/[^0-9.]/g, ''));
    const origPrice = parseFloat(String(p.original_price || '0').replace(/[^0-9.]/g, ''));
    const hasDiscount = origPrice > price && price > 0;

    // Product URL with Pinterest UTM tracking
    const productUrl = `${BASE_URL}/products/${p.slug}`;
    const trackingUrl = buildPinterestUrl(productUrl, p.id);

    // Image — use proxy for Pinterest (raw Amazon URLs may be blocked)
    const imageUrl = p.product_image
      ? `${BASE_URL}/api/public/image-proxy?url=${encodeURIComponent(p.product_image)}`
      : '';

    // Category mapping
    const catName = catMap.get(p.category_id) || '';
    const googleCategory = mapCategory(p.best_for || '', catName);
    const productType = catName || p.best_for || '';

    // Availability — affiliate products always "in stock" unless marked otherwise
    const availability = p.stock_status === 'out_of_stock' ? 'out of stock' : 'in stock';

    // Description
    const description = buildPinDescription(name, brand, p.editor_score || 0, p.final_verdict || '', p.best_for || '');

    // Title — optimized for Pinterest search
    const title = buildPinTitle(name, brand, p.best_for || '');

    // Custom label — for Pinterest reporting
    const customLabel = p.deal_badge ? 'deal' : p.editor_score >= 8 ? 'top_rated' : 'standard';

    const row = [
      escapeCSV(p.id),
      escapeCSV(p.id), // item_group_id = same (no variants)
      escapeCSV(title),
      escapeCSV(description),
      escapeCSV(trackingUrl),
      escapeCSV(imageUrl),
      price > 0 ? String(price) : '',
      escapeCSV(availability),
      'new',
      escapeCSV(googleCategory),
      escapeCSV(productType),
      '', // additional_image_link
      hasDiscount ? String(origPrice) : '',
      escapeCSV(brand),
      'unisex',
      'adult',
      '',
      '',
      '', // shipping (affiliate — no DawnWire shipping)
      escapeCSV(customLabel),
      escapeCSV(trackingUrl), // adwords_redirect = same tracking URL
    ].join(',');

    rows.push(row);
    processed++;
  }

  // Write CSV
  const dateStr = new Date().toISOString().split('T')[0];
  const csvPath = path.join(process.cwd(), 'public', 'data', `pinterest-catalog-${dateStr}.csv`);
  const latestPath = path.join(process.cwd(), 'public', 'data', 'pinterest-catalog-latest.csv');

  // Ensure directory exists
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });

  const csvContent = rows.join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  fs.writeFileSync(latestPath, csvContent, 'utf-8');

  console.log(`✅ Pinterest catalog CSV generated`);
  console.log(`   📁 ${csvPath}`);
  console.log(`   📁 ${latestPath}`);
  console.log(`   📊 Products: ${processed} (skipped: ${skipped})`);
  console.log(`   📐 File size: ${(Buffer.byteLength(csvContent) / 1024).toFixed(1)} KB`);
  console.log(`\n   Upload to Pinterest > Catalogs > Add products > CSV file`);
  console.log(`   URL: ${BASE_URL}/data/pinterest-catalog-latest.csv`);
}

main().catch(e => { console.error(e); process.exit(1); });
