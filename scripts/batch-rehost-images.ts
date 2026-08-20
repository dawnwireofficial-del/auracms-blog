#!/usr/bin/env npx tsx
/**
 * Batch Re-Host Images Script (v2)
 *
 * Downloads product images from Amazon CDN and uploads to catbox.moe
 * for permanent storage. Updates the database so images are served
 * from catbox URLs instead of Amazon CDN.
 *
 * Uses catbox.moe as primary (free, permanent, no rate limits on uploads).
 * Falls back to imgbb if catbox fails.
 *
 * Usage: npx tsx scripts/batch-rehost-images.ts [--dry-run] [--limit N] [--resume]
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

import * as dotenv from 'dotenv';
dotenv.config();
const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const IMGBB_KEY = process.env.IMGBB_API_KEY || '';

const DRY_RUN = process.argv.includes('--dry-run');
const RESUME = process.argv.includes('--resume');
const LIMIT = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--limit') || '0');

const AMAZON_CDN = /^https?:\/\/(m\.media-amazon\.com|images-na\.ssl-images-amazon\.com)/i;
const ALREADY_HOSTED = /catbox\.moe|ibb\.co|freeimage\.host|files\.catbox\.moe/i;
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, 'rehost-progress.json');

// Track completed product IDs for resume
function loadCompleted(): Set<string> {
  try {
    if (RESUME && fs.existsSync(LOG_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
      return new Set(data.completed || []);
    }
  } catch {}
  return new Set();
}

function saveCompleted(completed: Set<string>) {
  fs.writeFileSync(LOG_FILE, JSON.stringify({ completed: [...completed], updatedAt: new Date().toISOString() }));
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadToCatbox(buf: Buffer): Promise<string | null> {
  try {
    const blob = new Blob([buf], { type: 'image/jpeg' });
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', blob, 'product.jpg');
    const resp = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: fd,
      signal: AbortSignal.timeout(30000),
    });
    const url = (await resp.text()).trim();
    if (url.startsWith('http')) return url;
    return null;
  } catch {
    return null;
  }
}

async function uploadToImgbb(b64: string): Promise<string | null> {
  if (!IMGBB_KEY) return null;
  try {
    const body = new URLSearchParams({ image: b64 });
    const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(20000),
    });
    const data: any = await resp.json();
    if (data.success) return data.data.url;
  } catch {}
  return null;
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DawnWire/1.0)' },
    });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 100) return null;
    return buf;
  } catch {
    return null;
  }
}

async function rehostImage(url: string): Promise<string | null> {
  const buf = await downloadImage(url);
  if (!buf) return null;

  // Try catbox first (no rate limits)
  const catUrl = await uploadToCatbox(buf);
  if (catUrl) return catUrl;

  // Fallback to imgbb
  const b64 = buf.toString('base64');
  const imgbbUrl = await uploadToImgbb(b64);
  if (imgbbUrl) return imgbbUrl;

  return null;
}

async function main() {
  console.log('=== Batch Image Re-Host Script v2 (catbox.moe primary) ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Resume: ${RESUME ? 'YES' : 'NO'}`);
  console.log(`Limit: ${LIMIT || 'ALL'}`);
  console.log('');

  const sb = createClient(SB_URL, SB_KEY);
  const completed = RESUME ? loadCompleted() : new Set<string>();
  if (RESUME && completed.size > 0) {
    console.log(`Resuming — ${completed.size} products already done\n`);
  }

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

    // Skip already completed in resume mode
    if (completed.has(p.id)) {
      stats.skipped++;
      continue;
    }

    const name = (p.product_name || '').substring(0, 60);
    console.log(`[${stats.total}/${products?.length}] ${name}`);

    // Check if main image already hosted
    const mainNeedsHost = p.product_image && AMAZON_CDN.test(p.product_image);

    // Check gallery
    const specs = p.specs || {};
    const gallery: string[] = Array.isArray(specs.gallery) ? specs.gallery :
                              Array.isArray(p.gallery) ? p.gallery : [];
    const galleryToHost = gallery.filter(img => typeof img === 'string' && AMAZON_CDN.test(img));

    if (!mainNeedsHost && galleryToHost.length === 0) {
      console.log('  → All images already hosted');
      completed.add(p.id);
      saveCompleted(completed);
      stats.skipped++;
      continue;
    }

    const totalImages = (mainNeedsHost ? 1 : 0) + galleryToHost.length;
    console.log(`  → ${totalImages} images to re-host`);

    if (DRY_RUN) {
      stats.skipped++;
      continue;
    }

    let anyFailed = false;

    // Upload main product image
    if (mainNeedsHost && p.product_image) {
      const newUrl = await rehostImage(p.product_image);
      if (newUrl) {
        console.log(`  ✓ product_image → ${newUrl.substring(0, 70)}`);
        await sb.from('product_reviews').update({ product_image: newUrl }).eq('id', p.id);
        stats.images++;
      } else {
        console.log(`  ✗ product_image failed`);
        anyFailed = true;
      }
      await sleep(2000); // 2 second delay between uploads
    }

    // Upload gallery images
    if (galleryToHost.length > 0) {
      const newGallery = [...gallery];
      let galleryChanged = false;

      for (const img of galleryToHost) {
        const idx = newGallery.indexOf(img);
        const newUrl = await rehostImage(img);
        if (newUrl) {
          console.log(`  ✓ gallery → ${newUrl.substring(0, 70)}`);
          newGallery[idx] = newUrl;
          stats.images++;
          galleryChanged = true;
        } else {
          console.log(`  ✗ gallery item failed`);
          anyFailed = true;
        }
        await sleep(2000); // 2 second delay between uploads
      }

      if (galleryChanged) {
        const updatedSpecs = { ...specs, gallery: newGallery };
        await sb.from('product_reviews').update({ specs: updatedSpecs }).eq('id', p.id);
      }
    }

    if (!anyFailed) {
      completed.add(p.id);
      saveCompleted(completed);
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
