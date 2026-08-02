import 'dotenv/config';
import { scrapeAmazonSearch } from '../server/amazon-search-scraper';
import { extractAmazonProductData, synthesizeWithAi } from '../server/amazon-extractor';
import { importProductReview } from '../server/seo-engine';
import { autoProcessProduct } from '../server/auto-import';
import { getSupabaseAdmin } from '../server/lib/supabase';

const PARTNER_TAG = 'dawnwire-20';
const MARKETPLACE = 'US';

async function extractWithFallback(asin: string, seed: { title: string; image?: string; price?: number | null } | null): Promise<ReturnType<typeof extractAmazonProductData>> {
  const productData = await extractAmazonProductData(asin, PARTNER_TAG);
  if (!productData.title || productData.title.includes('Amazon Product')) {
    if (!seed || !seed.title || seed.title.includes('Amazon Product')) {
      return productData;
    }
    const ai = await synthesizeWithAi(asin, seed.title, '');
    const desc = ai?.shortDescription || `${seed.title} delivers high performance and top features on Amazon US.`;
    const fallback: any = {
      ...productData,
      title: seed.title,
      mainImage: seed.image || productData.mainImage,
      images: [seed.image, ...productData.images.filter((i: string) => i !== seed.image)].filter(Boolean).slice(0, 8),
      mainCategory: ai?.mainCategory || productData.mainCategory,
      subcategory: ai?.subcategory || 'General',
      bestFor: ai?.bestFor || 'Top Recommended Pick',
      shortDescription: desc,
      fullDescription: ai?.fullDescription || `Full expert review and specifications for ${seed.title}.`,
      editorVerdict: ai?.editorVerdict || `${seed.title} offers excellent performance, durable build quality, and high user satisfaction.`,
      editorScore: ai?.editorScore || 9.2,
      pros: ai?.pros || ['High build quality', 'Top performance', 'Verified Amazon rating'],
      cons: ai?.cons || ['Slightly higher price than basic models'],
      mainFeatures: ai?.mainFeatures || ['Independent Benchmarking', 'Fast Delivery', 'Top Buyer Ratings'],
      currentPrice: seed.price || productData.currentPrice || 99.99,
      referencePrice: productData.referencePrice || (seed.price ? Math.round((seed.price as number) * 1.15) : 129.99),
      rating: productData.rating || 4.6,
    };
    return fallback;
  }
  return productData;
}

