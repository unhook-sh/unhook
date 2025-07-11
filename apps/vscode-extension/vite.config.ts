import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: {
    emptyOutDir: true,
    outDir: resolve(process.cwd(), 'dist/request-details-webview'),
    sourcemap: true,
  },
  css: {
    postcss: resolve(process.cwd(), 'postcss.config.mjs'),
  },
  optimizeDeps: {
    exclude: ['@unhook/db', '@unhook/logger', '@unhook/ui'],
  },
  plugins: [react()],
  root: resolve(process.cwd(), 'src/request-details-webview'),
});
