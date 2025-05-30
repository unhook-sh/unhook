import { homedir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'dist/test/**/*.test.js',
  userDataDir: join(homedir(), '.vscode-test-short'),
  mocha: {
    ui: 'tdd',
    timeout: 20000,
  },
});
