import { $ } from 'bun';
import type { PackageInfo } from './types';

export async function publishToNpm(
  pkg: PackageInfo,
  dryRun: boolean,
): Promise<void> {
  if (dryRun) {
    console.log(`🏃 [DRY RUN] Would publish ${pkg.name} to npm`);
    return;
  }

  console.log(`📤 Publishing ${pkg.name} to npm...`);

  // Uses npm OIDC (Trusted Publishers) in CI - no NPM_TOKEN needed
  // @see https://docs.npmjs.com/trusted-publishers
  await $`cd ${pkg.path} && npm publish --access public --provenance`;

  console.log(`✅ Published ${pkg.name}`);
}

export async function buildPackages(packagePaths: string[]): Promise<void> {
  // Build client first if included, since CLI depends on it
  const clientPath = 'packages/client';
  const hasClient = packagePaths.includes(clientPath);
  const hasCli = packagePaths.includes('apps/cli');

  if (hasClient && hasCli) {
    // Build client first to ensure its exports are available for CLI
    console.log('Building @unhook/client first (CLI dependency)...');
    await $`bunx turbo run build --filter=./${clientPath}...`;

    // Then build remaining packages
    const remainingPaths = packagePaths.filter((p) => p !== clientPath);
    if (remainingPaths.length > 0) {
      const filterArgs = remainingPaths
        .map((p) => `--filter=./${p}...`)
        .join(' ');
      await $`bunx turbo run build ${filterArgs.split(' ')}`;
    }
  } else {
    // No dependency issue, build normally
    const filterArgs = packagePaths.map((p) => `--filter=./${p}...`).join(' ');
    await $`bunx turbo run build ${filterArgs.split(' ')}`;
  }
}

export async function installDependencies(): Promise<void> {
  await $`bun install`;
}
