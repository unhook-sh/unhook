import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/setup.ts'],
    testTimeout: 300000, // 5 minutes for integration tests
    hookTimeout: 600000, // 10 minutes for setup/teardown
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/setup.ts',
        'test-utils/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/.eslintrc.*',
        'dist/**',
      ],
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially in CI for database consistency
      },
    },
    reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],
    sequence: {
      concurrent: false, // Run tests sequentially for database consistency
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test-utils': path.resolve(__dirname, './test-utils'),
    },
  },
});
