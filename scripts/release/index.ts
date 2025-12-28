#!/usr/bin/env bun
/**
 * Release script for @unhook/cli and @unhook/client
 *
 * Interactive mode (default):
 *   bun scripts/release
 *
 * Non-interactive mode (for CI):
 *   bun scripts/release --bump patch --packages all --ci
 *   bun scripts/release --bump minor --packages cli --dry-run
 *   bun scripts/release --bump patch --packages all --include-commits
 *
 * Environment variables:
 *   OPENROUTER_API_KEY - Optional, for AI-generated changelogs
 *   DRY_RUN - If set to "true", skips npm publish and git push
 *   CLI_CHANGELOG - Pre-generated changelog for CLI (from GitHub Action)
 *   CLIENT_CHANGELOG - Pre-generated changelog for client (from GitHub Action)
 *   CI - If set, defaults to non-interactive mode
 */

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { generateChangelog, updateChangelogFile } from './changelog';
import {
  commitAndTag,
  createGitHubRelease,
  getCommitsSinceTag,
  getLatestTag,
} from './git';
import { buildPackages, installDependencies, publishToNpm } from './npm';
import { PACKAGES, type ReleaseConfig, type ReleaseResult } from './types';
import {
  bumpVersion,
  getCurrentVersion,
  updatePackageVersion,
} from './version';

async function runInteractive(): Promise<ReleaseConfig> {
  p.intro(pc.bgCyan(pc.black(' 🚀 Unhook Release ')));

  const packages = await p.select({
    message: 'Which packages do you want to release?',
    options: [
      {
        hint: '@unhook/cli + @unhook/client',
        label: 'All packages',
        value: 'all',
      },
      { hint: '@unhook/cli', label: 'CLI only', value: 'cli' },
      { hint: '@unhook/client', label: 'Client only', value: 'client' },
    ],
  });

  if (p.isCancel(packages)) {
    p.cancel('Release cancelled');
    process.exit(0);
  }

  // Show current versions
  const packagesToRelease =
    packages === 'all' ? ['cli', 'client'] : [packages as string];
  for (const pkgKey of packagesToRelease) {
    const pkg = PACKAGES[pkgKey];
    if (pkg) {
      const currentVersion = getCurrentVersion(pkg);
      p.note(`${pkg.name}: v${currentVersion}`, 'Current version');
    }
  }

  const bumpType = await p.select({
    message: 'What type of version bump?',
    options: [
      { hint: '0.0.x - Bug fixes', label: 'Patch', value: 'patch' },
      { hint: '0.x.0 - New features', label: 'Minor', value: 'minor' },
      { hint: 'x.0.0 - Breaking changes', label: 'Major', value: 'major' },
    ],
  });

  if (p.isCancel(bumpType)) {
    p.cancel('Release cancelled');
    process.exit(0);
  }

  // Show what the new versions will be
  const versionInfo: string[] = [];
  for (const pkgKey of packagesToRelease) {
    const pkg = PACKAGES[pkgKey];
    if (pkg) {
      const currentVersion = getCurrentVersion(pkg);
      const newVersion = bumpVersion(
        currentVersion,
        bumpType as 'patch' | 'minor' | 'major',
      );
      versionInfo.push(`${pkg.name}: v${currentVersion} → v${newVersion}`);
    }
  }
  p.note(versionInfo.join('\n'), 'Version changes');

  const includeCommitList = await p.confirm({
    initialValue: false,
    message: 'Include detailed commit list in changelog?',
  });

  if (p.isCancel(includeCommitList)) {
    p.cancel('Release cancelled');
    process.exit(0);
  }

  const dryRun = await p.confirm({
    initialValue: false,
    message: 'Run in dry-run mode? (skip publishing and git push)',
  });

  if (p.isCancel(dryRun)) {
    p.cancel('Release cancelled');
    process.exit(0);
  }

  const shouldProceed = await p.confirm({
    initialValue: true,
    message: dryRun
      ? 'Ready to start dry-run release?'
      : 'Ready to release? This will publish to npm and push to git.',
  });

  if (p.isCancel(shouldProceed) || !shouldProceed) {
    p.cancel('Release cancelled');
    process.exit(0);
  }

  return {
    bumpType: bumpType as 'patch' | 'minor' | 'major',
    dryRun: dryRun as boolean,
    includeCommitList: includeCommitList as boolean,
    interactive: true,
    packages: packages as 'all' | 'cli' | 'client',
  };
}

