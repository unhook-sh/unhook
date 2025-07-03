import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.tsx'],
  format: ['esm'],
  dts: false,
  clean: true,
  minify: true,
  outDir: 'bin',
  outExtension() {
    return {
      js: '.js',
    };
  },
  esbuildOptions(options) {
    options.platform = 'node';
    options.target = ['node18'];
  },
});
