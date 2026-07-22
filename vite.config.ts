import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function dawnwireApiPlugin(): Plugin {
  return {
    name: 'dawnwire-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/analytics/affiliate-click' && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'success', loggedAt: new Date().toISOString() }));
          return;
        }

        if (req.url?.startsWith('/api/deals/trending') && req.method === 'GET') {
          try {
            const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/deals/trending`);
            const data = await response.json();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ timestamp: new Date().toISOString(), deals: [] }));
          }
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
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
