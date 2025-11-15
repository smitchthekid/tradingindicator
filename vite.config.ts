import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 2500,
    open: true,
    strictPort: false,
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // Extract symbol from query parameter
          const match = path.match(/[?&]symbol=([^&]+)/);
          if (match) {
            const symbol = encodeURIComponent(match[1]);
            return `/v8/finance/chart/${symbol}?interval=1d&range=2y&includePrePost=false`;
          }
          return path.replace(/^\/api\/yahoo/, '/v8/finance/chart');
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('Proxy error:', err);
            res.writeHead(500, {
              'Content-Type': 'text/plain',
            });
            res.end('Proxy error: ' + err.message);
          });
        },
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
          'utils-vendor': ['date-fns', 'zod'],
          'state-vendor': ['jotai']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})

