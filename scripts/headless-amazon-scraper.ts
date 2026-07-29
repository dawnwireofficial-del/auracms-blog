/**
 * Headless Amazon Product Scraper
 *
 * Uses Playwright to scrape Amazon product pages with full JS rendering.
 * Extracts all product data (images, gallery, prices, videos, specs, reviews)
 * and POSTs to the DawnWire API.
 *
 * Usage:
 *   npx tsx scripts/headless-amazon-scraper.ts --asins B0XXXXX,B0YYYYY
 *   npx tsx scripts/headless-amazon-scraper.ts --urls "https://www.amazon.com/dp/B0XXXXX"
 *   npx tsx scripts/headless-amazon-scraper.ts --file asins.txt --api-url https://www.dawnwire.com
 *
 * Environment variables:
 *   DAWNWIRE_API_URL   - API base URL (default: https://www.dawnwire.com)
 *   DAWNWIRE_API_TOKEN - Admin API token for authentication
 *   IMGBB_API_KEY      - Optional: upload images to imgbb for permanent storage
 */

import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = process.env.DAWNWIRE_API_URL || 'https://www.dawnwire.com';
const API_TOKEN = process.env.DAWNWIRE_API_TOKEN || '';
const IMGBB_KEY = process.env.IMGBB_API_KEY || '';
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 3000;
const ITEM_DELAY_MS = 1500;
const TIMEOUT_MS = 30000;

interface ScrapedProduct {
  product_name: string;
  brand: string;
  product_image: string;
  gallery: string[];
  price: string;
  original_price: string;
  rating: number;
  review_count: number;
  pros: string[];
  cons: string[];
  key_features: string[];
  review_summary: string;
  specs: Record<string, string>;
  videoUrl: string;
  best_for: string;
  stock_status: string;
  deal_badge: string;
  coupon_code: string;
  asin: string;
  source: string;
}

function parseArgs(): { asins: string[]; urls: string[]; file: string | null; dryRun: boolean } {
  const args = process.argv.slice(2);
  const result = { asins: [] as string[], urls: [] as string[], file: null as string | null, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--asins' && args[i + 1]) {
      result.asins = args[++i].split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    } else if (args[i] === '--urls' && args[i + 1]) {
      result.urls = args[++i].split(',').map(s => s.trim()).filter(Boolean);
    } else if (args[i] === '--file' && args[i + 1]) {
      result.file = args[++i];
    } else if (args[i] === '--dry-run') {
      result.dryRun = true;
    }
  }
  if (result.file) {
    const content = fs.readFileSync(result.file, 'utf-8');
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.toUpperCase().match(/^[A-Z0-9]{10}$/)) {
        result.asins.push(line.toUpperCase());
      } else if (line.includes('amazon.')) {
        result.urls.push(line);
      }
    }
  }
  return result;
}

async function extractAsinFromUrl(url: string): Promise<string | null> {
  const match = url.match(/(?:\/dp\/|product\/|ASIN\/|asin=)([A-Z0-9]{10})(?:\/|$|[?&])/i);
  return match ? match[1].toUpperCase() : null;
}

async function uploadToImgBB(imageUrl: string): Promise<string | null> {
  if (!IMGBB_KEY || !imageUrl.startsWith('http')) return null;
  try {
    const resp = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DawnWire/1.0)' },
    });
    if (!resp.ok) return null;
    const buf = Buffer.from(await resp.arrayBuffer());
    const b64 = buf.toString('base64');
    const body = new URLSearchParams({ image: b64 });
    const imgbb = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(15000),
    });
    const data: any = await imgbb.json();
    return data.success ? data.data.url : null;
  } catch {
    return null;
  }
}

