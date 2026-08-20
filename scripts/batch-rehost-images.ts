#!/usr/bin/env npx tsx
/**
 * Batch Re-Host Images Script
 *
 * Downloads all product images from Amazon CDN (m.media-amazon.com)
 * and uploads them to imgbb for permanent storage. Updates the database
 * so images are served from imgbb URLs instead of Amazon CDN.
 *
 * This fixes Google Images indexing — images hosted on your own domain
 * (via imgbb) appear in Google Image search results.
 *
 * Usage: npx tsx scripts/batch-rehost-images.ts [--dry-run] [--limit N]
 */

import { createClient } from '@supabase/supabase-js';

const SB_URL = process.env.SUPABASE_URL || 'https://kbfngsmaikmuqplsoafw.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const IMGBB_KEY = process.env.IMGBB_API_KEY || '';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--limit') || '0');

const AMAZON_CDN = /^https?:\/\/(m\.media-amazon\.com|images-na\.ssl-images-amazon\.com)/i;

async function downloadAndUpload(url: string): Promise<string | null> {
  if (!IMGBB_KEY || !url.startsWith('http')) return null;
  try {
    // Download from Amazon CDN
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DawnWire/1.0)' },
    });
    if (!resp.ok) {
      console.log(`    ✗ Download failed: ${resp.status}`);
      return null;
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 100) {
      console.log(`    ✗ Image too small (${buf.length} bytes)`);
      return null;
    }
    const b64 = buf.toString('base64');
    const body = new URLSearchParams({ image: b64 });

    // Upload to imgbb
    const imgbb = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(20000),
    });
    const data: any = await imgbb.json();
    if (!data.success) {
      console.log(`    ✗ imgbb upload failed: ${JSON.stringify(data).substring(0, 200)}`);
      return null;
    }
    return data.data.url;
  } catch (e: any) {
    console.log(`    ✗ Error: ${e.message}`);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Batch Image Re-Host Script ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${LIMIT || 'ALL'}`);
  console.log(`imgbb key: ${IMGBB_KEY ? 'SET' : 'MISSING'}`);
  console.log('');

  if (!IMGBB_KEY) {
    console.error('ERROR: IMGBB_API_KEY env var not set. Cannot upload images.');
    process.exit(1);
  }

  const sb = createClient(SB_URL, SB_KEY);

  // Fetch all published products
  let query = sb.from('product_reviews')
    .select('id, product_name, slug, product_image, specs, gallery')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (LIMIT) query = query.limit(LIMIT);

  const { data: products, error } = await query;
  if (error) {
    console.error('DB error:', error);
    process.exit(1);
  }

  console.log(`Found ${products?.length || 0} published products\n`);

  let stats = { total: 0, uploaded: 0, skipped: 0, failed: 0, images: 0 };

  for (const p of products || []) {
    stats.total++;
    const name = (p.product_name || '').substring(0, 60);
    console.log(`[${stats.total}/${products?.length}] ${name}`);

    // Collect all Amazon CDN images for this product
    const imagesToUpload: { field: string; url: string }[] = [];

    // Main product image
    if (p.product_image && AMAZON_CDN.test(p.product_image)) {
      imagesToUpload.push({ field: 'product_image', url: p.product_image });
    }

    // Gallery images
    const specs = p.specs || {};
    const gallery: string[] = Array.isArray(specs.gallery) ? specs.gallery :
                              Array.isArray(p.gallery) ? p.gallery : [];
    for (const img of gallery) {
      if (img && typeof img === 'string' && AMAZON_CDN.test(img)) {
        imagesToUpload.push({ field: `gallery:${img}`, url: img });
      }
    }

    if (imagesToUpload.length === 0) {
      console.log('  → No Amazon CDN images to re-host');
      stats.skipped++;
      continue;
    }

    console.log(`  → ${imagesToUpload.length} images to re-host`);

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would upload: ${imagesToUpload.map(i => i.url.substring(0, 60)).join(', ')}`);
      stats.skipped++;
      continue;
    }

    // Upload main image first
    const mainImg = imagesToUpload.find(i => i.field === 'product_image');
    if (mainImg) {
      const newUrl = await downloadAndUpload(mainImg.url);
      if (newUrl) {
        console.log(`  ✓ product_image → ${newUrl.substring(0, 60)}`);
        await sb.from('product_reviews').update({ product_image: newUrl }).eq('id', p.id);
        stats.images++;
      } else {
        stats.failed++;
      }
      await sleep(500); // Rate limit
    }

    // Upload gallery images
    const galleryImgs = imagesToUpload.filter(i => i.field.startsWith('gallery:'));
    const newGallery: string[] = [];
    for (const img of galleryImgs) {
      // Check if already re-hosted
      if (!AMAZON_CDN.test(img.url)) {
        newGallery.push(img.url);
        continue;
      }
      const newUrl = await downloadAndUpload(img.url);
      newGallery.push(newUrl || img.url);
      if (newUrl) {
        console.log(`  ✓ gallery → ${newUrl.substring(0, 60)}`);
        stats.images++;
      } else {
        stats.failed++;
      }
      await sleep(500); // Rate limit
    }

    // Update specs.gallery with new URLs
    if (galleryImgs.length > 0) {
      const updatedSpecs = { ...specs, gallery: newGallery };
      await sb.from('product_reviews').update({ specs: updatedSpecs }).eq('id', p.id);
    }

    stats.uploaded++;
    console.log('');
  }

  console.log('\n=== Summary ===');
  console.log(`Total products: ${stats.total}`);
  console.log(`Uploaded: ${stats.uploaded}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Images re-hosted: ${stats.images}`);
}

main().catch(console.error);
