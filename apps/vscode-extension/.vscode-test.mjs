import { homedir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'dist/test/**/*.test.js',
  mocha: {
    timeout: 20000,
    ui: 'tdd',
  },
  userDataDir: join(homedir(), '.vscode-test-short'),
});
