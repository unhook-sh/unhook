#!/usr/bin/env bun
/**
 * Release script for @unhook/cli, @unhook/client, unhook-vscode
 *
 * Interactive mode (default):
 *   bun scripts/release
 *
 * Non-interactive mode (for CI):
 *   bun scripts/release --packages all --ci
 *   bun scripts/release --packages cli --dry-run
 *   bun scripts/release --packages vscode --ci
 *   bun scripts/release --packages all --bump patch (manual override)
 *
 * Environment variables:
 *   OPENROUTER_API_KEY - Required for AI-generated changelogs and version bump analysis
 *   AI_MODEL - Optional, model name (default: "openai/gpt-4o-mini" for OpenRouter)
 *   DRY_RUN - If set to "true", skips npm publish and git push
 *   CLI_CHANGELOG - Pre-generated changelog for CLI (from GitHub Action)
 *   CLIENT_CHANGELOG - Pre-generated changelog for client (from GitHub Action)
 *   VSCODE_CHANGELOG - Pre-generated changelog for VSCode extension (from GitHub Action)
 *   VSCE_PAT - Personal Access Token for VS Marketplace (required for VSCode)
 *   OVSX_PAT - Personal Access Token for Open VSX Registry (required for VSCode)
 *   CI - If set, defaults to non-interactive mode
 */

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { generateChangelog, updateChangelogFile } from './changelog';
import {
  commitVersionChanges,
  createGitHubRelease,
  createTagsAndPush,
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
import { analyzeVersionBump } from './version-analysis';
import { publishVscodeExtension } from './vscode';

async function runInteractive(): Promise<ReleaseConfig> {
  p.intro(pc.bgCyan(pc.black(' 🚀 Unhook Release ')));

  const packages = await p.select({
    message: 'Which packages do you want to release?',
    options: [
      {
        hint: '@unhook/cli + @unhook/client + vscode',
        label: 'All packages',
        value: 'all',
      },
      { hint: '@unhook/cli', label: 'CLI only', value: 'cli' },
      { hint: '@unhook/client', label: 'Client only', value: 'client' },
      {
        hint: 'unhook-vscode',
        label: 'VSCode Extension only',
        value: 'vscode',
      },
    ],
  });

  if (p.isCancel(packages)) {
    p.cancel('Release cancelled');
    process.exit(0);
  }

  // Show current versions
  const packagesToRelease =
    packages === 'all' ? ['cli', 'client', 'vscode'] : [packages as string];
  for (const pkgKey of packagesToRelease) {
    const pkg = PACKAGES[pkgKey];
    if (pkg) {
      const currentVersion = getCurrentVersion(pkg);
      p.note(`${pkg.name}: v${currentVersion}`, 'Current version');
    }
  }

  p.note(
    'Version bumps will be automatically determined by AI analysis of changelogs.',
    'Version bump',
  );

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
    dryRun: dryRun as boolean,
    interactive: true,
    packages: packages as 'all' | 'cli' | 'client' | 'vscode',
  };
}