async function scrapeAmazonProduct(page: Page, asin: string): Promise<ScrapedProduct> {
  const url = `https://www.amazon.com/dp/${asin}`;
  console.log(`  Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: TIMEOUT_MS });

  const result: ScrapedProduct = {
    product_name: '', brand: '', product_image: '', gallery: [],
    price: '', original_price: '', rating: 0, review_count: 0,
    pros: [], cons: [], key_features: [], review_summary: '',
    specs: {}, videoUrl: '', best_for: '', stock_status: 'in_stock',
    deal_badge: '', coupon_code: '', asin, source: 'amazon-headless',
  };

  try {
    result.product_name = await page.locator('#productTitle').innerText({ timeout: 5000 }).then(t => t.trim()).catch(() => '');
  } catch { /* not found */ }

  try {
    const brandEl = page.locator('#bylineInfo');
    result.brand = await brandEl.innerText({ timeout: 3000 }).then(t => t.replace('Visit the', '').replace('Store', '').trim()).catch(() => '');
  } catch { /* not found */ }

  try {
    const imgEl = page.locator('#landingImage');
    result.product_image = await imgEl.getAttribute('src', { timeout: 3000 }).catch(() => '') || '';
  } catch { /* not found */ }

  try {
    const thumbs = page.locator('#altImages img');
    const count = await thumbs.count();
    for (let i = 0; i < count && i < 20; i++) {
      const src = await thumbs.nth(i).getAttribute('src').catch(() => '');
      if (src && src.startsWith('http') && !result.gallery.includes(src)) {
        result.gallery.push(src);
      }
    }
  } catch { /* not found */ }

  try {
    const priceEl = page.locator('.a-price .a-offscreen').first();
    result.price = await priceEl.innerText({ timeout: 3000 }).then(t => t.replace(/[^0-9.]/g, '')).catch(() => '');
  } catch { /* not found */ }

  try {
    const listPriceEl = page.locator('.a-text-strike').first();
    result.original_price = await listPriceEl.innerText({ timeout: 2000 }).then(t => t.replace(/[^0-9.]/g, '')).catch(() => '');
  } catch { /* not found */ }

  try {
    const ratingText = await page.locator('#acrPopover').getAttribute('title', { timeout: 3000 }).catch(() => '');
    if (ratingText) {
      const match = ratingText.match(/([\d.]+)/);
      if (match) result.rating = parseFloat(match[1]);
    }
  } catch { /* not found */ }

  try {
    const countText = await page.locator('#acrCustomerReviewText').innerText({ timeout: 3000 }).catch(() => '');
    if (countText) {
      const match = countText.match(/([\d,]+)/);
      if (match) result.review_count = parseInt(match[1].replace(/,/g, ''));
    }
  } catch { /* not found */ }

  try {
    const features = page.locator('#feature-bullets li span');
    const count = await features.count();
    for (let i = 0; i < count; i++) {
      const text = await features.nth(i).innerText().catch(() => '');
      if (text) result.key_features.push(text.trim());
    }
  } catch { /* not found */ }

  try {
    const descEl = page.locator('#productDescription p');
    result.review_summary = await descEl.innerText({ timeout: 3000 }).catch(() => '');
  } catch { /* not found */ }

  try {
    const tableRows = page.locator('#productDetails_db_sections tr');
    const count = await tableRows.count();
    for (let i = 0; i < count; i++) {
      const key = await tableRows.nth(i).locator('th').innerText().catch(() => '');
      const val = await tableRows.nth(i).locator('td').innerText().catch(() => '');
      if (key && val) result.specs[key.trim()] = val.trim();
    }
  } catch { /* not found */ }

  try {
    const bubbless = page.locator('.a-box-group .a-size-base');
    const bCount = await bubbless.count();
    if (bCount > 0) {
      const first = await bubbless.first().innerText().catch(() => '');
      if (first.toLowerCase().includes('deal') || first.toLowerCase().includes('save')) {
        result.deal_badge = 'Amazon Deal';
        result.stock_status = 'deal';
      }
    }
  } catch { /* not-found */ }

  try {
    const couponText = await page.locator('.promoPriceBlockMessage').innerText({ timeout: 2000 }).catch(() => '');
    if (couponText) {
      const match = couponText.match(/(\d+%|\$\d+)/);
      if (match) result.coupon_code = match[1];
    }
  } catch { /* not found */ }

  return result;
}

async function importProduct(apiUrl: string, token: string, product: ScrapedProduct): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/api/admin/seo/product-reviews/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      console.error(`    API error (${res.status}): ${errText}`);
      return false;
    }
    const data = await res.json();
    console.log(`    Imported: ${data.product_name || data.id} (${data.slug || ''})`);
    return true;
  } catch (err) {
    console.error(`    Network error: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

async function main() {
  const { asins: argAsins, urls: argUrls, file, dryRun } = parseArgs();

  const asins = [...argAsins];
  for (const url of argUrls) {
    const asin = await extractAsinFromUrl(url);
    if (asin && !asins.includes(asin)) asins.push(asin);
  }

  if (asins.length === 0) {
    console.error('No ASINs found. Provide --asins, --urls, or --file.');
    console.error('Usage: npx tsx scripts/headless-amazon-scraper.ts --asins B0XXXXX,B0YYYYY');
    process.exit(1);
  }

  if (!API_TOKEN) {
    console.warn('Warning: DAWNWIRE_API_TOKEN not set. API calls may fail.');
  }

  if (dryRun) {
    console.log(`\nDRY RUN — Would scrape ${asins.length} ASINs:`);
    for (const asin of asins) console.log(`  ${asin}`);
    console.log(`  Upload images to imgbb: ${!!IMGBB_KEY}`);
    return;
  }

  console.log(`\nLaunching Playwright (Chromium) to scrape ${asins.length} ASINs...`);

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < asins.length; i += BATCH_SIZE) {
    const batch = asins.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(asins.length / BATCH_SIZE)} (${batch.length} items)`);

    for (const asin of batch) {
      console.log(`\nScraping ASIN: ${asin}...`);
      let page: Page | null = null;
      try {
        page = await browser.newPage();
        const product = await scrapeAmazonProduct(page, asin);

        if (!product.product_name) {
          console.warn(`  Warning: No product name found for ${asin}, skipping`);
          failed++;
          continue;
        }

        console.log(`  Name: ${product.product_name}`);
        console.log(`  Price: ${product.price}${product.original_price ? ` (was ${product.original_price})` : ''}`);
        console.log(`  Rating: ${product.rating} (${product.review_count} reviews)`);
        console.log(`  Gallery: ${product.gallery.length} images`);
        console.log(`  Features: ${product.key_features.length}`);
        console.log(`  Specs: ${Object.keys(product.specs).length} fields`);
        if (product.deal_badge) console.log(`  Deal: ${product.deal_badge}`);
        if (product.coupon_code) console.log(`  Coupon: ${product.coupon_code}`);

        if (IMGBB_KEY && product.product_image) {
          console.log('  Uploading product image to imgbb...');
          const imgbbUrl = await uploadToImgBB(product.product_image);
          if (imgbbUrl) {
            console.log(`  ImgBB URL: ${imgbbUrl}`);
            product.product_image = imgbbUrl;
          }
        }
        if (IMGBB_KEY && product.gallery.length > 0) {
          console.log(`  Uploading ${product.gallery.length} gallery images to imgbb...`);
          const uploaded = await Promise.all(product.gallery.map(u => uploadToImgBB(u)));
          product.gallery = uploaded.map((u, idx) => u || product.gallery[idx]);
        }

        const ok = await importProduct(API_URL, API_TOKEN, product);
        if (ok) succeeded++; else failed++;

      } catch (err) {
        console.error(`  Error scraping ${asin}:`, err instanceof Error ? err.message : err);
        failed++;
      } finally {
        if (page) await page.close().catch(() => {});
      }

      if (i + batch.indexOf(asin) < asins.length - 1) {
        await new Promise(r => setTimeout(r, ITEM_DELAY_MS));
      }
    }

    if (i + BATCH_SIZE < asins.length) {
      console.log(`  Waiting ${BATCH_DELAY_MS}ms before next batch...`);
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  await browser.close();

  console.log(`\nDone: ${succeeded} succeeded, ${failed} failed out of ${asins.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
