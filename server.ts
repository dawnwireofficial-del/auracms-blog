import app from './api/app_source';
import { renderPage } from 'vike/server';
import path from 'path';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;
const distPath = path.join(process.cwd(), 'dist', 'client');

// Vike SSR middleware — handles all HTML routes
app.use(async (req, res, next) => {
    if (req.path.startsWith('/api/') || /\.[a-z0-9]{2,12}$/i.test(req.path)) {
    return next();
  }
  const pageContextInit = { urlOriginal: req.originalUrl || req.url };
  try {
    const pageContext = await renderPage(pageContextInit);
    if (pageContext?.httpResponse) {
      const { body, statusCode, headers } = pageContext.httpResponse;
      res.status((pageContext as any).is404 ? 404 : statusCode);
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, String(value));
        }
      }
      res.send(body);
    } else {
      next();
    }
  } catch (err) {
    next();
  }
});

import serveStatic from 'serve-static';

// Static assets (only on production/Vercel)
if (isProduction || isVercel) {
  app.use(serveStatic(distPath, { index: false }));
}

export default app;

// Dev mode: use Vite middleware for HMR, then start listening
if (!isProduction && !isVercel) {
  (async () => {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] DawnWire Server booted successfully on port ${PORT}`);
    });
  })();
}

// Production standalone (not Vercel)
if (isProduction && !isVercel) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] DawnWire Server booted successfully on port ${PORT}`);
  });
}
