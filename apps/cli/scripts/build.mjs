import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

async function buildCli() {
  try {
    // Build with esbuild
    await build({
      entryPoints: [join(ROOT_DIR, 'src/cli.tsx')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: join(ROOT_DIR, 'dist/cli.js'),
      format: 'esm',
      external: ['@acme/*'],
      banner: {
        js: '#!/usr/bin/env node',
      },
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      minify: true,
      sourcemap: true,
    });

    console.log('✅ CLI built successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildCli();
