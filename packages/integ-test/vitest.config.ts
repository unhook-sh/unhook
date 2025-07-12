import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test-utils': path.resolve(__dirname, './test-utils'),
    },
  },
  test: {
    coverage: {
      exclude: [
        'node_modules/**',
        'src/setup.ts',
        'test-utils/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/.eslintrc.*',
        'dist/**',
      ],
      reporter: ['text', 'json', 'html'],
    },
    environment: 'node',
    globals: true,
    hookTimeout: 600000, // 10 minutes for setup/teardown
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
    setupFiles: ['./src/setup.ts'],
    testTimeout: 300000, // 5 minutes for integration tests
  },
});