function parseCliArgs(): ReleaseConfig {
  const { values } = parseArgs({
    allowNegative: true,
    args: process.argv.slice(2),
    options: {
      bump: {
        default: 'patch',
        short: 'b',
        type: 'string',
      },
      ci: {
        default: false,
        type: 'boolean',
      },
      'dry-run': {
        default: false,
        type: 'boolean',
      },
      'include-commits': {
        default: false,
        type: 'boolean',
      },
      interactive: {
        default: true,
        short: 'i',
        type: 'boolean',
      },
      packages: {
        default: 'all',
        short: 'p',
        type: 'string',
      },
    },
  });

  // CI mode or explicit --ci flag disables interactive
  const isInteractive =
    process.env.CI || values.ci ? false : (values.interactive as boolean);

  return {
    bumpType: values.bump as 'patch' | 'minor' | 'major',
    dryRun: values['dry-run'] || process.env.DRY_RUN === 'true',
    includeCommitList: values['include-commits'] as boolean,
    interactive: isInteractive,
    packages: values.packages as 'all' | 'cli' | 'client',
  };
}

async function releasePackage(
  pkgKey: string,
  config: ReleaseConfig,
  spinner: ReturnType<typeof p.spinner>,
): Promise<ReleaseResult> {
  const pkg = PACKAGES[pkgKey];
  if (!pkg) throw new Error(`Unknown package: ${pkgKey}`);

  // Get current and new version
  const currentVersion = getCurrentVersion(pkg);
  const newVersion = bumpVersion(currentVersion, config.bumpType);

  spinner.message(`${pkg.name}: Checking git history...`);

  // Get latest tag and commits
  const latestTag = await getLatestTag(pkg.tagPrefix);
  const commits = await getCommitsSinceTag(latestTag, pkg.path);

  spinner.message(
    `${pkg.name}: Generating changelog (${commits.length} commits)...`,
  );

  // Check for pre-generated changelog from GitHub Action
  const preGeneratedChangelog = process.env[pkg.changelogEnvVar];

  // Generate changelog
  const changes = await generateChangelog(
    commits,
    pkg.name,
    latestTag,
    pkg.path, // Path filter for git commands
    { includeCommitList: config.includeCommitList },
    preGeneratedChangelog,
  );

  spinner.message(`${pkg.name}: Updating files...`);

  // Update changelog file
  updateChangelogFile(pkg, newVersion, changes, config.bumpType);

  // Update package.json version
  updatePackageVersion(pkg, newVersion);

  return { changes, pkg: pkgKey, version: newVersion };
}

