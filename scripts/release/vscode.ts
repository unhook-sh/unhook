import { $ } from 'bun';
import type { PackageInfo } from './types';

/**
 * Publish VSCode extension to VS Marketplace and Open VSX Registry
 *
 * Requires environment variables:
 * - VSCE_PAT: Personal Access Token for Visual Studio Marketplace
 * - OVSX_PAT: Personal Access Token for Open VSX Registry
 */
export async function publishVscodeExtension(
  pkg: PackageInfo,
  version: string,
  dryRun: boolean,
): Promise<void> {
  if (dryRun) {
    console.log(
      `🏃 [DRY RUN] Would publish ${pkg.name} to VS Marketplace and Open VSX`,
    );
    return;
  }

  const vscePat = process.env.VSCE_PAT;
  const ovsxPat = process.env.OVSX_PAT;

  if (!vscePat || !ovsxPat) {
    throw new Error(
      'VSCE_PAT and OVSX_PAT environment variables are required for VSCode publishing',
    );
  }

  const vsixFile = `unhook-vscode-${version}.vsix`;

  // Package the extension
  console.log(`📦 Packaging ${pkg.name}...`);
  await $`cd ${pkg.path} && bun run package`;

  // Verify package was created
  const packageExists =
    await $`test -f ${pkg.path}/${vsixFile} && echo "exists"`.text();
  if (!packageExists.includes('exists')) {
    throw new Error(`Expected package file not found: ${vsixFile}`);
  }

  // Publish to Visual Studio Marketplace
  console.log(`📤 Publishing ${pkg.name} to Visual Studio Marketplace...`);
  await $`cd ${pkg.path} && bunx vsce publish --packagePath ${vsixFile}`.env({
    ...process.env,
    VSCE_PAT: vscePat,
  });
  console.log('✅ Published to Visual Studio Marketplace');

  // Publish to Open VSX Registry
  console.log(`📤 Publishing ${pkg.name} to Open VSX Registry...`);

  // Create namespace if it doesn't exist (fails silently if exists)
  const publisher = 'unhook';
  await $`bunx ovsx create-namespace ${publisher} --pat ${ovsxPat}`.nothrow();

  await $`cd ${pkg.path} && bunx ovsx publish ${vsixFile} --pat ${ovsxPat}`.env(
    {
      ...process.env,
      OVSX_PAT: ovsxPat,
    },
  );
  console.log('✅ Published to Open VSX Registry');
}
