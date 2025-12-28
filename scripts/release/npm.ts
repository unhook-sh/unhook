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
  const filterArgs = packagePaths.map((p) => `--filter=./${p}...`).join(' ');
  await $`bunx turbo run build ${filterArgs.split(' ')}`;
}

export async function installDependencies(): Promise<void> {
  await $`bun install`;
}
