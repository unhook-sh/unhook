import { defineConfig } from 'tsup';

// Build mode detection (production vs development)
const isDevBuild =
  process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

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
    'vscode', // VS Code API is provided by the runtime
  ],
  noExternal: ['@unhook/client'],
  onSuccess: async () => {
    console.log('✅ VS Code extension build complete');
  },
});