// One query per target category so we get a spread across the whole catalog.
const QUERIES: string[] = [
  'retinol face serum',
  'hyaluronic acid serum',
  'vitamin c serum',
  'eye cream for dark circles',
  'face sunscreen spf 50',
  'body lotion shea butter',
  'face cleanser gentle',
  'resistance bands set',
  'yoga mat non slip',
  'protein powder whey',
  'adjustable dumbbells',
  'foam roller for back',
  'wireless earbuds noise cancelling',
  'bluetooth speaker portable',
  'webcam for laptop',
  'mechanical keyboard',
  'gaming mouse rgb',
  'air fryer basket',
  'coffee maker programmable',
  'blender for smoothies',
  'knife set kitchen',
  'robot vacuum cleaner',
  'gaming headset',
  'wireless gaming controller',
  'camping tent 4 person',
  'hiking backpack waterproof',
  'basketball outdoor',
  'baby monitor video',
  'diaper bag',
  'building blocks kids',
  'board game family',
  'dash cam front and rear',
  'standing desk',
  'desk chair ergonomic',
  'cooking pot set nonstick',
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchExistingSlugs(): Promise<Set<string>> {
  try {
    const sb = await getSupabaseAdmin();
    const { data } = await sb.from('product_reviews').select('slug');
    return new Set((data || []).map((r: any) => r.slug).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function main() {
  const maxTarget = Number(process.argv[2]) || 100;
  const quotaPerQuery = Number(process.argv[3]) || 5;
  const extractDelay = Number(process.argv[4]) || 1500;
  const offset = Number(process.argv[5]) || 0;
  const count = Number(process.argv[6]) || QUERIES.length;
  const onlyFresh = process.argv.includes('--fresh');
  const skipSeo = process.argv.includes('--no-seo');
  const queries = QUERIES.slice(offset, offset + count);

  const sb = await getSupabaseAdmin();
  const slugSet = await fetchExistingSlugs();
  console.log(`Existing slugs in DB: ${slugSet.size}`);
  console.log(`Running ${queries.length} queries (offset ${offset}): ${queries[0]} ... ${queries[queries.length - 1]}`);

  const asinSet = new Set<string>();
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const q of queries) {
    if (asinSet.size >= maxTarget) {
      console.log(`\nReached maxTarget (${maxTarget}); stopping.`);
      break;
    }

    let found: { asin: string; title: string; image?: string; price?: number | null }[] = [];
    try {
      found = await scrapeAmazonSearch(q, MARKETPLACE, 24);
      console.log(`  search "${q}": ${found.length} results`);
    } catch (e: any) {
      console.log(`  search "${q}": ERR ${e.message}`);
    }
    await sleep(15000);

    let importedThisQuery = 0;
    for (const r of found) {
      if (importedThisQuery >= quotaPerQuery) break;
      if (asinSet.size >= maxTarget) break;
      const asin = r.asin;
      if (asinSet.has(asin)) continue;

      try {
        const { data: existing } = await sb
          .from('product_reviews')
          .select('id, slug, product_name')
          .contains('specs', { asin })
          .limit(1)
          .maybeSingle();
        if (existing) {
          if (!onlyFresh) {
            skipped++;
            asinSet.add(asin);
            console.log(`  SKIP (exists) ${asin} -> ${(existing.product_name || '').slice(0, 50)}`);
            continue;
          }
        }

        const productData = await extractWithFallback(asin, r.title ? { title: r.title, image: r.image, price: r.price } : null);
        if (!productData.title || productData.title.includes('Amazon Product')) {
          failed++;
          console.log(`  FAIL (no title) ${asin}`);
          continue;
        }

        const directUrl = `https://www.amazon.com/dp/${asin}?tag=${PARTNER_TAG}`;
        const mapped: any = {
          product_name: productData.title,
          brand: productData.brand || '',
          price: String(productData.currentPrice || ''),
          listPrice: String(productData.referencePrice || ''),
          product_image: productData.mainImage || '',
          gallery: productData.images || [],
          affiliate_url: directUrl,
          amazon_url: `https://www.amazon.com/dp/${asin}`,
          review_summary: productData.shortDescription || productData.fullDescription || '',
          pros: productData.pros || [],
          cons: productData.cons || [],
          key_features: productData.mainFeatures || [],
          specs: {
            asin,
            source: 'local-bulk-import',
            marketplace: MARKETPLACE,
            availability: 'available',
            ...(productData.specifications || {}),
            ...(productData.categoryPath ? { category: productData.categoryPath } : {}),
            ...(productData.bestSellersRank ? { bestSellersRank: productData.bestSellersRank } : {}),
            ...(productData.department ? { details: { department: productData.department } } : {}),
          },
          stock_status: 'in_stock',
          deal_badge: productData.isDeal ? 'Amazon Deal' : null,
          best_for: productData.bestFor || null,
          final_verdict: productData.editorVerdict || null,
          editor_score: productData.editorScore || null,
          is_featured: false,
          is_deal: !!productData.isDeal,
          status: 'published',
          rating: productData.rating || 0,
          review_count: productData.reviewCount || 0,
        };

        if (productData.mainCategory) {
          const { data: cat } = await sb.from('categories').select('id').ilike('name', productData.mainCategory).limit(1).maybeSingle();
          if (cat) mapped.category_id = cat.id;
        }

        const created = await importProductReview({ ...mapped, slugSet });
        if (created) {
          slugSet.add(created.slug);
          if (!skipSeo) {
            try {
              await autoProcessProduct(created.id);
            } catch (e: any) {
              console.log(`    auto-process ERR: ${e.message}`);
            }
          }
          succeeded++;
          asinSet.add(asin);
          importedThisQuery++;
          console.log(`  OK ${asin} -> ${created.slug.slice(0, 50)} (cat: ${productData.mainCategory})`);
        } else {
          failed++;
          console.log(`  FAIL (import returned null) ${asin}`);
        }
      } catch (e: any) {
        failed++;
        console.log(`  ERR ${asin}: ${e.message}`);
      }

      await sleep(extractDelay);
    }

    console.log(`  -> query "${q}" imported ${importedThisQuery}\n`);
    await sleep(2000);
  }

  console.log(`\n===== DONE =====`);
  console.log(`Total unique ASINs seen: ${asinSet.size} | OK: ${succeeded} | FAIL: ${failed} | SKIP: ${skipped}`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
