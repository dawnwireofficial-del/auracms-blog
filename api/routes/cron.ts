import express from 'express';
import { dbInstance } from '../../server/db';
import { checkPriceAlerts } from '../../server/db/price-alerts-db';

const router = express.Router();

// This endpoint is triggered by Vercel Cron
router.get('/sync-affiliates', async (req, res) => {
  try {
    // In a real production scenario, you would fetch external affiliate APIs here.
    // For this simulation, we'll randomize a price drop for a random product to demonstrate the price alerts system.
    const products: any[] = await (dbInstance as any).getProductReviews?.() || [];
    if (!products || products.length === 0) {
      return res.json({ success: true, message: 'No products to sync' });
    }

    // Pick a random product that has a price
    const validProducts = products.filter((p: any) => p.price);
    if (validProducts.length > 0) {
      const randomProduct = validProducts[Math.floor(Math.random() * validProducts.length)];
      const currentPrice = parseFloat((randomProduct.price || '0').replace(/[^0-9.]/g, ''));
      
      if (currentPrice > 0) {
        const newPrice = currentPrice * 0.9; // Simulate a 10% price drop
        
        // Update product in DB if the method exists
        if (typeof (dbInstance as any).updateProductReview === 'function') {
          await (dbInstance as any).updateProductReview(randomProduct.id, { 
            price: `$${newPrice.toFixed(2)}`,
            original_price: `$${currentPrice.toFixed(2)}`,
            deal_badge: 'PRICE DROP'
          });
          console.log(`[Cron] Simulated price drop for product ${randomProduct.id}: $${currentPrice} -> $${newPrice.toFixed(2)}`);
        }
      }
    }

    // After updating prices, check if any price alerts were triggered
    const alertResults = await checkPriceAlerts();
    console.log('[Cron] Price alert check results:', alertResults);
    
    res.json({ success: true, message: 'Affiliate sync complete', alertResults });
  } catch (err: any) {
    console.error('[Cron] Error running sync affiliates:', err);
    res.status(500).json({ error: err.message });
  }
});

// Heavy scheduled jobs. Triggered by Vercel Cron (POST /api/cron/jobs) so they
// run OFF the user request path — a cold start can no longer starve a request.
// Protected by the Vercel Cron secret to prevent open execution.
function isCronAuthorized(req: express.Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Allow if no secret configured (non-Vercel envs)
  const header = req.headers.authorization || req.headers['x-cron-secret'] || '';
  return (
    String(header) === `Bearer ${secret}` ||
    String(req.headers['x-cron-secret'] || '') === secret
  );
}

router.post('/jobs', async (req, res) => {
  if (!isCronAuthorized(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const results: Record<string, any> = {};
  const started = Date.now();

  const run = async (name: string, fn: () => Promise<any>) => {
    try {
      results[name] = await fn();
    } catch (e: any) {
      results[name] = { error: e?.message || String(e) };
    }
  };

  // 1. Scheduled posts
  await run('posts', async () => {
    const { processScheduledPosts } = await import('../../server/scheduler');
    return processScheduledPosts();
  });

  // 2. Amazon product sync
  await run('amazonSync', async () => {
    const { runScheduledSync } = await import('../../server/amazon-sync-engine');
    return runScheduledSync();
  });

  // 3. Auto-import from Amazon (24h cadence)
  await run('autoImport', async () => {
    const { scrapeAmazonSearch } = await import('../../server/amazon-search-scraper');
    const { getProductReviews, importProductReview } = await import('../../server/seo-engine');
    const cats = await dbInstance.getCategories();
    const productCats = cats.filter((c: any) =>
      c.status === 'active' &&
      !['business', 'lifestyle', 'seo-marketing', 'technology'].includes(c.slug?.toLowerCase())
    );
    const existing = await getProductReviews();
    let totalImported = 0;
    for (const cat of productCats) {
      try {
        const productResults = await scrapeAmazonSearch(cat.name, 'US', 50);
        for (const r of productResults) {
          const exists = existing.find((x: any) => x.specs?.asin === r.asin);
          if (exists) continue;
          try {
            await importProductReview({
              product_name: r.title.substring(0, 200),
              product_image: r.image,
              price: r.price ? String(r.price) : undefined,
              asin: r.asin,
              amazon_url: r.url,
              source: 'amazon',
              best_for: cat.slug,
              category_id: cat.id,
              specs: { asin: r.asin, source: 'amazon' },
            });
            totalImported++;
          } catch {}
        }
      } catch {}
    }
    return { categories: productCats.length, imported: totalImported };
  });

  // 4. Auto Article Factory
  await run('autoArticles', async () => {
    const { getConfig, autoGenerateArticles } = await import('../../server/auto-articles');
    const cfg = await getConfig();
    if (!cfg.enabled) return { skipped: true, reason: 'disabled' };
    return autoGenerateArticles();
  });

  // 5. Affiliate health audit (report-only)
  await run('affiliateAudit', async () => {
    const { runAudit } = await import('../../server/affiliate-health');
    return runAudit({ checkedBy: 'cron' });
  });

  res.json({ success: true, durationMs: Date.now() - started, results });
});

export default router;
