import app from './api/app_source';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { renderHomePageHtml } from './server/ssr/home';
import { renderProductPageHtml } from './server/ssr/product';
import { renderCategoryPageHtml } from './server/ssr/category';
import { renderPostPageHtml } from './server/ssr/post';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;
const distPath = path.join(process.cwd(), 'dist');

// Validate critical env vars at startup
if (!process.env.AI_GATEWAY_API_KEY && !process.env.COHERE_API_KEY) {
  console.warn('[Startup] WARNING: Neither AI_GATEWAY_API_KEY nor COHERE_API_KEY is set. All AI features (SEO optimization, article generation, sentiment analysis, FAQ generation, shopping assistant) will fail.');
}

// Static assets
// Server-render dynamic pages before the static middleware so crawlers receive
// semantic HTML (H1, headings, editorial copy, internal links) in the raw
// response instead of the empty JS shell. The client React app hydrates over it.
// SSR cache: keyed by URL path, TTL 5 minutes
const ssrCache = new Map<string, { html: string; ts: number }>();
const SSR_TTL = 5 * 60 * 1000;

function serveSsr(render: () => Promise<string | null>, res: express.Response, next: express.NextFunction, cacheKey?: string) {
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) return next();

  const key = cacheKey || '__default__';
  const cached = ssrCache.get(key);
  if (cached && Date.now() - cached.ts < SSR_TTL) {
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=300');
    return res.type('html').send(cached.html);
  }

  (async () => {
    let ssrBody = '';
    try {
      const renderPromise = render();
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('SSR render timeout')), 10000)
      );
      ssrBody = (await Promise.race([renderPromise, timeoutPromise])) || '';
    } catch (e) {
      console.error('[SSR] render failed:', e);
    }
    if (!ssrBody) return next();
    const html = fs.readFileSync(indexPath, 'utf8');
    const full = html.replace('<div id="root"></div>', `<div id="root">${ssrBody}</div>`);
    ssrCache.set(key, { html: full, ts: Date.now() });
    // Evict oldest entries if cache grows too large
    if (ssrCache.size > 200) {
      const oldest = ssrCache.keys().next().value;
      if (oldest) ssrCache.delete(oldest);
    }
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=300');
    return res.type('html').send(full);
  })().catch(next);
}

app.get('/', (req, res, next) => serveSsr(renderHomePageHtml, res, next, '/'));

// Product review detail pages (/products/:slug and legacy /product/:slug)
app.get('/products/:slug', (req, res, next) => serveSsr(() => renderProductPageHtml(req.params.slug), res, next, `/products/${req.params.slug}`));

// Category landing pages (/categories/:slug)
app.get('/categories/:slug', (req, res, next) => serveSsr(() => renderCategoryPageHtml(req.params.slug), res, next, `/categories/${req.params.slug}`));

// Editorial post pages (/post/:slug)
app.get('/post/:slug', (req, res, next) => serveSsr(() => renderPostPageHtml(req.params.slug), res, next, `/post/${req.params.slug}`));

app.use(express.static(distPath));

// Fallback to dist/index.html for SPA client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || /\.[a-z0-9]{2,12}$/i.test(req.path)) {
    return next();
  }

  const validPatterns = [
    /^\/$/, /^\/products\/?$/, /^\/products\/[^\/]+$/,
    /^\/categories\/?$/, /^\/categories\/[^\/]+$/,
    /^\/deals\/?$/, /^\/compare\/?$/, /^\/compare\/[^\/]+$/,
    /^\/reviews\/?$/, /^\/guides\/?$/, /^\/wishlist\/?$/,
    /^\/admin\/?$/, /^\/admin\/.*$/,
    /^\/account\/?$/, /^\/login\/?$/,
    /^\/post\/[^\/]+$/, /^\/page\/[^\/]+$/,
    /^\/contact\/?$/,    /^\/buyers-guide\/[^\/]+$/, /^\/buying-guides\/?$/,
    /^\/review\/[^\/]+$/, /^\/portfolio\/?$/,
    /^\/portfolio\/[^\/]+$/, /^\/service\/?$/,
    /^\/service\/[^\/]+$/, /^\/search\/?$/, /^\/trending\/?$/,
    /^\/best\/?$/, /^\/brands\/?$/, /^\/about\/?$/,
    /^\/privacy-policy\/?$/, /^\/terms\/?$/,
    /^\/affiliate-disclosure\/?$/, /^\/sitemap\.xml$/,
    /^\/robots\.txt$/, /^\/llms\.txt$/,
  ];

  const isValid = validPatterns.some(p => p.test(req.path));
  if (!isValid) {
    return res.status(404).sendFile(path.join(distPath, '404.html'));
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

export default app;

if (!isVercel) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] DawnWire Server booted on port ${PORT}`);
  });
}
