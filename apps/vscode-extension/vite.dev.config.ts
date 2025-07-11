import { defineConfig } from 'vite';
import baseConfig from './vite.config';

export default defineConfig({
  ...baseConfig,
  build: {
    ...baseConfig.build,
    minify: false,
    sourcemap: true,
    watch: {
      include: ['src/request-details-webview/**/*'],
    },
  },
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    },
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
    },
    port: 5173,
    strictPort: true,
    watch: {
      interval: 1000,
      usePolling: true,
    },
  },
});
