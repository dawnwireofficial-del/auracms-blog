#!/usr/bin/env npx tsx
/**
 * Batch Re-Import Script
 *
 * Fetches all published products missing gallery/detail_bullets from Amazon
 * via the server-side extractAmazonProductData function, then updates their
 * specs directly in Supabase. Preserves editorial fields.
 *
 * Usage:
 *   npx tsx scripts/batch-reimport.ts                    # re-import all missing
 *   npx tsx scripts/batch-reimport.ts --limit 20         # first 20 only
 *   npx tsx scripts/batch-reimport.ts --asin B0XXXXX     # single product
 *   npx tsx scripts/batch-reimport.ts --dry-run          # show what would be updated
 */

import { createClient } from '@supabase/supabase-js';
import { extractAmazonProductData } from '../server/amazon-extractor';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nzghdxvbrndzkkoqdlqw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1] || '50', 10) : 500;
const SINGLE_ASIN = args.includes('--asin') ? args[args.indexOf('--asin') + 1]?.toUpperCase() : null;

const ASSOCIATE_TAG = 'dawnwire-20';
const BATCH_SIZE = 3;       // concurrent Amazon fetches
const DELAY_MS = 2000;       // delay between batches
const MAX_RETRIES = 2;

interface ProductRow {
  id: string;
  asin: string;
  product_name: string;
  affiliate_url: string | null;
  amazon_url: string | null;
  price: number | null;
  original_price: number | null;
  rating: number | null;
  review_count: number | null;
  pros: string[] | null;
  cons: string[] | null;
  key_features: string[] | null;
  review_summary: string | null;
  best_for: string | null;
  final_verdict: string | null;
  editor_score: number | null;
  specs: any;
  gallery: string[] | null;
  brand: string | null;
  category_id: string | null;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function needsReimport(p: ProductRow): boolean {
  const specs = p.specs || {};
  const bullets = specs.detail_bullets || {};
  const gallery = specs.gallery || p.gallery || [];
  return gallery.length === 0 || Object.keys(bullets).length === 0;
}

function ensureTag(url: string): string {
  if (!url || !url.includes('amazon')) return url;
  if (url.includes('tag=dawnwire-20')) return url;
  if (url.includes('tag=')) return url.replace(/tag=[^&]+/, 'tag=dawnwire-20');
  return url + (url.includes('?') ? '&' : '?') + 'tag=dawnwire-20';
}

async function reimportOne(product: ProductRow, index: number, total: number): Promise<{ ok: boolean; changes: string[] }> {
  const asin = product.asin;
  const prefix = `[${index + 1}/${total}] ${asin}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`${prefix} Fetching from Amazon...${attempt > 0 ? ` (retry ${attempt})` : ''}`);

      const data = await extractAmazonProductData(asin, ASSOCIATE_TAG);
      
      // SAFETY: Never overwrite real data with AI-synthesized hallucinated data
      if (data.source === 'ai_synthesis') {
        console.log(`${prefix} AI synthesis returned (unreliable) - skipping to avoid overwriting real data`);
        return { ok: true, changes: [] };
      }
if (!data || !data.title) {
        console.log(`${prefix} No data returned from Amazon`);
        return { ok: false, changes: [] };
      }

      const changes: string[] = [];
      const existingSpecs = product.specs || {};

      // Build new specs object (merge, don't overwrite existing non-empty fields)
      const newSpecs: Record<string, any> = { ...existingSpecs };
      newSpecs.asin = asin;
      newSpecs.source = data.source || existingSpecs.source || 'reimport';

      // Gallery images
      const newGallery = (data.images || []).filter(Boolean) as string[];
      if (newGallery.length > 0) {
        const oldGallery = existingSpecs.gallery || product.gallery || [];
        if (newGallery.length > oldGallery.length || oldGallery.length === 0) {
          newSpecs.gallery = newGallery;
          changes.push(`gallery: ${oldGallery.length} → ${newGallery.length} images`);
        }
      }

            // Detail bullets (specs from product page) - prefer detailBullets over specifications
      const bullets = data.detailBullets && Object.keys(data.detailBullets).length > 1
        ? data.detailBullets
        : (data.specifications && Object.keys(data.specifications).length > 1 ? data.specifications : null);
      if (bullets) {
        const oldBullets = existingSpecs.detail_bullets || {};
        if (Object.keys(bullets).length > Object.keys(oldBullets).length || Object.keys(oldBullets).length === 0) {
          newSpecs.detail_bullets = bullets;
          changes.push('detail_bullets: ' + Object.keys(oldBullets).length + ' -> ' + Object.keys(bullets).length + ' keys');
        }
      }
      // Also store specifications in specs.details for the ProductDetailPage specs table
      if (data.specifications && Object.keys(data.specifications).length > 1) {
        if (!existingSpecs.details || Object.keys(existingSpecs.details || {}).length === 0) {
          newSpecs.details = data.specifications;
          changes.push('details: ' + Object.keys(data.specifications).length + ' keys');
        }
      }

      // Ingredients
      if (data.specifications?.ingredients && !existingSpecs.ingredients) {
        newSpecs.ingredients = data.specifications.ingredients;
        changes.push('ingredients: added');
      }

      // Unit info
      if (data.specifications?.unit_size && !existingSpecs.unit_size) {
        newSpecs.unit_size = data.specifications.unit_size;
        changes.push('unit_size: added');
      }

      // Review highlights
      const highlights = data.reviewHighlights || data.review_highlights;
      if (highlights && !existingSpecs.review_highlights) {
        newSpecs.review_highlights = highlights;
        changes.push('review_highlights: added');
      }

      // Review stats
      const stats = data.reviewStats || (existingSpecs.review_stats && existingSpecs.review_stats.average === 0 ? null : existingSpecs.review_stats);
      if (data.reviewStats && (!existingSpecs.review_stats || (existingSpecs.review_stats && existingSpecs.review_stats.average === 0))) {
        newSpecs.review_stats = data.reviewStats;
        changes.push('review_stats: average=' + data.reviewStats.average);
      }

      // Reviews
      if (data.reviews && data.reviews.length > 0 && (!existingSpecs.reviews || existingSpecs.reviews.length === 0)) {
        newSpecs.reviews = data.reviews;
        changes.push(`reviews: ${data.reviews.length} added`);
      }

      // Video
      if (data.videoUrl && !existingSpecs.video_url) {
        newSpecs.video_url = data.videoUrl;
        changes.push('video_url: added');
      }

      if (changes.length === 0) {
        console.log(`${prefix} No new data to update`);
        return { ok: true, changes: [] };
      }

      // Build update payload — only specs and gallery columns
      const updatePayload: Record<string, any> = {
        specs: newSpecs,
        updated_at: new Date().toISOString(),
      };

      // Update gallery column too if we got new images
      if (newSpecs.gallery) {
        updatePayload.gallery = newSpecs.gallery;
        // Also set product_image if empty
        if (!product.price || !product.price) {
          updatePayload.product_image = newSpecs.gallery[0];
        }
      }

      if (DRY_RUN) {
        console.log(`${prefix} DRY RUN — would update: ${changes.join(', ')}`);
        return { ok: true, changes };
      }

      const { error } = await sb.from('product_reviews')
        .update(updatePayload)
        .eq('id', product.id);

      if (error) {
        console.error(`${prefix} DB update error: ${error.message}`);
        return { ok: false, changes: [] };
      }

      console.log(`${prefix} Updated: ${changes.join(', ')}`);
      return { ok: true, changes };
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (attempt < MAX_RETRIES) {
        console.log(`${prefix} Error: ${msg}, retrying in ${DELAY_MS * 2}ms...`);
        await sleep(DELAY_MS * 2);
      } else {
        console.error(`${prefix} Failed after ${MAX_RETRIES + 1} attempts: ${msg}`);
        return { ok: false, changes: [] };
      }
    }
  }
  return { ok: false, changes: [] };
}

async function main() {
  console.log('=== Batch Re-Import Script ===');
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Associate tag: ${ASSOCIATE_TAG}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Fetch products
  let query = sb.from('product_reviews')
    .select('id, asin, product_name, affiliate_url, amazon_url, price, original_price, rating, review_count, pros, cons, key_features, review_summary, best_for, final_verdict, editor_score, specs, gallery, brand, category_id')
    .eq('status', 'published')
    .limit(1000);

  if (SINGLE_ASIN) {
    query = query.eq('asin', SINGLE_ASIN);
  }

  const { data: products, error } = await query;
  if (error || !products) {
    console.error('Failed to fetch products:', error?.message);
    process.exit(1);
  }

  console.log(`Total published products: ${products.length}`);

  // Filter to those needing re-import
  let queue = products.filter(needsReimport);
  if (SINGLE_ASIN) {
    queue = queue.filter(p => p.asin === SINGLE_ASIN);
  }

  // Ensure all have valid ASINs
  queue = queue.filter(p => p.asin && /^[A-Z0-9]{10}$/.test(p.asin));

  // Apply limit
  const limited = queue.slice(0, LIMIT);
  console.log(`Products needing re-import: ${queue.length} (processing ${limited.length})`);
  console.log('');

  let succeeded = 0;
  let failed = 0;
  let noChanges = 0;
  let totalChanges: string[] = [];

  // Process in batches
  for (let i = 0; i < limited.length; i += BATCH_SIZE) {
    const batch = limited.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((p, j) => reimportOne(p, i + j, limited.length))
    );

    for (const r of results) {
      if (r.ok && r.changes.length > 0) {
        succeeded++;
        totalChanges.push(...r.changes);
      } else if (r.ok) {
        noChanges++;
      } else {
        failed++;
      }
    }

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < limited.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`Total processed: ${limited.length}`);
  console.log(`Updated: ${succeeded}`);
  console.log(`No changes needed: ${noChanges}`);
  console.log(`Failed: ${failed}`);
  if (totalChanges.length > 0) {
    console.log(`\nChange breakdown:`);
    const counts: Record<string, number> = {};
    for (const c of totalChanges) {
      const key = c.split(':')[0];
      counts[key] = (counts[key] || 0) + 1;
    }
    for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k}: ${v}`);
    }
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
