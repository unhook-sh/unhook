export interface PackageJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

export interface ReleaseConfig {
  bumpType: 'patch' | 'minor' | 'major';
  packages: 'all' | 'cli' | 'client' | 'vscode';
  dryRun: boolean;
  interactive: boolean;
  includeCommitList: boolean;
}

export interface PackageInfo {
  name: string;
  path: string;
  packageJsonPath: string;
  changelogPath: string;
  tagPrefix: string;
  changelogEnvVar: string;
  /** If true, skip npm publishing (e.g., VSCode extension publishes via separate workflow) */
  skipNpmPublish?: boolean;
}

export interface ReleaseResult {
  pkg: string;
  version: string;
  changes: string;
}

export const REPO_URL = 'https://github.com/unhook-sh/unhook';

export const PACKAGES: Record<string, PackageInfo> = {
  cli: {
    changelogEnvVar: 'CLI_CHANGELOG',
    changelogPath: 'apps/cli/CHANGELOG.md',
    name: '@unhook/cli',
    packageJsonPath: 'apps/cli/package.json',
    path: 'apps/cli',
    tagPrefix: 'cli-v',
  },
  client: {
    changelogEnvVar: 'CLIENT_CHANGELOG',
    changelogPath: 'packages/client/CHANGELOG.md',
    name: '@unhook/client',
    packageJsonPath: 'packages/client/package.json',
    path: 'packages/client',
    tagPrefix: 'client-v',
  },
  vscode: {
    changelogEnvVar: 'VSCODE_CHANGELOG',
    changelogPath: 'apps/vscode-extension/CHANGELOG.md',
    name: 'unhook-vscode',
    packageJsonPath: 'apps/vscode-extension/package.json',
    path: 'apps/vscode-extension',
    skipNpmPublish: true, // VSCode extension publishes via separate workflow to VS Marketplace
    tagPrefix: 'vscode-v',
  },
};
