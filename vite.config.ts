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
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts') || id.includes('/d3-')) return 'charts';
            if (id.includes('hls.js')) return 'video';
            if (/firebase|@firebase/.test(id)) return 'firebase';
            if (id.includes('@knocklabs')) return 'knock';
            if (id.includes('framer-motion') || id.includes('/motion/') || id.includes('motion-dom')) return 'motion';
            if (id.includes('react-markdown') || id.includes('/remark-') || id.includes('/rehype-') || id.includes('/micromark') || id.includes('/hast') || id.includes('/mdast') || id.includes('/unist') || id.includes('/comma-separated-tokens') || id.includes('/space-separated-tokens')) return 'markdown';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('@ai-sdk') || id.includes('/ai/') || id.includes('zod')) return 'ai';
            if (id.includes('@react-aria') || id.includes('@react-stately') || id.includes('@react-types') || id.includes('@react-spectrum') || id.includes('@internationalized')) return 'aria';
            if (/\/node_modules\/react-dom\//.test(id) || id.includes('/node_modules/react/') || id.includes('/node_modules/scheduler/')) return 'react';
          },
        },
      },
    },
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
