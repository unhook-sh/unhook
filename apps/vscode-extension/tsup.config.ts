import { defineConfig } from 'tsup';

// Build mode detection (production vs development)
const isDevBuild =
  process.argv.includes('--dev') ||
  process.env.NODE_ENV === 'development' ||
  process.env.CI !== 'true';

export default defineConfig({
  bundle: true,
  clean: false,
  entry: ['src/extension.ts'], // VS Code extensions require CommonJS
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
    '@unhook/client',
    'zlib',
  ],
  format: ['cjs'],
  minify: !isDevBuild,
  noExternal: [
    // Bundle all dependencies except Node.js built-ins and vscode
    /^(?!vscode$|assert$|buffer$|child_process$|crypto$|events$|fs$|http$|https$|net$|os$|path$|process$|readline$|stream$|string_decoder$|url$|util$|zlib$)/,
  ],
  onSuccess: async () => {
    console.log('✅ VS Code extension build complete');
  },
  outDir: 'dist',
  platform: 'node',
  sourcemap: isDevBuild ? 'inline' : false,
  splitting: false, // We handle cleaning in the npm script
  target: 'node18',
  treeshake: true,
  tsconfig: 'tsconfig.json',
});
