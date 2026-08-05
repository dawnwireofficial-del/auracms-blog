import app from './api/app_source';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { renderHomePageHtml } from './server/ssr/home';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;
const distPath = path.join(process.cwd(), 'dist');

// Validate critical env vars at startup
if (!process.env.AI_GATEWAY_API_KEY && !process.env.COHERE_API_KEY) {
  console.warn('[Startup] WARNING: Neither AI_GATEWAY_API_KEY nor COHERE_API_KEY is set. All AI features (SEO optimization, article generation, sentiment analysis, FAQ generation, shopping assistant) will fail.');
}

// Static assets
// Server-render the homepage before the static middleware so crawlers receive
// semantic HTML (H1, headings, editorial copy, internal links) in the raw
// response instead of the empty JS shell. The client React app hydrates over it.
app.get('/', async (req, res, next) => {
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) return next();
  let ssrBody = '';
  try {
    ssrBody = await renderHomePageHtml();
  } catch (e) {
    console.error('[SSR] homepage render failed:', e);
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=300');
  return res.type('html').send(html.replace('<div id="root"></div>', `<div id="root">${ssrBody}</div>`));
});

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
    /^\/contact\/?$/, /^\/buyers-guide\/[^\/]+$/,
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
