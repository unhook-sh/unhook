#!/usr/bin/env node

import { execSync } from 'node:child_process';
// import { exit } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const workspaceRoot = process.cwd();
const packageJsonPath = join(workspaceRoot, 'package.json');
const cliPath = join(workspaceRoot, '../../apps/cli');
const clientPackageJsonPath = join(
  workspaceRoot,
  '../../packages/client/package.json',
);
const installScriptPath = join(cliPath, 'scripts', 'install.cjs');

const args = process.argv.slice(2);
const skipReadme = args.includes('--no-readme');
const skipInstallUpdate = args.includes('--no-install-update');
const isVsCodeExtension = args.includes('--vscode-extension');

// Copy README and LICENSE
if (!skipReadme) {
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
} else {
  console.log('⏭️  Skipping README.md and LICENSE copy (--no-readme)');
}

// Read both package.json files
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const clientPackageJson = JSON.parse(
  readFileSync(clientPackageJsonPath, 'utf8'),
);

// Update install script with package version (skip for VS Code extension)
if (!skipInstallUpdate && !isVsCodeExtension) {
  try {
    const installScript = readFileSync(installScriptPath, 'utf8');
    const updatedScript = installScript.replace(
      /const version = ['"]v?\d+\.\d+\.\d+['"];?/,
      `const version = 'v${packageJson.version}';`,
    );
    writeFileSync(installScriptPath, updatedScript);
    console.log(
      `✅ Updated install script with version v${packageJson.version}`,
    );
  } catch (error) {
    console.error('❌ Failed to update install script:', error.message);
    process.exit(1);
  }
} else if (isVsCodeExtension) {
  console.log('⏭️  Skipping install script update (VS Code extension)');
} else {
  console.log('⏭️  Skipping install script update (--no-install-update)');
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

// VS Code extension specific preparations
if (isVsCodeExtension) {
  // Ensure main entry point exists
  if (!packageJson.main) {
    console.error('❌ VS Code extension missing main entry point');
    process.exit(1);
  }

  // Ensure required VS Code extension fields are present
  const requiredFields = ['displayName', 'description', 'version', 'engines'];
  const missingFields = requiredFields.filter((field) => !packageJson[field]);

  if (missingFields.length > 0) {
    console.error(
      `❌ VS Code extension missing required fields: ${missingFields.join(', ')}`,
    );
    process.exit(1);
  }

  // Copy logo from src/media to root if it exists
  try {
    const logoSrcPath = join(workspaceRoot, 'src', 'media', 'logo.png');
    const logoDestPath = join(workspaceRoot, 'logo.png');

    if (existsSync(logoSrcPath)) {
      copyFileSync(logoSrcPath, logoDestPath);
      console.log('✅ Copied logo.png to root directory for VS Code extension');
    }
  } catch (error) {
    console.warn('⚠️  Could not copy logo file:', error.message);
  }

  console.log('✅ VS Code extension package.json validated');
}

// Write the modified package.json back
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Run format:fix on the package (skip for VS Code extension to avoid hanging)
if (!isVsCodeExtension) {
  execSync('bun biome check --write', { stdio: 'inherit' });
  console.log('✅ Formatted package.json');
} else {
  console.log('⏭️  Skipping biome formatting (VS Code extension)');
}

console.log(
  `✅ Removed ${unhookDeps.length} workspace dependencies from package.json:`,
  unhookDeps.join(', '),
);

process.exit(0);
