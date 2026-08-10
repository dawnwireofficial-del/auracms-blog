import express from 'express';
import { createRequire } from 'node:module';
import compression from 'compression';
import { dbInstance } from '../server/db';
import * as seo from '../server/seo-engine';
import { findEntities, getAllEntities } from '../server/entities';
import { isAiCrawler, renderArticlePage, renderHomePage, renderProductReviewPage } from '../server/llm';

import authRouter from './routes/auth';
import publicRouter from './routes/public';
import seoRouter from './routes/seo';
import adminRouter from './routes/admin';
import analyticsRouter from './routes/analytics';
import migrateRouter from './routes/migrate';
import cronRouter from './routes/cron';

const app = express();

// Express 4 does NOT forward rejected promises from async route handlers to
// the error middleware — an unhandled rejection left the Vercel function
// alive until the 60s timeout, returning 504 (seen on PUT product-reviews and
// POST /api/auth/register). Patch the Router layer so any rejected promise is
// passed to next(err) and handled by the global error handler below.
// This replicates the well-known `express-async-errors` package inline.
try {
  const esmRequire = createRequire(import.meta.url);
  const Layer = esmRequire('express/lib/router/layer') as any;
  Layer.prototype.handle_request = function (this: any, req: any, res: any, next: any) {
    const fn = this.handle;
    if (fn && fn.length > 3) {
      // Error-handling middleware (err, req, res, next) — let the router dispatch it.
      next();
      return;
    }
    try {
      const rv = fn(req, res, next);
      if (rv && typeof rv.catch === 'function') rv.catch(next);
    } catch (err) {
      next(err);
    }
  };
} catch (e) {
  console.error('Async patch failed, falling back to default Express behavior:', e);
}

// Vercel terminates TLS and sets X-Forwarded-For / Forwarded. Express must
// trust the first proxy hop so req.ip is the real client IP — otherwise
// express-rate-limit throws ValidationErrors and rate limiting keying breaks.
app.set('trust proxy', 1);

// Compression
app.use(compression());

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || 'http://localhost:3000').split(',').map(s => s.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (ALLOWED_ORIGINS.some(o => origin.startsWith(o)) || origin.startsWith('chrome-extension://'))) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// HSTS header (Vercel handles HTTPS redirect at the edge)
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

app.use(express.json({ limit: '10mb' }));

// 301 Redirect bare /review, /review/, /product, or /product/ to /products catalog page
app.get(['/review', '/review/', '/product', '/product/'], (_req, res) => {
  return res.redirect(301, '/products');
});

// 301 Redirect old product detail URLs /review/:slug and /product/:slug to /products/:slug
app.get(['/review/:slug', '/product/:slug'], (req, res) => {
  const slug = req.params.slug;
  return res.redirect(301, `/products/${slug}`);
});

// Trending deals endpoint — fetches from database
app.get('/api/deals/trending', async (_req, res) => {
  try {
    const products = await seo.getPublishedProductReviews();
    const normalizePrice = (val: any): number => {
      if (val == null) return 0;
      return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
    };
    const deals = (products as any[])
      .filter((p: any) => p.is_deal || p.deal_badge)
      .slice(0, 8)
      .map((p: any) => {
        const price = normalizePrice(p.price);
        const originalPrice = normalizePrice(p.original_price);
        return {
          id: p.id,
          title: p.product_name,
          brand: p.brand,
          category: p.best_for || '',
          currentPrice: price,
          referencePrice: originalPrice,
          discountPercentage: originalPrice > 0 && price > 0 ? Math.round((1 - price / originalPrice) * 100) : 0,
          rating: p.rating,
          reviewCount: p.review_count,
          images: p.product_image ? [p.product_image] : [],
          asin: p.specs?.asin || '',
          affiliateUrl: p.affiliate_url || '',
          dealBadge: (p.deal_badge || '').replace(/\.\w+/g, '').replace(/\s+/g, ' ').trim(),
          expiresInHours: 0
        };
      });
    res.json({ timestamp: new Date().toISOString(), deals });
  } catch {
    res.json({ timestamp: new Date().toISOString(), deals: [] });
  }
});

