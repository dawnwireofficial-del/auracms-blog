import app from './api/app_source';
import path from 'path';
import fs from 'fs';
import express from 'express';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;
const distPath = path.join(process.cwd(), 'dist');

// Static assets
app.use(express.static(distPath));

// Fallback to dist/index.html for SPA client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || /\.[a-z0-9]{2,12}$/i.test(req.path)) {
    return next();
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
