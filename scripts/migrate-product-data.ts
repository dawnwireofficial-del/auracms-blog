#!/usr/bin/env npx tsx
/**
 * Migration: Move heavy product data from Supabase to static JSON files (v3)
 * Uses Management API with single-row queries to avoid timeout
 */

import * as fs from 'fs';
import * as path from 'path';

const SB_REF = process.env.SUPABASE_PROJECT_REF || 'nzghdxvbrndzkkoqdlqw';
const SB_TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN || '';
if (!SB_TOKEN) { console.error('Set SUPABASE_MANAGEMENT_TOKEN env var'); process.exit(1); }
const DATA_DIR = path.join(process.cwd(), 'public', 'data', 'products');
const PROGRESS_FILE = path.join(process.cwd(), 'scripts', 'migrate-progress.json');

const HEAVY_SPECS_KEYS = ['gallery', 'reviews', 'detail_bullets', 'details', 'review_highlights', 'ingredients', 'best_sellers_rank_detail', 'unit_size', 'unit_price'];

function loadProgress(): Record<string, boolean> {
  try { return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8')); } catch { return {}; }
}

function saveProgress(progress: Record<string, boolean>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function dbQuery(query: string, retries = 3): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch(
        `https://api.supabase.com/v1/projects/${SB_REF}/database/query`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${SB_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(60000),
        }
      );
      if (!resp.ok) {
        const text = await resp.text();
        if (i < retries) { await new Promise(r => setTimeout(r, 5000 * (i + 1))); continue; }
        throw new Error(`HTTP ${resp.status}: ${text.substring(0, 200)}`);
      }
      return await resp.json();
    } catch (err: any) {
      if (i < retries) { await new Promise(r => setTimeout(r, 5000 * (i + 1))); continue; }
      throw err;
    }
  }
}

async function main() {
  console.log('=== Product Data Migration v3 ===\n');
  const progress = loadProgress();
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Step 1: Get all product IDs (lightweight query)
  console.log('Step 1: Fetching product IDs...');
  let allIds: string[] = [];
  try {
    // Fetch in pages to avoid timeout
    let offset = 0;
    const PAGE = 200;
    while (true) {
      const rows = await dbQuery(`SELECT id FROM product_reviews ORDER BY created_at DESC LIMIT ${PAGE} OFFSET ${offset}`);
      if (!rows || rows.length === 0) break;
      allIds.push(...rows.map((r: any) => r.id));
      offset += PAGE;
      if (rows.length < PAGE) break;
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err: any) {
    console.error(`Failed to fetch IDs: ${err.message}`);
    // Fallback: try getting all at once
    try {
      const rows = await dbQuery(`SELECT id FROM product_reviews`);
      allIds = rows.map((r: any) => r.id);
    } catch (err2: any) {
      console.error(`Fallback also failed: ${err2.message}. Exiting.`);
      return;
    }
  }
  console.log(`Found ${allIds.length} products total\n`);

  // Step 2: Filter out already-migrated
  const remaining = allIds.filter(id => !progress[id] && !fs.existsSync(path.join(DATA_DIR, id, 'specs.json')));
  console.log(`Already migrated: ${allIds.length - remaining.length}`);
  console.log(`Remaining: ${remaining.length}\n`);

  if (remaining.length === 0) {
    console.log('All products already migrated!');
    return;
  }

  // Step 3: Migrate each product individually (most reliable with Management API)
  let migrated = 0, failed = 0, totalBytes = 0;

  for (let i = 0; i < remaining.length; i++) {
    const id = remaining[i];
    try {
      // Single row query - only fetch heavy fields
      const rows = await dbQuery(
        `SELECT specs::text, key_features::text, review_summary, pros::text, cons::text, review_article, gallery::text FROM product_reviews WHERE id = '${id}' LIMIT 1`
      );

      if (!rows || rows.length === 0) {
        progress[id] = true; // Mark as processed even if empty
        continue;
      }

      const row = rows[0];
      
      let specs: Record<string, any> = {};
      try { specs = typeof row.specs === 'string' ? JSON.parse(row.specs) : (row.specs || {}); } catch {}
      
      let keyFeatures: any = null;
      try { keyFeatures = typeof row.key_features === 'string' ? JSON.parse(row.key_features) : row.key_features; } catch { keyFeatures = row.key_features; }
      
      let pros: any = null;
      try { pros = typeof row.pros === 'string' ? JSON.parse(row.pros) : row.pros; } catch { pros = row.pros; }
      
      let cons: any = null;
      try { cons = typeof row.cons === 'string' ? JSON.parse(row.cons) : row.cons; } catch { cons = row.cons; }
      
      let gallery: any = null;
      try { gallery = typeof row.gallery === 'string' ? JSON.parse(row.gallery) : row.gallery; } catch { gallery = row.gallery; }

      const heavyData: Record<string, any> = {};
      
      for (const key of HEAVY_SPECS_KEYS) {
        if (specs[key] !== undefined && specs[key] !== null) heavyData[key] = specs[key];
      }
      if (keyFeatures) heavyData.key_features = keyFeatures;
      if (row.review_summary) heavyData.review_summary = row.review_summary;
      if (pros) heavyData.pros = pros;
      if (cons) heavyData.cons = cons;
      if (row.review_article) heavyData.review_article = row.review_article;
      if (gallery) heavyData.root_gallery = gallery;
      
      const jsonStr = JSON.stringify(heavyData);
      if (Object.keys(heavyData).length === 0) {
        progress[id] = true;
        continue;
      }
      
      const outDir = path.join(DATA_DIR, id);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'specs.json'), jsonStr);
      
      migrated++;
      totalBytes += jsonStr.length;
      progress[id] = true;
      
      // Progress update every 10 products
      if ((i + 1) % 10 === 0) {
        saveProgress(progress);
        console.log(`  [${i + 1}/${remaining.length}] migrated=${migrated} failed=${failed} total=${(totalBytes / 1024 / 1024).toFixed(1)}MB`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
      
    } catch (err: any) {
      failed++;
      console.error(`  ✗ ${id}: ${err.message?.substring(0, 80)}`);
      // Longer delay after errors
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  saveProgress(progress);
  console.log(`\n=== Migration Complete ===`);
  console.log(`Migrated: ${migrated} products`);
  console.log(`Failed: ${failed} products`);
  console.log(`Data saved: ${(totalBytes / 1024 / 1024).toFixed(1)}MB moved to static files`);
  console.log(`Total migrated: ${Object.keys(progress).length} products`);
}

main().catch(console.error);
