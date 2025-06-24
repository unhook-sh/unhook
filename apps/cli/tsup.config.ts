import * as fs from 'node:fs';
import { defineConfig } from 'tsup';

// Read package.json to get version
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

// Build mode detection (production vs development)
const isDevBuild =
  process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

// Environment variables to inject at build time
const envDefines = {
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  'process.env.NEXT_PUBLIC_CLI_VERSION': JSON.stringify(pkg.version),
  'process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': JSON.stringify(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  ),
  'process.env.NEXT_PUBLIC_POSTHOG_KEY': JSON.stringify(
    process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
  ),
  'process.env.NEXT_PUBLIC_POSTHOG_HOST': JSON.stringify(
    process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  ),
  'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(
    process.env.NEXT_PUBLIC_API_URL || 'https://api.unhook.sh',
  ),
  'process.env.NEXT_PUBLIC_APP_ENV': JSON.stringify(
    process.env.NEXT_PUBLIC_APP_ENV || 'production',
  ),
  'process.env.NEXT_PUBLIC_APP_TYPE': JSON.stringify(
    process.env.NEXT_PUBLIC_APP_TYPE || 'cli',
  ),
  'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  ),
  'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  ),
};

export default defineConfig({
  entry: ['src/cli.tsx'],
  outDir: 'bin',
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  tsconfig: 'tsconfig.json',
  minify: !isDevBuild,
  sourcemap: 'inline',
  bundle: true,
  splitting: false,
  treeshake: true,
  clean: true, // We handle cleaning in the npm script
  external: [
    'keytar', // Native module
    'posthog-js',
  ],
  noExternal: [
    '@unhook/api',
    '@unhook/client',
    '@unhook/db',
    '@unhook/id',
    '@unhook/logger',
    '@unhook/utils',
    '@unhook/zustand',
  ],
  define: envDefines,
  esbuildOptions(options) {
    // Add shebang for executable
    // options.banner = {
    //   js: isDevBuild ? '' : '#!/usr/bin/env node',
    // };

    // Inject require shim for ESM compatibility and React
    options.inject = ['./require-shim.js'];
    options.jsx = 'automatic';

    // Add plugin to handle react-devtools-core import issue
    options.plugins = options.plugins || [];
    options.plugins.push({
      name: 'ignore-react-devtools',
      setup(build) {
        build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
          path: 'react-devtools-core',
          namespace: 'ignore-devtools',
        }));
        build.onLoad({ filter: /.*/, namespace: 'ignore-devtools' }, () => ({
          contents: 'export default {};',
          loader: 'js',
        }));
      },
    });
  },
  onSuccess: async () => {
    // Make the output file executable
    const outFile = './bin/cli.js';
    if (fs.existsSync(outFile)) {
      fs.chmodSync(outFile, 0o755);

      // Add dev shebang for development builds
      if (isDevBuild) {
        const devShebangLine =
          '#!/usr/bin/env -S NODE_OPTIONS=--enable-source-maps node\n';
        let code = await fs.promises.readFile(outFile, 'utf8');
        if (code.startsWith('#!')) {
          code = code.replace(/^#!.*\n/, devShebangLine);
          await fs.promises.writeFile(outFile, code, 'utf8');
        }
      }

      console.log(`✅ Build complete: ${outFile}`);
    }
  },
});
