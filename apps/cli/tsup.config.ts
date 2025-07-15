import * as fs from 'node:fs';
import { defineConfig } from 'tsup';

// Read package.json to get version
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

// Build mode detection (production vs development)
const isDevBuild =
  process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

// Environment variables to inject at build time
const envDefines = {
  'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(
    process.env.NEXT_PUBLIC_API_URL || 'https://unhook.sh',
  ),
  'process.env.NEXT_PUBLIC_APP_ENV': JSON.stringify(
    process.env.NEXT_PUBLIC_APP_ENV || 'production',
  ),
  'process.env.NEXT_PUBLIC_APP_TYPE': JSON.stringify(
    process.env.NEXT_PUBLIC_APP_TYPE || 'cli',
  ),
  'process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY': JSON.stringify(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  ),
  'process.env.NEXT_PUBLIC_CLI_VERSION': JSON.stringify(pkg.version),
  'process.env.NEXT_PUBLIC_POSTHOG_HOST': JSON.stringify(
    process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  ),
  'process.env.NEXT_PUBLIC_POSTHOG_KEY': JSON.stringify(
    process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
  ),
  'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  ),
  'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  ),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
};

export default defineConfig({
  bundle: true,
  clean: true,
  define: envDefines,
  entry: ['src/cli.tsx'],
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
          namespace: 'ignore-devtools',
          path: 'react-devtools-core',
        }));
        build.onLoad({ filter: /.*/, namespace: 'ignore-devtools' }, () => ({
          contents: 'export default {};',
          loader: 'js',
        }));
      },
    });
  },
  external: [
    'keytar', // Native module
    'posthog-js',
    '@unhook/client',
  ],
  format: ['esm'],
  minify: !isDevBuild,
  noExternal: [
    '@unhook/api',
    '@unhook/db',
    '@unhook/id',
    '@unhook/logger',
    '@unhook/utils',
    '@unhook/zustand',
  ],
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
  outDir: 'bin',
  platform: 'node', // We handle cleaning in the npm script
  sourcemap: 'inline',
  splitting: false,
  target: 'node18',
  treeshake: true,
  tsconfig: 'tsconfig.json',
});
