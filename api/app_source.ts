import express from 'express';
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

// HTTPS redirect & HSTS
app.use((req, res, next) => {
  const proto = req.headers['x-forwarded-proto'] as string | undefined;
  if (proto && proto !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
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
    const deals = (products as any[])
      .filter((p: any) => p.is_deal || p.deal_badge)
      .slice(0, 8)
      .map((p: any) => ({
        id: p.id,
        title: p.product_name,
        brand: p.brand,
        category: p.best_for || '',
        currentPrice: p.price,
        referencePrice: p.original_price,
        discountPercentage: p.original_price && p.price ? Math.round((1 - p.price / p.original_price) * 100) : 0,
        rating: p.rating,
        reviewCount: p.review_count,
        images: p.product_image ? [p.product_image] : [],
        asin: p.specs?.asin || '',
        affiliateUrl: p.affiliate_url || '',
        dealBadge: p.deal_badge || '',
        expiresInHours: 0
      }));
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
    "connect-src 'self' https://api.cohere.com https://www.google-analytics.com https://analytics.google.com https://m.media-amazon.com https://images-na.ssl-images-amazon.com",
    "media-src 'self' https: blob:",
  ].join('; '));
  next();
});

// Scheduled post publisher — checks every 60s
let lastSchedulerRun = 0;
let lastAmazonSyncRun = 0;
app.use(async (_req, res, next) => {
  const now = Date.now();
  if (now - lastSchedulerRun > 60_000) {
    lastSchedulerRun = now;
    try {
      const { processScheduledPosts } = await import('../server/scheduler');
      const result = await processScheduledPosts();
      if (result.published > 0) {
        console.log(`[Scheduler] Published ${result.published} scheduled posts`);
      }
    } catch (e) { console.error(e) }
  }
  if (now - lastAmazonSyncRun > 120_000) {
    lastAmazonSyncRun = now;
    try {
      const { runScheduledSync } = await import('../server/amazon-sync-engine');
      const result = await runScheduledSync();
      if (result.processed > 0) {
        console.log(`[Amazon Sync] Synced ${result.succeeded}/${result.processed} products`);
      }
    } catch (e) { console.error(e) }
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

  if (req.path.startsWith('/review/')) {
    const slug = req.path.substring(8);
    if (slug) return res.redirect(301, `/products/${slug}`);
  }

  if (req.path === '/review' || req.path === '/review/' || req.path === '/reviews' || req.path === '/reviews/') {
    return res.redirect(301, '/products');
  }

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
      `<url><loc>${baseUrl}/buying-guides</loc><priority>0.7</priority></url>`,
      // Affiliate product review detail pages (canonical /products/ route)
      ...reviews.map((r: any) => `<url><loc>${baseUrl}/products/${r.slug || r.id}</loc><lastmod>${fmtDate(r.updated_at)}</lastmod><priority>0.9</priority></url>`),
      // Affiliate category browse pages
      ...cats.map((c: any) => `<url><loc>${baseUrl}/browse/${c.slug}</loc><priority>0.8</priority></url>`),
      // Buying guide pages
      ...cats.map((c: any) => `<url><loc>${baseUrl}/buyers-guide/${c.slug}</loc><priority>0.6</priority></url>`),
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
    const posts = (await dbInstance.getPosts()).filter(p => p.status === 'published' && p.visibility === 'public');
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
      .filter((p: any) => p.status === 'published' && p.visibility === 'public')
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
        citation: r.product_name ? formatCitation(`${r.product_name} Review`, r.created_at, siteName, `review/${r.slug || r.id}`) : undefined,
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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), uptime: process.uptime() });
});

export default app;
