#!/usr/bin/env node

import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = process.cwd();
const packageJsonPath = join(workspaceRoot, 'package.json');
const cliPath = join(workspaceRoot, '../../apps/cli');
const clientPackageJsonPath = join(
  workspaceRoot,
  '../../packages/client/package.json',
);
const installScriptPath = join(cliPath, 'scripts', 'install.cjs');

// Copy README and LICENSE
try {
  const readmePath = join(workspaceRoot, '../../', 'README.md');
  const licensePath = join(workspaceRoot, '../../', 'LICENSE');
  const targetDir = join(workspaceRoot, 'package.json', '..');

  copyFileSync(readmePath, join(targetDir, 'README.md'));
  console.log('✅ Copied README.md to package directory');

  copyFileSync(licensePath, join(targetDir, 'LICENSE'));
  console.log('✅ Copied LICENSE to package directory');
} catch (error) {
  console.error('❌ Failed to copy files:', error.message);
  process.exit(1);
}

// Read both package.json files
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const clientPackageJson = JSON.parse(
  readFileSync(clientPackageJsonPath, 'utf8'),
);

// Update install script with package version
try {
  const installScript = readFileSync(installScriptPath, 'utf8');
  const updatedScript = installScript.replace(
    "'{{ PACKAGE_VERSION }}'",
    `'v${packageJson.version}'`,
  );
  writeFileSync(installScriptPath, updatedScript);
  console.log(`✅ Updated install script with version v${packageJson.version}`);
} catch (error) {
  console.error('❌ Failed to update install script:', error.message);
  process.exit(1);
}

// Get all @unhook/* dependencies from both dependencies and devDependencies
const unhookDeps = [
  ...Object.keys(packageJson.dependencies || {}).filter(
    (dep) => dep.startsWith('@unhook/') && dep !== '@unhook/client',
  ),
  ...Object.keys(packageJson.devDependencies || {}).filter(
    (dep) => dep.startsWith('@unhook/') && dep !== '@unhook/client',
  ),
];

// Remove workspace dependencies from both sections
for (const dep of unhookDeps) {
  delete packageJson.dependencies?.[dep];
  delete packageJson.devDependencies?.[dep];
}

// Replace @unhook/client workspace dependency with actual version
if (packageJson.dependencies?.['@unhook/client'] === 'workspace:*') {
  packageJson.dependencies['@unhook/client'] = clientPackageJson.version;
  console.log(
    `✅ Updated @unhook/client dependency to version ${clientPackageJson.version}`,
  );
}

if (packageJson.devDependencies?.['@unhook/client'] === 'workspace:*') {
  packageJson.devDependencies['@unhook/client'] = clientPackageJson.version;
  console.log(
    `✅ Updated @unhook/client devDependency to version ${clientPackageJson.version}`,
  );
}

// Write the modified package.json back
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Run format:fix on the package
const { execSync } = await import('node:child_process');
execSync('bun biome check --write', { stdio: 'inherit' });
console.log('✅ Formatted package.json');

console.log(
  `✅ Removed ${unhookDeps.length} workspace dependencies from package.json:`,
  unhookDeps.join(', '),
);
