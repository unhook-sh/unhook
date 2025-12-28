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
  // Sort paths to ensure client builds before cli (cli depends on client)
  const sortedPaths = [...packagePaths].sort((a, b) => {
    // Client should be first
    if (a.includes('client')) return -1;
    if (b.includes('client')) return 1;
    return 0;
  });

  // Build all packages with --concurrency=1 to ensure sequential builds
  // This ensures client is fully built before CLI tries to import from it
  const filterArgs = sortedPaths.map((p) => `--filter=./${p}...`).join(' ');
  await $`bunx turbo run build ${filterArgs.split(' ')} --force --concurrency=1`;
}

export async function installDependencies(): Promise<void> {
  await $`bun install`;
}
