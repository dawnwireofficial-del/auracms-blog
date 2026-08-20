#!/usr/bin/env npx tsx
/**
 * Migration: Move heavy product data from Supabase to static JSON files
 * 
 * Uses the public API (which already handles specs efficiently) to fetch
 * product data, then writes heavy fields to static JSON files.
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'https://www.dawnwire.com';
const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'products');
const PROGRESS_FILE = path.join(process.cwd(), 'scripts', 'migrate-progress.json');

function loadProgress(): Record<string, boolean> {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, boolean>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function fetchJson(url: string): Promise<any> {
  const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

async function main() {
  console.log('=== Product Data Migration (API-based) ===\n');
  
  const progress = loadProgress();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  
  // Step 1: Get all product IDs and basic info from the light endpoint
  console.log('Step 1: Fetching product list...');
  const listResp = await fetchJson(`${API_BASE}/api/public/product-reviews?light=1&limit=1000`);
  const productList = listResp.data || listResp;
  console.log(`Found ${productList.length} products\n`);
  
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  let totalSaved = 0;
  
  // Step 2: For each product, fetch full data and extract heavy fields
  console.log('Step 2: Migrating product data...');
  
  for (let i = 0; i < productList.length; i++) {
    const p = productList[i];
    const id = p.id;
    const slug = p.slug;
    const name = (p.product_name || '').substring(0, 60);
    
    // Check if already migrated
    const jsonPath = path.join(DATA_DIR, id, 'specs.json');
    if (fs.existsSync(jsonPath) || progress[id]) {
      skipped++;
      continue;
    }
    
    try {
      // Fetch full product data via slug endpoint
      const fullData = await fetchJson(`${API_BASE}/api/public/product-reviews/slug/${slug}`);
      
      // Extract heavy data
      const specs = fullData.specs || {};
      const heavyData: Record<string, any> = {};
      
      // From specs JSONB — gallery, reviews, details
      if (specs.gallery) heavyData.gallery = specs.gallery;
      if (specs.reviews) heavyData.reviews = specs.reviews;
      if (specs.detail_bullets) heavyData.detail_bullets = specs.detail_bullets;
      if (specs.details) heavyData.details = specs.details;
      if (specs.review_highlights) heavyData.review_highlights = specs.review_highlights;
      if (specs.ingredients) heavyData.ingredients = specs.ingredients;
      if (specs.best_sellers_rank_detail) heavyData.best_sellers_rank_detail = specs.best_sellers_rank_detail;
      if (specs.unit_size) heavyData.unit_size = specs.unit_size;
      if (specs.unit_price) heavyData.unit_price = specs.unit_price;
      
      // From root columns
      if (fullData.key_features) heavyData.key_features = fullData.key_features;
      if (fullData.review_summary) heavyData.review_summary = fullData.review_summary;
      if (fullData.pros) heavyData.pros = fullData.pros;
      if (fullData.cons) heavyData.cons = fullData.cons;
      if (fullData.review_article) heavyData.review_article = fullData.review_article;
      if (fullData.gallery) heavyData.root_gallery = fullData.gallery;
      
      // Check size
      const jsonStr = JSON.stringify(heavyData);
      if (jsonStr.length < 200) {
        skipped++;
        continue;
      }
      
      // Write JSON file
      const outDir = path.join(DATA_DIR, id);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(jsonPath, jsonStr);
      
      // Save to Supabase — strip heavy fields from specs
      const slimSpecs: Record<string, any> = {};
      for (const [key, val] of Object.entries(specs)) {
        if (!['gallery', 'reviews', 'detail_bullets', 'details', 'review_highlights', 'ingredients', 'best_sellers_rank_detail', 'unit_size', 'unit_price'].includes(key)) {
          slimSpecs[key] = val;
        }
      }
      
      // Use the admin update endpoint to strip heavy fields
      // For now, just write the JSON — DB update comes later
      
      migrated++;
      totalSaved += jsonStr.length;
      progress[id] = true;
      
      if (migrated % 10 === 0) {
        saveProgress(progress);
        console.log(`  [${migrated}/${productList.length}] ✓ ${name} → ${(jsonStr.length / 1024).toFixed(1)}KB`);
      } else {
        process.stdout.write('.');
      }
      
      // Small delay to not overwhelm the API
      await new Promise(r => setTimeout(r, 100));
      
    } catch (err: any) {
      failed++;
      console.error(`\n  ✗ ${name}: ${err.message}`);
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  saveProgress(progress);
  
  console.log(`\n\n=== Migration Complete ===`);
  console.log(`Migrated: ${migrated} products`);
  console.log(`Skipped: ${skipped} products (already done)`);
  console.log(`Failed: ${failed} products`);
  console.log(`Data saved: ${(totalSaved / 1024 / 1024).toFixed(1)}MB moved to static files`);
  console.log(`Files written to: ${DATA_DIR}`);
}

main().catch(console.error);
