import { $ } from 'bun';
import type { PackageInfo, ReleaseResult } from './types';
import { PACKAGES } from './types';

export async function getLatestTag(prefix: string): Promise<string | null> {
  try {
    const result =
      await $`git tag -l "${prefix}*" --sort=-v:refname | head -n 1`.text();
    return result.trim() || null;
  } catch {
    return null;
  }
}

export async function getCommitsSinceTag(
  tag: string | null,
  pathFilter: string,
): Promise<string[]> {
  try {
    const range = tag ? `${tag}..HEAD` : 'HEAD';
    // Format: fullHash|shortHash|subject|authorName
    const result =
      await $`git log ${range} --pretty=format:"%H|%h|%s|%an" -- ${pathFilter}`.text();

    if (!result.trim()) return [];

    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Commit version changes BEFORE publishing.
 * This ensures that if publish fails, the version bump is already committed
 * and the next run will bump to a new version.
 */
export async function commitVersionChanges(
  releases: ReleaseResult[],
  dryRun: boolean,
): Promise<void> {
  await $`git add -A`;

  const commitMessage =
    releases.length === 1
      ? `chore: release ${PACKAGES[releases[0]?.pkg]?.name}@${releases[0]?.version}`
      : `chore: release ${releases.map((r) => `${PACKAGES[r.pkg]?.name}@${r.version}`).join(' ')}`;

  if (dryRun) {
    console.log(`🏃 [DRY RUN] Would commit: ${commitMessage}`);
    return;
  }

  await $`git commit -m ${commitMessage}`;
  console.log(`✅ Committed: ${commitMessage}`);
}

/**
 * Create git tags and push AFTER publishing.
 * Tags are only created after successful publish to ensure
 * the tag points to a version that exists on npm/marketplace.
 */
export async function createTagsAndPush(
  releases: ReleaseResult[],
  dryRun: boolean,
): Promise<void> {
  if (dryRun) {
    console.log('🏃 [DRY RUN] Would create tags and push');
    return;
  }

  for (const release of releases) {
    const tagName = `${PACKAGES[release.pkg]?.tagPrefix}${release.version}`;
    await $`git tag -a ${tagName} -m "Release ${PACKAGES[release.pkg]?.name} v${release.version}"`;
    console.log(`🏷️  Created tag: ${tagName}`);
  }

  console.log('\n📤 Pushing to origin...');
  await $`git push origin main --follow-tags`;
}

export async function createGitHubRelease(
  pkg: PackageInfo,
  version: string,
  changes: string,
  dryRun: boolean,
): Promise<void> {
  const tagName = `${pkg.tagPrefix}${version}`;
  const releaseName = `${pkg.name} v${version}`;

  const body = `## Changes

${changes}

## Installation

\`\`\`bash
npm install ${pkg.name}@${version}
\`\`\`
`;

  if (dryRun) {
    console.log(`🏃 [DRY RUN] Would create GitHub release: ${tagName}`);
    return;
  }

  try {
    await $`gh release create ${tagName} --title ${releaseName} --notes ${body}`;
    console.log(`🎉 Created GitHub release: ${tagName}`);
  } catch (error) {
    console.error(`Failed to create GitHub release: ${error}`);
  }
}
