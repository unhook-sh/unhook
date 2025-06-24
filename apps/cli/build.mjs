import * as fs from 'node:fs';
import * as path from 'node:path';
import * as esbuild from 'esbuild';

const OUT_DIR = 'bin';

/**
 * ink attempts to import react-devtools-core in an ESM-unfriendly way:
 * This plugin ignores the import to prevent dynamic require issues.
 */
const ignoreReactDevToolsPlugin = {
  name: 'ignore-react-devtools',
  setup(build) {
    // When an import for 'react-devtools-core' is encountered,
    // return an empty module.
    build.onResolve({ filter: /^react-devtools-core$/ }, (args) => {
      return { path: args.path, namespace: 'ignore-devtools' };
    });
    build.onLoad({ filter: /.*/, namespace: 'ignore-devtools' }, () => {
      return { contents: '', loader: 'js' };
    });
  },
};

// Build mode detection (production vs development)
const isDevBuild =
  process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

const plugins = [ignoreReactDevToolsPlugin];

// Build Hygiene, ensure we drop previous bin dir and any leftover files
const outPath = path.resolve(OUT_DIR);
if (fs.existsSync(outPath)) {
  fs.rmSync(outPath, { recursive: true, force: true });
}

// Add a shebang that enables source‑map support for dev builds
if (isDevBuild) {
  const devShebangLine =
    '#!/usr/bin/env -S NODE_OPTIONS=--enable-source-maps node\n';
  const devShebangPlugin = {
    name: 'dev-shebang',
    setup(build) {
      build.onEnd(async () => {
        const outFile = path.resolve(`${OUT_DIR}/cli.js`);
        let code = await fs.promises.readFile(outFile, 'utf8');
        if (code.startsWith('#!')) {
          code = code.replace(/^#!.*\n/, devShebangLine);
          await fs.promises.writeFile(outFile, code, 'utf8');
        }
      });
    },
  };
  plugins.push(devShebangPlugin);
}

// Environment variables to inject at build time from Infisical
const envDefines = {
  'process.env.NODE_ENV': JSON.stringify('production'),
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

esbuild
  .build({
    entryPoints: ['src/cli.tsx'],
    // External dependencies that shouldn't be bundled
    external: [
      '../package.json',
      './package.json',
      'keytar', // Native module
      'posthog-js',
    ],
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node18',
    tsconfig: 'tsconfig.json',
    outfile: `${OUT_DIR}/cli.js`,
    minify: !isDevBuild,
    sourcemap: isDevBuild ? 'inline' : false,
    banner: {
      js: isDevBuild ? '' : '#!/usr/bin/env node',
    },
    define: envDefines,
    plugins,
    inject: ['./require-shim.js'],
  })
  .then(() => {
    // Make the output file executable
    const outFile = path.resolve(`${OUT_DIR}/cli.js`);
    fs.chmodSync(outFile, 0o755);
    console.log(`✅ Build complete: ${outFile}`);
  })
  .catch((error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
