import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const packageJsonPath = join(__dirname, '..', 'package.json');

// Read the package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Get all @unhook/* dependencies from both dependencies and devDependencies
const unhookDeps = [
  ...Object.keys(packageJson.dependencies || {}).filter((dep) =>
    dep.startsWith('@unhook/'),
  ),
  ...Object.keys(packageJson.devDependencies || {}).filter((dep) =>
    dep.startsWith('@unhook/'),
  ),
];

// Remove workspace dependencies from both sections
for (const dep of unhookDeps) {
  delete packageJson.dependencies?.[dep];
  delete packageJson.devDependencies?.[dep];
}

// Write the modified package.json back
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log(
  `✅ Removed ${unhookDeps.length} workspace dependencies from package.json:`,
  unhookDeps.join(', '),
);