async function main() {
  let config: ReleaseConfig;

  // Determine mode
  const cliArgs = parseCliArgs();

  if (cliArgs.interactive && process.stdin.isTTY) {
    config = await runInteractive();
  } else {
    config = cliArgs;

    // Validate in non-interactive mode
    if (!['patch', 'minor', 'major'].includes(config.bumpType)) {
      console.error('Invalid bump type. Use: patch, minor, or major');
      process.exit(1);
    }

    if (!['all', 'cli', 'client'].includes(config.packages)) {
      console.error('Invalid packages. Use: all, cli, or client');
      process.exit(1);
    }

    console.log('🚀 Starting release process');
    console.log(`   Bump type: ${config.bumpType}`);
    console.log(`   Packages: ${config.packages}`);
    console.log(`   Dry run: ${config.dryRun}`);
    console.log(`   Include commits: ${config.includeCommitList}`);
  }

  const packagesToRelease =
    config.packages === 'all' ? ['cli', 'client'] : [config.packages];
  const releases: ReleaseResult[] = [];

  // Release each package
  const releaseSpinner = p.spinner();
  releaseSpinner.start('Preparing releases...');

  try {
    for (const pkgKey of packagesToRelease) {
      const result = await releasePackage(pkgKey, config, releaseSpinner);
      releases.push(result);
    }
    releaseSpinner.stop('📝 Changelogs and versions updated');
  } catch (error) {
    releaseSpinner.stop('Failed to prepare releases');
    throw error;
  }

  // Show changelog preview in interactive mode
  if (config.interactive) {
    for (const release of releases) {
      const pkg = PACKAGES[release.pkg];
      p.note(release.changes, `${pkg?.name} v${release.version} Changelog`);
    }
  }

  // Install dependencies
  const installSpinner = p.spinner();
  installSpinner.start('Installing dependencies...');
  try {
    await installDependencies();
    installSpinner.stop('📦 Dependencies installed');
  } catch (error) {
    installSpinner.stop('Failed to install dependencies');
    throw error;
  }

  // Build packages
  const buildSpinner = p.spinner();
  buildSpinner.start('Building packages...');
  try {
    const paths = packagesToRelease
      .map((pkg) => PACKAGES[pkg]?.path)
      .filter(Boolean) as string[];
    await buildPackages(paths);
    buildSpinner.stop('🔨 Packages built');
  } catch (error) {
    buildSpinner.stop('Failed to build packages');
    throw error;
  }

  // Publish to npm
  const publishSpinner = p.spinner();
  publishSpinner.start('Publishing to npm...');
  try {
    for (const release of releases) {
      const pkg = PACKAGES[release.pkg];
      if (pkg) {
        publishSpinner.message(`Publishing ${pkg.name}...`);
        await publishToNpm(pkg, config.dryRun);
      }
    }
    publishSpinner.stop(
      config.dryRun
        ? '🏃 [DRY RUN] Would publish to npm'
        : '📤 Published to npm',
    );
  } catch (error) {
    publishSpinner.stop('Failed to publish to npm');
    throw error;
  }

  // Git commit, tag, and push
  const gitSpinner = p.spinner();
  gitSpinner.start('Committing changes...');
  try {
    await commitAndTag(releases, config.dryRun);
    gitSpinner.stop(
      config.dryRun
        ? '🏃 [DRY RUN] Would commit and push'
        : '📤 Changes pushed to git',
    );
  } catch (error) {
    gitSpinner.stop('Failed to commit changes');
    throw error;
  }

  // Create GitHub releases
  const releaseGhSpinner = p.spinner();
  releaseGhSpinner.start('Creating GitHub releases...');
  try {
    for (const release of releases) {
      const pkg = PACKAGES[release.pkg];
      if (pkg) {
        releaseGhSpinner.message(`Creating release for ${pkg.name}...`);
        await createGitHubRelease(
          pkg,
          release.version,
          release.changes,
          config.dryRun,
        );
      }
    }
    releaseGhSpinner.stop(
      config.dryRun
        ? '🏃 [DRY RUN] Would create GitHub releases'
        : '🎉 GitHub releases created',
    );
  } catch (error) {
    releaseGhSpinner.stop('Failed to create GitHub releases');
    throw error;
  }

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    const outputFile = process.env.GITHUB_OUTPUT;
    for (const release of releases) {
      writeFileSync(outputFile, `${release.pkg}_version=${release.version}\n`, {
        flag: 'a',
      });
      writeFileSync(outputFile, `${release.pkg}_released=true\n`, {
        flag: 'a',
      });
    }
  }

  // Summary
  const summary = releases
    .map((r) => `${PACKAGES[r.pkg]?.name} v${r.version}`)
    .join('\n');

  p.outro(pc.green(`✅ Release complete!\n\n${summary}`));
}

main().catch((error) => {
  p.log.error(`Release failed: ${error}`);
  process.exit(1);
});
