import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@unhook/db', '@unhook/logger', 'drizzle-orm', 'isolated-vm'],
});
