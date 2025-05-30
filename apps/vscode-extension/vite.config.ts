import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: resolve(process.cwd(), 'src/webview'),
  base: './',
  build: {
    outDir: resolve(process.cwd(), 'dist/webview'),
    emptyOutDir: true,
    sourcemap: true,
  },
});
