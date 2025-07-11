import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  external: ['@unhook/db', '@unhook/logger', 'drizzle-orm', 'isolated-vm'],
  format: ['esm'],
});
