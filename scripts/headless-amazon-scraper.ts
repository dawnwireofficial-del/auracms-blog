/**
 * Amazon Product Scraper & Importer
 *
 * Uses the server-side fetch + regex extractor (scrapeAmazonHtml) to scrape
 * Amazon product pages. FAR more reliable than headless browser for Amazon.
 * Playwright is optionally available for JS-rendered content (video URLs).
 *
 * Extracts product data and POSTs to the DawnWire API for import.
 *
 * Usage:
 *   npx tsx scripts/headless-amazon-scraper.ts --asins B0XXXXX,B0YYYYY
 *   npx tsx scripts/headless-amazon-scraper.ts --urls "https://www.amazon.com/dp/B0XXXXX"
 *   npx tsx scripts/headless-amazon-scraper.ts --file asins.txt
 *   npx tsx scripts/headless-amazon-scraper.ts --asins B0XXXXX --dry-run
 *
 * Environment variables:
 *   DAWNWIRE_API_URL   - API base URL (default: https://www.dawnwire.com)
 *   DAWNWIRE_API_TOKEN - Admin API token for authentication
 *   IMGBB_API_KEY      - Upload images to imgbb for permanent storage
 */

import * as fs from 'fs';
import { extractAmazonProductData } from '../server/amazon-extractor';

const API_URL = process.env.DAWNWIRE_API_URL || 'https://www.dawnwire.com';
const API_TOKEN = process.env.DAWNWIRE_API_TOKEN || '';
const IMGBB_KEY = process.env.IMGBB_API_KEY || '';

interface CliArgs {
  asins: string[];
  urls: string[];
  file: string | null;
  dryRun: boolean;
  headless: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { asins: [], urls: [], file: null, dryRun: false, headless: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--asins' && args[i + 1]) {
      result.asins = args[++i].split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    } else if (args[i] === '--urls' && args[i + 1]) {
      result.urls = args[++i].split(',').map(s => s.trim()).filter(Boolean);
    } else if (args[i] === '--file' && args[i + 1]) {
      result.file = args[++i];
    } else if (args[i] === '--dry-run') {
      result.dryRun = true;
    } else if (args[i] === '--headless') {
      result.headless = true;
    }
  }
  if (result.file) {
    const content = fs.readFileSync(result.file, 'utf-8');
    for (const line of content.split('\n').map(l => l.trim()).filter(Boolean)) {
      if (/^[A-Z0-9]{10}$/.test(line)) {
        result.asins.push(line);
      } else if (line.includes('amazon.')) {
        result.urls.push(line);
      }
    }
  }
  return result;
}

function extractAsin(s: string): string {
  const m = s.match(/(?:\/dp\/|product\/|ASIN\/|asin=)([A-Z0-9]{10})(?:\/|$|[?&])/i);
  return m ? m[1].toUpperCase() : /^[A-Z0-9]{10}$/.test(s) ? s : '';
}

async function uploadToImgBB(imageUrl: string): Promise<string | null> {
  if (!IMGBB_KEY || !imageUrl.startsWith('http')) return null;
  try {
    const resp = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DawnWire/1.0)' },
    });
    if (!resp.ok) return null;
    const b64 = Buffer.from(await resp.arrayBuffer()).toString('base64');
    const body = new URLSearchParams({ image: b64 });
    const imgbb = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body, signal: AbortSignal.timeout(15000),
    });
    const data: any = await imgbb.json();
    return data.success ? data.data.url : null;
  } catch { return null; }
}

async function importProduct(product: any): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/admin/seo/product-reviews/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}) },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      console.error(`    API error ${res.status}: ${await res.text().catch(() => '')}`);
      return false;
    }
    const data = await res.json();
    console.log(`    Imported: ${data.product_name || data.id} (${data.slug})`);
    return true;
  } catch (err) {
    console.error(`    Network error: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

async function main() {
  const { asins: argAsins, urls: argUrls, file, dryRun, headless } = parseArgs();
  const asins = [...argAsins];

  for (const url of argUrls) {
    const asin = extractAsin(url);
    if (asin && !asins.includes(asin)) asins.push(asin);
  }

  if (asins.length === 0) {
    console.error('No ASINs found. Provide --asins, --urls, or --file.');
    console.error('Usage: npx tsx scripts/headless-amazon-scraper.ts --asins B0XXXXX,B0YYYYY');
    process.exit(1);
  }

  if (dryRun) {
    console.log(`\nDRY RUN — ${asins.length} ASINs ready:`);
    for (const a of asins) console.log(`  ${a}`);
    console.log(`  ImgBB upload: ${!!IMGBB_KEY}`);
    console.log(`  API: ${API_URL}`);
    return;
  }

  if (!API_TOKEN) {
    console.warn('Warning: DAWNWIRE_API_TOKEN not set. API calls will likely fail.');
  }

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < asins.length; i++) {
    const asin = asins[i];
    console.log(`\n[${i + 1}/${asins.length}] ${asin}...`);

    try {
      const data = await extractAmazonProductData(asin, 'dawnwire-20');
      if (!data || !data.title) {
        console.warn(`  No data returned for ${asin}`);
        failed++;
        continue;
      }

      const product: Record<string, any> = {
        product_name: data.title,
        brand: data.brand || '',
        price: String(data.currentPrice || ''),
        original_price: String(data.referencePrice || ''),
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
        product_image: data.mainImage || '',
        gallery: data.images || [],
        affiliate_url: `https://www.amazon.com/dp/${asin}?tag=dawnwire-20`,
        amazon_url: `https://www.amazon.com/dp/${asin}`,
        review_summary: data.shortDescription || data.fullDescription || '',
        pros: data.pros || [],
        cons: data.cons || [],
        key_features: data.mainFeatures || [],
        best_for: data.bestFor || '',
        final_verdict: data.editorVerdict || '',
        editor_score: data.editorScore || 0,
        asin,
        source: 'amazon-scraper',
        stockStatus: data.isDeal ? 'deal' : 'in_stock',
        dealBadge: data.isDeal ? 'Amazon Deal' : null,
        status: 'published',
        videoUrl: data.videoUrl || '',
        specs: data.specifications || {},
      };

      // Upload images to imgbb for permanent storage
      if (IMGBB_KEY && product.product_image) {
        const imgbbUrl = await uploadToImgBB(product.product_image);
        if (imgbbUrl) {
          console.log(`  Image uploaded to imgbb: ${imgbbUrl}`);
          product.product_image = imgbbUrl;
        }
      }
      if (IMGBB_KEY && Array.isArray(product.gallery) && product.gallery.length > 0) {
        const uploaded = await Promise.all(product.gallery.map((u: string) => uploadToImgBB(u)));
        product.gallery = uploaded.map((u: string | null, idx: number) => u || product.gallery[idx]);
      }

      console.log(`  ${product.product_name}`);
      console.log(`  Price: $${product.price}${product.original_price ? ` (was $${product.original_price})` : ''}`);
      console.log(`  Rating: ${product.rating}/5 (${product.reviewCount} reviews)`);
      console.log(`  Gallery: ${product.gallery.length} images`);
      console.log(`  Features: ${product.key_features.length}`);
      if (product.dealBadge) console.log(`  Deal: ${product.dealBadge}`);
      if (product.videoUrl) console.log(`  Video: ${product.videoUrl}`);

      if (!dryRun) {
        const ok = await importProduct(product);
        if (ok) succeeded++; else failed++;
      }
    } catch (err) {
      console.error(`  Error: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\nDone: ${succeeded} imported, ${failed} failed out of ${asins.length}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
