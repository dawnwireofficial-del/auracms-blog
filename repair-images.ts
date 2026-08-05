import fs from 'fs';

// Load production Supabase env vars from a JSON file (not committed)
const envFile = process.argv[2];
if (!envFile) { console.error('Usage: npx tsx repair-images.ts <env-json-path>'); process.exit(1); }
const env = JSON.parse(fs.readFileSync(envFile, 'utf8'));
for (const [k, v] of Object.entries(env)) {
  if (typeof v === 'string' && v) process.env[k] = v;
}

const { getProductReviews, updateProductReview } = await import('./server/seo-engine');
const { scrapeAmazonHtml, verifyImageUrl } = await import('./server/amazon-extractor');

const mapConcurrent = async <T, R>(items: T[], worker: (item: T) => Promise<R>, concurrency: number): Promise<R[]> => {
  const out: R[] = new Array(items.length);
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await worker(items[idx]); } catch (e: any) { out[idx] = e; }
    }
  });
  await Promise.all(runners);
  return out;
};

const asinOf = (r: any): string => {
  const specAsin = r.specs?.asin || '';
  if (specAsin && /^[A-Z0-9]{10}$/.test(specAsin)) return specAsin;
  return (r.affiliate_url || r.amazon_url || '').match(/\/dp\/([A-Z0-9]{10})/i)?.[1] || '';
};

(async () => {
  const reviews = await getProductReviews();
  console.log('total reviews:', reviews.length);

  // Phase 1 — find products whose stored main image is dead
  const suspects = (await mapConcurrent(reviews, async (r) => {
    const current = r.product_image || r.specs?.gallery?.[0] || '';
    if (!current || !/^https:\/\/(m\.)?media-amazon\.com\//.test(current)) return null;
    if (await verifyImageUrl(current, 8000)) return null;
    return r;
  }, 8)).filter(Boolean) as any[];
  console.log('dead-image products:', suspects.length);
  for (const s of suspects) console.log('  -', s.slug, '| asin:', asinOf(s) || '(none)', '| img:', (s.product_image || '').substring(0, 70));

  // Phase 2 — scrape + verify + update
  let repaired = 0, failed = 0;
  await mapConcurrent(suspects, async (r: any) => {
    const asin = asinOf(r);
    if (!asin) { failed++; console.log('FAIL (no asin):', r.slug); return; }
    const scraped = await scrapeAmazonHtml(asin);
    const candidates: string[] = [scraped?.mainImage || '', ...(scraped?.images || [])]
      .filter((u): u is string => typeof u === 'string' && /^https:\/\/(m\.)?media-amazon\.com\//.test(u));
    const unique = [...new Set(candidates)];
    const valid: string[] = [];
    for (const c of unique.slice(0, 6)) {
      if (await verifyImageUrl(c, 8000)) valid.push(c);
      if (valid.length >= 6) break;
    }
    if (!valid.length) { failed++; console.log('FAIL (no valid images):', r.slug, asin); return; }
    await updateProductReview(r.id, { images: valid });
    repaired++;
    console.log('OK:', r.slug.slice(0, 60), '| images:', valid.length, '| main:', valid[0].split('/I/')[1]?.split('.')[0]);
  }, 3);

  console.log(`\nDONE — repaired: ${repaired}, failed: ${failed}`);
})().catch((e) => { console.error('SCRIPT ERROR:', e); process.exit(1); });
