import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'dist/test/integ/**/*.test.js',
  // userDataDir: '/tmp/vscode-test',
  launchArgs: [
    '--user-data-dir',
    '/tmp/vscode-test',
    '--enable-proposed-api',
    'unhook.unhook-vscode',
  ],
  mocha: {
    timeout: 20000,
    ui: 'tdd',
  },
  version: '1.96.0',
});
