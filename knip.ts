import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreDependencies: ['cz-conventional-changelog'],
  workspaces: {
    '.': {
      entry: 'checkly.config.ts',
    },
    'apps/*': {
      entry: ['**/*.test.ts'],
    },
    'packages/*': {
      entry: ['**/*.test.ts'],
    },
  },
};

export default config;
