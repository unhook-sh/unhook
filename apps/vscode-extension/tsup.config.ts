import { defineConfig } from 'tsup';

// Build mode detection (production vs development)
const isDevBuild =
  process.argv.includes('--dev') ||
  process.env.NODE_ENV === 'development' ||
  process.env.CI !== 'true';

export default defineConfig({
  entry: ['src/extension.ts'],
  outDir: 'dist',
  format: ['cjs'], // VS Code extensions require CommonJS
  platform: 'node',
  target: 'node18',
  tsconfig: 'tsconfig.json',
  minify: !isDevBuild,
  sourcemap: isDevBuild ? 'inline' : false,
  bundle: true,
  splitting: false,
  treeshake: true,
  clean: false, // We handle cleaning in the npm script
  external: [
    'vscode',
    // Node.js built-ins
    'assert',
    'buffer',
    'child_process',
    'crypto',
    'events',
    'fs',
    'http',
    'https',
    'net',
    'os',
    'path',
    'process',
    'readline',
    'stream',
    'string_decoder',
    'url',
    'util',
    'zlib',
  ],
  noExternal: [
    // '@unhook/client',
    // Bundle all dependencies except Node.js built-ins and vscode
    /^(?!vscode$|assert$|buffer$|child_process$|crypto$|events$|fs$|http$|https$|net$|os$|path$|process$|readline$|stream$|string_decoder$|url$|util$|zlib$)/,
  ],
  onSuccess: async () => {
    console.log('✅ VS Code extension build complete');
  },
});
