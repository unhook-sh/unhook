import { readFileSync, writeFileSync } from 'node:fs';
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

  // Save the package.json state before prepublishOnly modifies it
  // (prepare-publish converts workspace:* to actual versions)
  const packageJsonPath = `${pkg.path}/package.json`;
  const prePublishPackageJson = JSON.parse(
    readFileSync(packageJsonPath, 'utf8'),
  );

  console.log(`📤 Publishing ${pkg.name} to npm...`);

  try {
    // Uses npm OIDC (Trusted Publishers) in CI - no NPM_TOKEN needed
    // @see https://docs.npmjs.com/trusted-publishers
    await $`cd ${pkg.path} && npm publish --access public --provenance`;
    console.log(`✅ Published ${pkg.name}`);
  } finally {
    // After publish, prepare-publish will have modified the package.json
    // We need to restore workspace:* deps but KEEP the new version
    const postPublishPackageJson = JSON.parse(
      readFileSync(packageJsonPath, 'utf8'),
    );

    // Restore workspace:* dependencies from pre-publish state
    if (prePublishPackageJson.dependencies) {
      for (const [dep, version] of Object.entries(
        prePublishPackageJson.dependencies,
      )) {
        if (version === 'workspace:*') {
          postPublishPackageJson.dependencies[dep] = 'workspace:*';
        }
      }
    }
    if (prePublishPackageJson.devDependencies) {
      for (const [dep, version] of Object.entries(
        prePublishPackageJson.devDependencies,
      )) {
        if (version === 'workspace:*') {
          postPublishPackageJson.devDependencies =
            postPublishPackageJson.devDependencies || {};
          postPublishPackageJson.devDependencies[dep] = 'workspace:*';
        }
      }
    }

    // Write back the corrected package.json
    writeFileSync(
      packageJsonPath,
      `${JSON.stringify(postPublishPackageJson, null, 2)}\n`,
    );
    console.log(
      `🔄 Restored workspace:* dependencies in ${pkg.name}/package.json`,
    );
  }
}

export async function buildPackages(packagePaths: string[]): Promise<void> {
  // Let turbo handle the build order via dependsOn: ["^build"]
  const filterArgs = packagePaths.map((p) => `--filter=./${p}...`).join(' ');
  await $`bunx turbo run build ${filterArgs.split(' ')}`;
}

export async function installDependencies(): Promise<void> {
  await $`bun install`;
}
