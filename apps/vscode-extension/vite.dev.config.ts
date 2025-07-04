import { defineConfig } from 'vite';
import baseConfig from './vite.config';

export default defineConfig({
  ...baseConfig,
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    hmr: {
      port: 5173,
      protocol: 'ws',
      host: 'localhost',
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  build: {
    ...baseConfig.build,
    watch: {
      include: ['src/request-details-webview/**/*'],
    },
    minify: false,
    sourcemap: true,
  },
});
