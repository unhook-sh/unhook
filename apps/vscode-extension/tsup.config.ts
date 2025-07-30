import { defineConfig } from 'tsup';

// Build mode detection (production vs development)
const isDevBuild =
  process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

export default defineConfig({
  bundle: true,
  clean: false,
  entry: ['src/extension.ts'], // VS Code extensions require CommonJS
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? '',
    NEXT_PUBLIC_APP_ENV: isDevBuild ? 'development' : 'production',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '',
    NEXT_PUBLIC_IS_SELF_HOSTED: Boolean(
      process.env.NEXT_PUBLIC_IS_SELF_HOSTED === 'false',
    ).toString(),
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? '',
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_VSCODE_EXTENSION_ID:
      process.env.NEXT_PUBLIC_VSCODE_EXTENSION_ID ?? 'unhook.unhook-vscode',
    NODE_ENV: isDevBuild ? 'development' : 'production',
  },
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
  format: ['cjs'],
  minify: !isDevBuild,
  noExternal: [
    '@unhook/client',
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