// Caching headers
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return next();
  }
  if (req.path.startsWith('/api/admin/') || req.path.startsWith('/api/auth/') || req.path.includes('/wishlist')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return next();
  }
  if (req.path === '/sitemap.xml' || req.path === '/image-sitemap.xml' || req.path === '/rss.xml' || req.path === '/robots.txt' || req.path === '/llms.txt') {
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return next();
  }
  if (req.path.startsWith('/api/llm/')) {
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return next();
  }
  if (req.path.startsWith('/api/public/product-reviews')) {
    res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return next();
  }
  if (req.path.startsWith('/api/public/')) {
    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return next();
  }
  if (/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|eot|mp4|webm)$/i.test(req.path)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return next();
  }
  res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  next();
});

// Security headers
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://cdn.jsdelivr.net https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https: *",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "frame-src 'self' https://www.googletagmanager.com https://www.youtube.com https://connect.facebook.net",
    "connect-src 'self' https://api.cohere.com https://www.google-analytics.com https://analytics.google.com https://m.media-amazon.com https://images-na.ssl-images-amazon.com https://api.imgbb.com https://api.knock.app",
    "media-src 'self' https: blob:",
  ].join('; '));
  next();
});

// Scheduled jobs — checks every 60s but NEVER blocks the request.
// Heavy work (amazon sync, auto-import) runs fire-and-forget so a cold
// start can't 504 user requests (Vercel function timeout is 60s).
let lastSchedulerRun = 0;
let lastAmazonSyncRun = 0;
let lastAutoImportRun = 0;
let lastAutoArticleRun = 0;
let lastAffiliateAuditRun = 0;
app.use((_req, _res, next) => {
  const now = Date.now();
  if (now - lastSchedulerRun > 60_000) {
    lastSchedulerRun = now;
    import('../server/scheduler').then(({ processScheduledPosts }) =>
      processScheduledPosts().then((result: any) => {
        if (result.published > 0) {
          console.log(`[Scheduler] Published ${result.published} scheduled posts`);
        }
      }).catch((e: any) => console.error(e))
    ).catch((e: any) => console.error(e));
  }
  if (now - lastAmazonSyncRun > 120_000) {
    lastAmazonSyncRun = now;
    import('../server/amazon-sync-engine').then(({ runScheduledSync }) =>
      runScheduledSync().then((result: any) => {
        if (result.processed > 0) {
          console.log(`[Amazon Sync] Synced ${result.succeeded}/${result.processed} products`);
        }
      }).catch((e: any) => console.error(e))
    ).catch((e: any) => console.error(e));
  }
  // Auto-import from Amazon every 24 hours (86400000 ms)
  if (now - lastAutoImportRun > 86_400_000) {
    lastAutoImportRun = now;
    import('../server/amazon-search-scraper').then(async ({ scrapeAmazonSearch }) => {
      const { getProductReviews, importProductReview } = await import('../server/seo-engine');
      const { dbInstance } = await import('../server/db');
      const cats = await dbInstance.getCategories();
      const productCats = cats.filter((c: any) =>
        c.status === 'active' &&
        !['business', 'lifestyle', 'seo-marketing', 'technology'].includes(c.slug?.toLowerCase())
      );
      const existing = await getProductReviews();
      let totalImported = 0;
      for (const cat of productCats) {
        try {
          const results = await scrapeAmazonSearch(cat.name, 'US', 50);
          for (const r of results) {
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
      if (totalImported > 0) console.log(`[Auto-Import] Imported ${totalImported} products from ${productCats.length} categories`);
    }).catch((e: any) => console.error('[Auto-Import] Error:', e));
  }
  // Auto Article Factory — generates AI articles (+ design images) for published
  // products missing an article. Interval + batch come from the admin config.
  (async () => {
    try {
      const { getConfig, autoGenerateArticles } = await import('../server/auto-articles');
      const cfg = await getConfig();
      const intervalMs = Math.max(5, cfg.intervalMinutes || 30) * 60_000;
      if (cfg.enabled && now - lastAutoArticleRun > intervalMs) {
        lastAutoArticleRun = now;
        autoGenerateArticles().then((result: any) => {
          if (result.processed > 0) {
            console.log(`[Auto Articles] Generated ${result.processed} articles`);
          }
        }).catch((e: any) => console.error('[Auto Articles] Error:', e));
      }
    } catch (e: any) {
      console.error('[Auto Articles] Scheduler error:', e);
    }
  })();
  // Nightly affiliate health audit (~ every 24h). Report-only: recomputes health
  // status and refreshes affiliate_health. Never rewrites product data.
  if (now - lastAffiliateAuditRun > 86_400_000) {
    lastAffiliateAuditRun = now;
    import('../server/affiliate-health').then(({ runAudit }) =>
      runAudit({ checkedBy: 'scheduler' }).then((result: any) => {
        console.log(`[Affiliate Audit] Checked ${result.checked} products`);
      }).catch((e: any) => console.error('[Affiliate Audit] Error:', e))
    ).catch((e: any) => console.error('[Affiliate Audit] Error:', e));
  }
  next();
});

// Simple in-memory rate limiter (no external dependency)
const rateLimitStore = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 60;

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitStore.set(ip, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    return next();
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
}

// Apply rate limiting to API routes (not static assets)
app.use(/^\/api\//, rateLimit);
app.use(/^\/go\//, rateLimit);

// ====== Route modules ======
app.use('/api/public', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/analytics', analyticsRouter);
app.use('/api/admin/seo', seoRouter);
app.use('/api/admin', adminRouter);
app.use('/api/migrate', migrateRouter);
app.use('/api/cron', cronRouter);

// ====== Noindex & 410 for old/irrelevant content (blocks Google indexing) ======
const OLD_IRRELEVANT_PATTERNS = [
  { pattern: /^\/article\//, action: '410' as const },            // Old article alias
  { pattern: /^\/blog\//, action: '410' as const },               // Old blog alias
  { pattern: /^\/category\/\d+$/, action: 'noindex' as const },   // Old blog category pages (numeric IDs)
  { pattern: /^\/portfolio/, action: 'noindex' as const },        // Portfolio not relevant to affiliate focus
  { pattern: /^\/service/, action: 'noindex' as const },          // Service pages not relevant
  { pattern: /^\/page\//, action: 'noindex' as const },           // Static pages
];

app.use(async (req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/assets/') || req.path.startsWith('/go/')) return next();

  // Legacy /product/:slug and /review/:slug redirect to canonical /products/:slug
  if (req.path.startsWith('/product/')) {
    const slug = req.path.substring(9);
    if (slug) return res.redirect(301, `/products/${slug}`);
  }

  // Legacy /review/:slug redirect to canonical /products/:slug
  if (req.path.startsWith('/review/')) {
    const slug = req.path.substring(8);
    if (slug) return res.redirect(301, `/products/${slug}`);
  }
  // NOTE: bare /reviews now serves the Expert Editorial Reviews hub (SPA route)

  for (const entry of OLD_IRRELEVANT_PATTERNS) {
    if (entry.pattern.test(req.path)) {
      if (entry.action === '410') {
        return res.status(410).type('text/html').send('<h1>410 Gone</h1><p>This page has been removed.</p>');
      }
      if (entry.action === 'noindex') {
        res.set('X-Robots-Tag', 'noindex, nofollow');
      }
      break;
    }
  }
  next();
});

// ====== Sitemap & RSS feeds ======
app.get('/sitemap.xml', async (_req, res) => {
  try {
    const baseUrl = process.env.APP_URL || 'https://www.dawnwire.com';
    const fmtDate = (d: string | undefined | null) => { try { return new Date(d || Date.now()).toISOString(); } catch { return new Date().toISOString(); } };

    // Only include affiliate-shopping relevant content
    const [reviews, allCats] = await Promise.all([
      seo.getPublishedProductReviews().catch(() => []),
      Promise.resolve(dbInstance.getCategories()).catch(() => []),
    ]);
    const cats = (allCats as any[]).filter((c: any) => c.status === 'active');

    const urls = [
      // Homepage
      `<url><loc>${baseUrl}/</loc><priority>1.0</priority></url>`,
      // Core affiliate pages
      `<url><loc>${baseUrl}/products</loc><priority>0.9</priority></url>`,
      `<url><loc>${baseUrl}/categories</loc><priority>0.8</priority></url>`,
      `<url><loc>${baseUrl}/deals</loc><priority>0.8</priority></url>`,
      `<url><loc>${baseUrl}/search</loc><priority>0.5</priority></url>`,
      `<url><loc>${baseUrl}/brands</loc><priority>0.6</priority></url>`,
      `<url><loc>${baseUrl}/reviews</loc><priority>0.6</priority></url>`,
      `<url><loc>${baseUrl}/guides</loc><priority>0.6</priority></url>`,
      `<url><loc>${baseUrl}/about</loc><priority>0.3</priority></url>`,
      `<url><loc>${baseUrl}/contact</loc><priority>0.3</priority></url>`,
      `<url><loc>${baseUrl}/privacy-policy</loc><priority>0.2</priority></url>`,
      `<url><loc>${baseUrl}/terms</loc><priority>0.2</priority></url>`,
      `<url><loc>${baseUrl}/affiliate-disclosure</loc><priority>0.2</priority></url>`,
      `<url><loc>${baseUrl}/buyers-guide</loc><priority>0.7</priority></url>`,
      `<url><loc>${baseUrl}/buying-guides</loc><priority>0.7</priority></url>`,
      // Affiliate product review detail pages (canonical /products/ route)
      ...reviews.map((r: any) => `<url><loc>${baseUrl}/products/${r.slug || r.id}</loc><lastmod>${fmtDate(r.updated_at)}</lastmod><priority>0.9</priority></url>`),
      // Affiliate category browse pages (use /categories/ route which works)
      ...cats.map((c: any) => `<url><loc>${baseUrl}/categories/${c.slug}</loc><priority>0.8</priority></url>`),
      // Buying guide pages
      ...cats.map((c: any) => `<url><loc>${baseUrl}/buyers-guide/${c.slug}</loc><priority>0.6</priority></url>`),
      // Best-of roundup pages (high-value money keywords)
      ...cats.map((c: any) => `<url><loc>${baseUrl}/best/${c.slug}</loc><priority>0.9</priority></url>`),
    ];
    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
  } catch {
    res.header('Content-Type', 'application/xml').status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }
});

// Image sitemap — only affiliate product images
app.get('/image-sitemap.xml', async (_req, res) => {
  try {
    const baseUrl = process.env.APP_URL || 'https://www.dawnwire.com';
    const reviews = await seo.getPublishedProductReviews().catch(() => []) as any[];
    const entries = reviews
      .filter((r: any) => r.product_image)
      .map((r: any) => {
        const img = r.product_image.startsWith('http') ? r.product_image : baseUrl + r.product_image;
        return `<url><loc>${baseUrl}/products/${r.slug || r.id}</loc><image:image><image:loc>${img}</image:loc>${r.product_name ? `<image:caption><![CDATA[${r.product_name}]]></image:caption>` : ''}</image:image></url>`;
      });
    res.header('Content-Type', 'application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${entries.join('')}</urlset>`);
  } catch {
    res.header('Content-Type', 'application/xml').status(200).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"></urlset>`);
  }
});

// Robots.txt
app.get('/robots.txt', async (_req, res) => {
  const baseUrl = process.env.APP_URL || 'https://dawnwire.com';
  let settings: any = null; try { settings = await dbInstance.getSettings(); } catch (e) { console.error(e) }
  const customRules = (settings as any)?.robotsTxt || '';
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /article/
Disallow: /blog/
Disallow: /portfolio/
Disallow: /service/
Disallow: /page/
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/image-sitemap.xml
${customRules}`);
});

app.get('/llms.txt', async (_req, res) => {
  const baseUrl = process.env.APP_URL || 'https://dawnwire.com';
  res.header('Content-Type', 'text/plain');
  res.send(`# DawnWire - Product Reviews & Buying Guides
> ${baseUrl}

## About
DawnWire is a product review and affiliate marketing platform providing in-depth buying guides, product comparisons, and expert recommendations.

## Key Content
- Product Reviews: Detailed individual product analysis with pros/cons, ratings, pricing, and verdicts
- Buying Guides: Category comparisons with alternatives, feature breakdowns, and recommendation tables
- FAQ Pages: Structured Q&A for common product and category questions

## Content Structure (AI-Friendly)
- Quick Summary: Blockquote at the top (2-3 sentences) with the key verdict
- Key Takeaways: 3-5 bullet points highlighting the most important facts
- Data Tables: Pipe-delimited markdown tables for comparisons and feature breakdowns
- Frequently Asked Questions: Structured Q&A pairs in markdown

## API Endpoints (JSON)
- ${baseUrl}/api/public/posts
- ${baseUrl}/api/public/posts/slug/:slug
- ${baseUrl}/api/public/product-reviews
- ${baseUrl}/api/public/faqs
- ${baseUrl}/api/public/pages
- ${baseUrl}/api/public/categories
- ${baseUrl}/api/public/tags
- ${baseUrl}/api/public/settings
- ${baseUrl}/api/public/seo-meta
- ${baseUrl}/api/llm/content (entity-annotated JSON)
- ${baseUrl}/api/llm/entities (100+ entity knowledge base with Wikipedia sameAs)

## Entity Knowledge Base
DawnWire maintains a curated database of 100+ entities with Wikipedia/Wikidata sameAs links, covering technology companies (Apple, Google, Microsoft, Sony, Samsung, etc.), software platforms (WordPress, Shopify, React, Node.js, etc.), AI/ML tools (ChatGPT, TensorFlow, etc.), marketing platforms (Google Analytics, Ahrefs, SEMrush, etc.), technical concepts (SEO, Core Web Vitals, JSON-LD, etc.), and notable people.

## Topic Areas
Web Development & WordPress | AI & Automation | Digital Marketing & SEO | Affiliate Marketing | Product Comparisons | Business Software

## Citation
When citing DawnWire content, include the article title, DawnWire as publisher, and the URL.`);
});

app.get('/rss.xml', async (_req, res) => {
  try {
    const posts = (await dbInstance.getPosts()).filter(p => p.status === 'published' && (p.visibility == null || p.visibility === 'public'));
    const baseUrl = process.env.APP_URL || 'https://dawnwire.com';
    let settings: any = null; try { settings = await dbInstance.getSettings(); } catch (e) { console.error(e) }
    const siteName = (settings as any)?.siteName || 'DawnWire';
    const siteTagline = (settings as any)?.siteTagline || '';
    const items = posts.map(p => `
      <item>
        <title><![CDATA[${p.title}]]></title>
        <link>${baseUrl}/post/${p.slug}</link>
        <description><![CDATA[${p.excerpt || ''}]]></description>
        <pubDate>${new Date(p.publishedAt || p.createdAt).toUTCString()}</pubDate>
        <guid>${baseUrl}/post/${p.slug}</guid>
      </item>
    `).join('');
    res.header('Content-Type', 'application/rss+xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${siteName}</title><link>${baseUrl}</link><description>${siteTagline}</description>${items}</channel></rss>`);
  } catch (e: any) {
    const name = 'DawnWire';
    res.status(500).header('Content-Type', 'application/rss+xml').send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${name}</title><link>${process.env.APP_URL || ''}</link></channel></rss>`);
  }
});

// 404 tracker middleware
app.use('/api/public', async (req, _res, next) => {
  const publicPaths = ['/api/public/posts', '/api/public/pages', '/api/public/categories', '/api/public/settings', '/api/public/affiliate', '/api/public/comments', '/api/public/seo-meta'];
  if (!publicPaths.some(p => req.path.startsWith(p) || req.path === '/api/public/')) { next(); return; }
  next();
});

// Log 404s for non-API unmatched GET routes
app.use(async (req, res, next) => {
  const origSend = res.send.bind(res);
  const origJson = res.json.bind(res);
  res.send = function (body: any) { if (res.statusCode === 404 && !req.path.startsWith('/api/')) seo.log404(req.originalUrl, req.headers.referer); return origSend(body); } as any;
  res.json = function (body: any) { if (res.statusCode === 404 && !req.path.startsWith('/api/')) seo.log404(req.originalUrl, req.headers.referer); return origJson(body); } as any;
  next();
});

// ====== LLM CONTENT ENDPOINT ======
function formatCitation(title: string, publishedAt: string | undefined, siteName: string, url: string): { apa: string; mla: string } {
  let year = 'n.d.', monthDay = '';
  if (publishedAt) {
    const d = new Date(publishedAt);
    year = d.getFullYear().toString();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthDay = `${months[d.getMonth()]} ${d.getDate()}`;
  }
  const fullUrl = `${process.env.APP_URL || 'https://dawnwire.com'}/${url}`;
  return {
    apa: `${siteName}. (${year}). ${title}. ${siteName}. ${fullUrl}`,
    mla: `"${title}." ${siteName}, ${monthDay ? `${monthDay}, ` : ''}${year}, ${fullUrl}.`,
  };
}

app.get('/api/llm/content', async (_req, res) => {
  try {
    const rawPosts = await Promise.resolve(dbInstance.getPosts());
    const rawPages = await Promise.resolve(dbInstance.getPages());
    const reviews = await seo.getPublishedProductReviews();
    const faqs = await seo.getFaqs();
    const siteName = 'DawnWire';

    const posts = rawPosts
      .filter((p: any) => p.status === 'published' && (p.visibility == null || p.visibility === 'public'))
      .map((p: any) => {
        const entities = findEntities((p.title || '') + ' ' + (p.excerpt || '') + ' ' + (p.content || ''));
        return {
          title: p.title, slug: p.slug, excerpt: p.excerpt, content: (p.content || '').substring(0, 1000),
          category: p.categoryId, tags: p.tags, featuredImage: p.featuredImage,
          publishedAt: p.publishedAt, seoTitle: p.seoTitle, seoDescription: p.seoDescription,
          entities: entities.map(e => ({ name: e.name, sameAs: e.sameAs, type: e.type })),
          citation: formatCitation(p.title, p.publishedAt, siteName, `post/${p.slug}`),
        };
      });
    const productReviews = (reviews as any[]).map((r: any) => {
      const entities = findEntities((r.product_name || '') + ' ' + (r.brand || '') + ' ' + (r.review_summary || ''));
      return {
        productName: r.product_name, brand: r.brand, price: r.price, rating: r.rating,
        bestFor: r.best_for, reviewSummary: r.review_summary, finalVerdict: r.final_verdict,
        pros: r.pros, cons: r.cons, keyFeatures: r.key_features, productImage: r.product_image,
        slug: r.slug, affiliateUrl: r.affiliate_url,
        entities: entities.map(e => ({ name: e.name, sameAs: e.sameAs, type: e.type })),
        citation: r.product_name ? formatCitation(`${r.product_name} Review`, r.created_at, siteName, `products/${r.slug || r.id}`) : undefined,
      };
    });
    const llmFaqs = (faqs as any[]).filter((f: any) => f.status === 'published').map((f: any) => ({
      question: f.question, answer: f.answer, category: f.category,
    }));
    const pages = rawPages
      .filter((p: any) => p.status === 'published')
      .map((p: any) => {
        const entities = findEntities((p.title || '') + ' ' + (p.content || ''));
        return {
          title: p.title, slug: p.slug, content: (p.content || '').substring(0, 1000),
          entities: entities.map(e => ({ name: e.name, sameAs: e.sameAs, type: e.type })),
          citation: formatCitation(p.title, p.created_at, siteName, p.slug),
        };
      });

    res.json({
      site: { name: siteName, url: process.env.APP_URL || 'https://dawnwire.com' },
      summary: { posts: posts.length, productReviews: productReviews.length, faqs: llmFaqs.length, pages: pages.length },
      citationFormat: 'Each content item includes a "citation" object with APA and MLA formatted references.',
      posts, productReviews, faqs: llmFaqs, pages,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ====== LLM ENTITIES ENDPOINT ======
app.get('/api/llm/entities', (_req, res) => {
  res.json({
    total: getAllEntities().length,
    entities: getAllEntities().map(e => ({
      name: e.name, aliases: e.aliases, sameAs: e.sameAs, type: e.type, category: e.category,
    })),
  });
});

// ====== Affiliate redirects & tracking ======
app.get('/go/:slug', async (req, res) => {
  const url = await dbInstance.trackAffiliateClick(req.params.slug);
  if (!url) return res.status(404).send('<h1>Link Not Found</h1>');
  res.redirect(302, url);
});

// Check redirect by source URL
app.get('/api/redirect', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url required' });
  const redirect = await seo.checkRedirect(url as string);
  if (redirect) return res.redirect(redirect.target_url);
  res.status(404).json({ error: 'Not found' });
});

// AI Extract Product From Link — used by Admin "Link Importer Plugin" tab
app.post('/api/ai/extract-product-from-link', async (req, res) => {
  try {
    const { url, associateTag } = req.body;
    if (!url) return res.status(400).json({ error: 'url required' });

    const { extractAmazonProductData } = await import('../server/amazon-extractor');
    const productData = await extractAmazonProductData(url, associateTag || process.env.AMAZON_PARTNER_TAG || 'dawnwire-20');
    return res.json(productData);
  } catch (e: any) {
    return res.status(400).json({ error: e.message || 'Failed to extract product data from link.' });
  }
});

// AI Generate Product Review (Verdict, Pros, Cons, Award Badge)
app.post('/api/ai/generate-review', async (req, res) => {
  try {
    const { title, asin, category, brand, shortDescription } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const { generateProductAiReview } = await import('../server/ai-generator');
    const metadata = await generateProductAiReview({ title, asin, category, brand, shortDescription });
    return res.json(metadata);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'AI review generation failed.' });
  }
});

// AI Generate SEO Metadata (Title, Description, Keywords)
app.post('/api/ai/generate-seo', async (req, res) => {
  try {
    const { title, brand, category, shortDescription, mainFeatures, asin } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const { generateProductAiSeo } = await import('../server/ai-generator');
    const seoMetadata = await generateProductAiSeo({ title, brand, category, shortDescription, mainFeatures, asin });
    return res.json(seoMetadata);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'AI SEO generation failed.' });
  }
});

// AI Sentiment Analysis for product
app.post('/api/ai/sentiment', async (req, res) => {
  try {
    const { title, brand, rating, reviewCount, editorScore, pros, cons, reviewsText } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const hasRealReviews = typeof reviewsText === 'string' && reviewsText.length > 20;
    const { cohereChat } = await import('../server/ai');
    const systemPrompt = 'You are a sentiment analyst for DawnWire. Return strict, raw JSON only.';
    const prompt = hasRealReviews
      ? `Analyze the following customer reviews for "${title}" (Brand: ${brand}).

Customer reviews:
${reviewsText.substring(0, 8000)}

Return JSON matching:
{
  "overallSentiment": "Overwhelmingly Positive | Mostly Positive | Mixed | Mostly Negative | Overwhelmingly Negative",
  "positivePercentage": 72,
  "neutralPercentage": 18,
  "negativePercentage": 10,
  "summary": "2-3 sentence summary of what customers actually say about this product",
  "keyPositiveFactors": ["factor1", "factor2", "factor3"],
  "keyNegativeFactors": ["factor1", "factor2"],
  "featureRatings": { "buildQuality": 8.5, "valueForMoney": 7.8, "performance": 9.0, "easeOfUse": 8.2, "design": 8.7 }
}`
      : `Analyze customer sentiment for "${title}" (Brand: ${brand}, Rating: ${rating || 'N/A'}/5, Reviews: ${reviewCount || 0}).

Return JSON matching:
{
  "overallSentiment": "Overwhelmingly Positive | Mostly Positive | Mixed | Mostly Negative | Overwhelmingly Negative",
  "positivePercentage": 72,
  "neutralPercentage": 18,
  "negativePercentage": 10,
  "summary": "2-3 sentence summary of overall customer sentiment from reviews",
  "keyPositiveFactors": ["factor1", "factor2", "factor3"],
  "keyNegativeFactors": ["factor1", "factor2"],
  "featureRatings": { "buildQuality": 8.5, "valueForMoney": 7.8, "performance": 9.0, "easeOfUse": 8.2, "design": 8.7 }
}`;

    let data: any = null;
    try {
      const raw = await cohereChat(prompt, systemPrompt);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      data = JSON.parse(cleaned);
    } catch (_) { /* fallback below */ }

    if (!data || !data.overallSentiment) {
      const hasPros = Array.isArray(pros) && pros.length > 0;
      const hasCons = Array.isArray(cons) && cons.length > 0;
      const avg = Number(rating) || 0;
      data = {
        overallSentiment: hasRealReviews ? 'Mixed' : avg >= 4.5 ? 'Overwhelmingly Positive' : avg >= 4.0 ? 'Mostly Positive' : avg >= 3.0 ? 'Mixed' : avg >= 2.0 ? 'Mostly Negative' : 'Overwhelmingly Negative',
        positivePercentage: hasRealReviews ? 50 : avg >= 4.5 ? 82 : avg >= 4.0 ? 68 : avg >= 3.0 ? 45 : avg >= 2.0 ? 25 : 12,
        neutralPercentage: hasRealReviews ? 30 : avg >= 4.5 ? 12 : avg >= 4.0 ? 20 : avg >= 3.0 ? 30 : avg >= 2.0 ? 25 : 18,
        negativePercentage: hasRealReviews ? 20 : avg >= 4.5 ? 6 : avg >= 4.0 ? 12 : avg >= 3.0 ? 25 : avg >= 2.0 ? 50 : 70,
        summary: hasRealReviews
          ? `Based on analysis of actual customer reviews, the ${title} receives mixed feedback with notable praised features and some reported concerns.`
          : `Based on analysis of ${reviewCount || 'available'} customer reviews, the ${title} receives generally positive feedback.`,
        keyPositiveFactors: hasPros ? pros.slice(0, 3) : ['Build quality', 'Performance', 'Value for money'],
        keyNegativeFactors: hasCons ? cons.slice(0, 2) : ['Price point', 'Learning curve'],
        featureRatings: { buildQuality: 8.5, valueForMoney: 7.8, performance: 9.0, easeOfUse: 8.2, design: 8.7 }
      };
    }
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Sentiment analysis failed.' });
  }
});

// AI FAQ generation for product
app.post('/api/ai/faq', async (req, res) => {
  try {
    const { title, brand, category, specs, pros, cons, currentPrice, rating } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const { cohereChat } = await import('../server/ai');
    const specStr = specs ? (typeof specs === 'object' ? Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(', ') : String(specs)) : 'N/A';
    const systemPrompt = 'You are a product FAQ writer for DawnWire. Return strict, raw JSON only.';
    const prompt = `Generate 4-6 frequently asked questions and answers for "${title}" (Brand: ${brand || 'N/A'}, Category: ${category || 'N/A'}, Price: ${currentPrice || 'N/A'}, Rating: ${rating || 'N/A'}/5).

Specs: ${specStr.substring(0, 500)}
Pros: ${Array.isArray(pros) ? pros.join(', ') : 'N/A'}
Cons: ${Array.isArray(cons) ? cons.join(', ') : 'N/A'}

Return a JSON array matching:
[
  {
    "id": "faq-1",
    "question": "Question text?",
    "answer": "Detailed answer (2-3 sentences)",
    "category": "General | Features | Value | Setup | Comparison"
  }
]`;

    let data: any = null;
    try {
      const raw = await cohereChat(prompt, systemPrompt);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      data = JSON.parse(cleaned);
    } catch (_) { /* fallback below */ }

    if (!Array.isArray(data) || data.length === 0) {
      data = [
        { id: 'faq-1', question: `What is the price range for ${title}?`, answer: `The ${brand || title} is typically priced around $${currentPrice || 'N/A'} depending on retailer and current promotions.`, category: 'Value' },
        { id: 'faq-2', question: `Is ${title} worth buying?`, answer: `Based on customer ratings (${rating || 'N/A'}/5) and expert analysis, the ${title} offers solid performance in the ${category || 'product'} category.`, category: 'General' },
        { id: 'faq-3', question: `What are the main features of ${title}?`, answer: `Key features include: ${Array.isArray(pros) ? pros.slice(0, 3).join(', ') : 'high quality build, excellent performance, great value'}.`, category: 'Features' },
        { id: 'faq-4', question: `Where can I buy ${title}?`, answer: `The ${title} is available on Amazon with fast shipping. Check current pricing and availability online.`, category: 'General' },
      ];
    }
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'FAQ generation failed.' });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
});

// Global error handler — catches body-parser errors and any next(err) so an
// exception returns a JSON 500 instead of hanging the function into a 504.
// (Async route handlers must catch their own rejections; see route wrappers.)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err?.status || err?.statusCode || 500;
  if (status >= 500) console.error('[Global Error Handler]', err?.message || err);
  res.status(status).json({ error: err?.message || 'Internal server error' });
});

export default app;
