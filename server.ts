import app from './api/app_source';
import path from 'path';
import fs from 'fs';
import express from 'express';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;
const distPath = path.join(process.cwd(), 'dist');

// Validate critical env vars at startup
if (!process.env.AI_GATEWAY_API_KEY && !process.env.COHERE_API_KEY) {
  console.warn('[Startup] WARNING: Neither AI_GATEWAY_API_KEY nor COHERE_API_KEY is set. All AI features (SEO optimization, article generation, sentiment analysis, FAQ generation, shopping assistant) will fail.');
}

// Static assets
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
