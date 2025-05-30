import { defineConfig } from 'vite';
import baseConfig from './vite.config';

export default defineConfig({
  ...baseConfig,
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
      protocol: 'ws',
      clientPort: 5173,
      timeout: 30000,
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  build: {
    ...baseConfig.build,
    watch: {
      include: ['src/webview/**/*'],
    },
    minify: false,
    sourcemap: true,
  },
});
