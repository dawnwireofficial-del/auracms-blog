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

export default router;
