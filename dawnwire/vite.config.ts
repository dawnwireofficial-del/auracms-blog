import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { handleAiChatRequest, handleAiProductGenerator, handleAiExtractProductFromLink, handleAiGenerateSeo, handleAiAnalyzeSentiment, handleAiGenerateFaq } from './src/server/aiService';

function dawnwireApiPlugin(): Plugin {
  return {
    name: 'dawnwire-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/ai/faq' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const result = await handleAiGenerateFaq(data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to generate product FAQ' }));
            }
          });
          return;
        }

        if (req.url === '/api/ai/sentiment' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const result = await handleAiAnalyzeSentiment(data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to analyze sentiment' }));
            }
          });
          return;
        }
        if (req.url === '/api/ai/generate-seo' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const result = await handleAiGenerateSeo(data);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to generate SEO metadata' }));
            }
          });
          return;
        }
        if (req.url === '/api/ai/chat' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const result = await handleAiChatRequest(data.prompt || '', data.contextProductId, data.chatHistory);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to process AI chat request' }));
            }
          });
          return;
        }

        if (req.url === '/api/ai/generate-review' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const result = await handleAiProductGenerator(data.title || '', data.asin || '', data.category || '');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to generate AI metadata' }));
            }
          });
          return;
        }

        if (req.url === '/api/ai/extract-product-from-link' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const result = await handleAiExtractProductFromLink(data.url || '', data.associateTag || 'dawnwire-20');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to extract product data from link' }));
            }
          });
          return;
        }

        if (req.url === '/api/analytics/affiliate-click' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'success', loggedAt: new Date().toISOString() }));
          return;
        }

        if (req.url?.startsWith('/api/deals/trending') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              deals: [
                {
                  id: 'p1',
                  title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
                  brand: 'Sony',
                  category: 'Electronics',
                  currentPrice: 328.00,
                  referencePrice: 399.99,
                  discountPercentage: 18,
                  rating: 4.8,
                  reviewCount: 14250,
                  images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
                  asin: 'B09XS7JWHH',
                  affiliateUrl: 'https://www.amazon.com/dp/B09XS7JWHH?tag=dawnwire-20',
                  dealBadge: '🔥 Top Tech Deal',
                  expiresInHours: 7
                },
                {
                  id: 'p3',
                  title: 'Breville Barista Touch Impress Espresso Machine',
                  brand: 'Breville',
                  category: 'Home & Kitchen',
                  currentPrice: 1199.95,
                  referencePrice: 1499.95,
                  discountPercentage: 20,
                  rating: 4.9,
                  reviewCount: 3820,
                  images: ['https://images.unsplash.com/photo-1517668808822-9ebd02f2a888?auto=format&fit=crop&w=800&q=80'],
                  asin: 'B0C77X8L1Z',
                  affiliateUrl: 'https://www.amazon.com/dp/B0C77X8L1Z?tag=dawnwire-20',
                  dealBadge: '⚡ Flash Kitchen Savings',
                  expiresInHours: 4
                },
                {
                  id: 'p5',
                  title: 'Roborock S8 Pro Ultra Robot Vacuum and Mop',
                  brand: 'Roborock',
                  category: 'Smart Home',
                  currentPrice: 1199.99,
                  referencePrice: 1599.99,
                  discountPercentage: 25,
                  rating: 4.7,
                  reviewCount: 5210,
                  images: ['https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80'],
                  asin: 'B0BZR2Y7L1',
                  affiliateUrl: 'https://www.amazon.com/dp/B0BZR2Y7L1?tag=dawnwire-20',
                  dealBadge: '🏷️ Lowest Price 30 Days',
                  expiresInHours: 12
                },
                {
                  id: 'p8',
                  title: 'Dyson V15 Detect Cordless Vacuum Cleaner',
                  brand: 'Dyson',
                  category: 'Home & Cleaning',
                  currentPrice: 619.99,
                  referencePrice: 749.99,
                  discountPercentage: 17,
                  rating: 4.8,
                  reviewCount: 8940,
                  images: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'],
                  asin: 'B09C3X9Z1L',
                  affiliateUrl: 'https://www.amazon.com/dp/B09C3X9Z1L?tag=dawnwire-20',
                  dealBadge: '💥 Editor Choice Discount',
                  expiresInHours: 9
                }
              ]
            })
          );
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), dawnwireApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