function parseCliArgs(): ReleaseConfig {
  const { values } = parseArgs({
    allowNegative: true,
    args: process.argv.slice(2),
    options: {
      bump: {
        default: undefined,
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
    bumpType:
      values.bump && ['patch', 'minor', 'major'].includes(values.bump as string)
        ? (values.bump as 'patch' | 'minor' | 'major')
        : undefined,
    dryRun: (values['dry-run'] as boolean) || process.env.DRY_RUN === 'true',
    interactive: isInteractive,
    packages: values.packages as 'all' | 'cli' | 'client' | 'vscode',
  };
}

async function releasePackage(
  pkgKey: string,
  config: ReleaseConfig,
  spinner: ReturnType<typeof p.spinner>,
): Promise<ReleaseResult> {
  const pkg = PACKAGES[pkgKey];
  if (!pkg) throw new Error(`Unknown package: ${pkgKey}`);

  // Get current version
  const currentVersion = getCurrentVersion(pkg);

  spinner.message(`${pkg.name}: Checking git history...`);

  // Get latest tag and commits
  const latestTag = await getLatestTag(pkg.tagPrefix);
  const commits = await getCommitsSinceTag(latestTag, pkg.path);

  spinner.message(
    `${pkg.name}: Generating changelog (${commits.length} commits)...`,
  );

  // Check for pre-generated changelog from GitHub Action
  const preGeneratedChangelog = process.env[pkg.changelogEnvVar];

  // Generate changelog first (always include commit list)
  const changes = await generateChangelog(
    commits,
    pkg.name,
    latestTag,
    pkg.path, // Path filter for git commands
    { includeCommitList: true },
    preGeneratedChangelog,
  );

  // Determine version bump type
  let bumpType: 'patch' | 'minor' | 'major';
  if (config.bumpType) {
    // Use provided bump type (for backward compatibility or manual override)
    bumpType = config.bumpType;
    spinner.message(`${pkg.name}: Using provided bump type: ${bumpType}`);
  } else {
    // Use AI to analyze changelog and determine bump type
    spinner.message(
      `${pkg.name}: Analyzing changelog to determine version bump...`,
    );
    const analysis = await analyzeVersionBump(changes, pkg.name);
    bumpType = analysis.bumpType;
    spinner.message(
      `${pkg.name}: AI determined ${bumpType} bump - ${analysis.reasoning}`,
    );
  }

  // Calculate new version
  const newVersion = bumpVersion(currentVersion, bumpType);

  spinner.message(`${pkg.name}: Updating files...`);

  // Update changelog file
  updateChangelogFile(pkg, newVersion, changes, bumpType);

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
    if (!['all', 'cli', 'client', 'vscode'].includes(config.packages)) {
      console.error('Invalid packages. Use: all, cli, client, vscode');
      process.exit(1);
    }

    console.log('🚀 Starting release process');
    console.log(
      `   Bump type: ${config.bumpType || 'AI-determined (from changelog)'}`,
    );
    console.log(`   Packages: ${config.packages}`);
    console.log(`   Dry run: ${config.dryRun}`);
  }

  const packagesToRelease =
    config.packages === 'all' ? ['cli', 'client', 'vscode'] : [config.packages];
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

  // Commit version changes BEFORE publishing
  // This ensures that if publish fails, the version bump is still committed
  // and the next run will bump to a new version instead of re-trying the same one
  const commitSpinner = p.spinner();
  commitSpinner.start('Committing version changes...');
  try {
    await commitVersionChanges(releases, config.dryRun);
    commitSpinner.stop(
      config.dryRun
        ? '🏃 [DRY RUN] Would commit version changes'
        : '📝 Version changes committed',
    );
  } catch (error) {
    commitSpinner.stop('Failed to commit version changes');
    throw error;
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

  // Publish npm packages
  const npmReleases = releases.filter((r) => !PACKAGES[r.pkg]?.skipNpmPublish);

  if (npmReleases.length > 0) {
    const publishSpinner = p.spinner();
    publishSpinner.start('Publishing to npm...');
    try {
      for (const release of npmReleases) {
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
  }

  // Publish VSCode extension to VS Marketplace and Open VSX
  const vscodeReleases = releases.filter((r) => r.pkg === 'vscode');

  if (vscodeReleases.length > 0) {
    const vscodeSpinner = p.spinner();
    vscodeSpinner.start('Publishing VSCode extension...');
    try {
      for (const release of vscodeReleases) {
        const pkg = PACKAGES[release.pkg];
        if (pkg) {
          vscodeSpinner.message(`Publishing ${pkg.name} to VS Marketplace...`);
          await publishVscodeExtension(pkg, release.version, config.dryRun);
        }
      }
      vscodeSpinner.stop(
        config.dryRun
          ? '🏃 [DRY RUN] Would publish to VS Marketplace & Open VSX'
          : '📤 Published to VS Marketplace & Open VSX',
      );
    } catch (error) {
      vscodeSpinner.stop('Failed to publish VSCode extension');
      throw error;
    }
  }

  // Create git tags and push
  const gitSpinner = p.spinner();
  gitSpinner.start('Creating tags and pushing...');
  try {
    await createTagsAndPush(releases, config.dryRun);
    gitSpinner.stop(
      config.dryRun
        ? '🏃 [DRY RUN] Would create tags and push'
        : '📤 Tags created and pushed',
    );
  } catch (error) {
    gitSpinner.stop('Failed to create tags');
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
