import { readFileSync, writeFileSync } from 'node:fs';
import type { PackageInfo, PackageJson } from './types';

export function bumpVersion(
  current: string,
  type: 'patch' | 'minor' | 'major',
): string {
  const [major, minor, patch] = current.split('.').map(Number);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
  }
}

export function getCurrentVersion(pkg: PackageInfo): string {
  const pkgJson = JSON.parse(
    readFileSync(pkg.packageJsonPath, 'utf8'),
  ) as PackageJson;
  return pkgJson.version;
}

export function updatePackageVersion(
  pkg: PackageInfo,
  newVersion: string,
): void {
  const pkgJson = JSON.parse(
    readFileSync(pkg.packageJsonPath, 'utf8'),
  ) as PackageJson;
  pkgJson.version = newVersion;
  writeFileSync(pkg.packageJsonPath, `${JSON.stringify(pkgJson, null, 2)}\n`);
}
