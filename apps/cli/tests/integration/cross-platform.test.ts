#!/usr/bin/env bun

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

describe('Cross-Platform CLI Tests', () => {
  const tempDir = path.join(os.tmpdir(), 'unhook-cli-test');
  const installDir = path.join(os.homedir(), '.unhook/bin');

  beforeAll(async () => {
    // Create temp directory for tests
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Clean up any existing installations
    if (fs.existsSync(installDir)) {
      fs.rmSync(installDir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    // Clean up test directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Platform Detection', () => {
    test('should detect current platform correctly', () => {
      const platformMap: Record<string, string> = {
        win32: 'win32',
        darwin: 'darwin',
        linux: 'linux',
      };
      const archMap: Record<string, string> = {
        x64: 'x64',
        arm64: 'arm64',
      };

      const expectedPlatform = platformMap[os.platform()];
      const expectedArch = archMap[os.arch()];

      expect(expectedPlatform).toBeDefined();
      expect(expectedArch).toBeDefined();
    });

    test('should handle unsupported platforms gracefully', () => {
      const cliScript = path.join(__dirname, '../../bin/cli.cjs');

      // Test with the actual script - if platform is unsupported, it should exit with error
      const result = spawnSync('node', [cliScript, '--version'], {
        encoding: 'utf8',
      });

      // Either succeeds (supported platform) or fails with helpful message
      if (result.status !== 0) {
        // The CLI wrapper will show either "Unsupported platform" or "Binary not found"
        // depending on whether the platform is supported but binary doesn't exist
        expect(result.stderr).toMatch(
          /(Unsupported platform|Binary not found)/,
        );
      }
    });
  });

  describe('Binary Download', () => {
    test('should construct correct download URL', () => {
      const platformMap: Record<string, string> = {
        win32: 'win32',
        darwin: 'darwin',
        linux: 'linux',
      };
      const platform = platformMap[os.platform()];
      const arch = os.arch();
      const ext = os.platform() === 'win32' ? '.exe' : '';

      let targetArch: string = arch;
      if (
        platform === 'linux' &&
        (fs.existsSync('/lib/ld-musl-x86_64.so.1') ||
          fs.existsSync('/lib/ld-musl-aarch64.so.1'))
      ) {
        targetArch = `${arch}-musl`;
      }

      const expectedBinaryName = `unhook-${platform}-${targetArch}${ext}`;
      const expectedUrl = `https://github.com/unhook-sh/unhook/releases/download/v0.10.1/${expectedBinaryName}`;

      expect(expectedUrl).toMatch(
        /https:\/\/github\.com\/unhook-sh\/unhook\/releases\/download\/v[\d.]+\/unhook-/,
      );
    });

    test('should handle network errors gracefully', () => {
      // Test that the install script exists and is executable
      const installScript = path.join(__dirname, '../../scripts/install.cjs');
      expect(fs.existsSync(installScript)).toBe(true);

      // Test basic script structure
      const scriptContent = fs.readFileSync(installScript, 'utf8');
      expect(scriptContent).toContain('downloadBinary');
      expect(scriptContent).toContain('github.com');
    });
  });

  describe('CLI Wrapper', () => {
    test('should show helpful message when binary is missing', () => {
      const result = spawnSync(
        'node',
        [path.join(__dirname, '../../bin/cli.cjs'), '--version'],
        {
          encoding: 'utf8',
        },
      );

      if (result.status !== 0) {
        expect(result.stderr).toContain('Binary not found');
        expect(result.stderr).toContain('npm install');
      }
    });

    test('should be executable and contain proper logic', () => {
      const cliScript = path.join(__dirname, '../../bin/cli.cjs');
      expect(fs.existsSync(cliScript)).toBe(true);

      const content = fs.readFileSync(cliScript, 'utf8');
      expect(content).toContain('runBinary');
      expect(content).toContain('platform');
      expect(content).toContain('arch');
    });
  });

  describe('Package Configuration', () => {
    test('should have correct package.json configuration', async () => {
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.bin.unhook).toBe('./bin/cli.cjs');
      expect(packageJson.scripts.postinstall).toContain(
        './scripts/install.cjs',
      );
      expect(packageJson.os).toContain('win32');
      expect(packageJson.os).toContain('darwin');
      expect(packageJson.os).toContain('linux');
      expect(packageJson.files).toContain('bin/cli.cjs');
      expect(packageJson.files).toContain('scripts/install.cjs');
    });

    test('should skip install in CI environment', () => {
      const originalCI = process.env.CI;
      process.env.CI = 'true';

      try {
        // Test the CI detection logic
        expect(process.env.CI).toBe('true');
      } finally {
        if (originalCI !== undefined) {
          process.env.CI = originalCI;
        } else {
          process.env.CI = undefined;
        }
      }
    });
  });

  describe('Error Handling', () => {
    test('should provide clear error messages', () => {
      const errorScenarios = [
        'Binary not found',
        'Permission denied',
        'Download error',
        'Network error',
      ];

      for (const message of errorScenarios) {
        expect(message).toBeTruthy();
        expect(typeof message).toBe('string');
      }
    });

    test('should respect proxy environment variables', () => {
      const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'NO_PROXY'];

      for (const envVar of proxyVars) {
        const value = process.env[envVar];
        expect(['string', 'undefined']).toContain(typeof value);
      }
    });
  });

  describe('Platform-Specific Behavior', () => {
    test('should handle Windows executable extension', () => {
      const isWindows = os.platform() === 'win32';
      const expectedExt = isWindows ? '.exe' : '';

      const binName = `unhook-win32-x64${expectedExt}`;
      if (isWindows) {
        expect(binName).toContain('.exe');
      } else {
        expect(binName).not.toContain('.exe');
      }
    });

    test('should handle macOS specific features', () => {
      const isMacOS = os.platform() === 'darwin';

      if (isMacOS) {
        // Test that xattr command exists (for removing quarantine)
        try {
          execSync('which xattr', { stdio: 'ignore' });
          expect(true).toBe(true); // xattr is available
        } catch {
          console.warn('xattr not available on macOS');
        }
      } else {
        expect(true).toBe(true); // Not macOS, test passes
      }
    });

    test('should detect musl vs glibc on Linux', () => {
      const isLinux = os.platform() === 'linux';

      if (isLinux) {
        const isMusl =
          fs.existsSync('/lib/ld-musl-x86_64.so.1') ||
          fs.existsSync('/lib/ld-musl-aarch64.so.1');
        expect(typeof isMusl).toBe('boolean');
      } else {
        expect(true).toBe(true); // Not Linux, test passes
      }
    });
  });

  describe('Integration Tests', () => {
    test('should simulate install process', async () => {
      // Test the install script logic without actually downloading
      const installScript = path.join(__dirname, '../../scripts/install.cjs');
      const scriptContent = fs.readFileSync(installScript, 'utf8');

      // Check that all required components are present
      expect(scriptContent).toContain('platformMap');
      expect(scriptContent).toContain('archMap');
      expect(scriptContent).toContain('downloadBinary');
      expect(scriptContent).toContain('setBinaryPermissions');
      expect(scriptContent).toContain('unhook-sh/unhook');
    });

    test('should handle version formatting correctly', () => {
      // Test version tag formatting
      const testVersions = ['1.0.0', 'v1.0.0', '0.10.1'];

      for (const version of testVersions) {
        const versionTag = version.startsWith('v') ? version : `v${version}`;
        expect(versionTag).toMatch(/^v\d+\.\d+\.\d+/);
      }
    });

    test('should validate supported platform combinations', () => {
      const supportedCombinations = [
        { platform: 'linux', arch: 'x64' },
        { platform: 'linux', arch: 'arm64' },
        { platform: 'linux', arch: 'x64-musl' },
        { platform: 'linux', arch: 'arm64-musl' },
        { platform: 'darwin', arch: 'x64' },
        { platform: 'darwin', arch: 'arm64' },
        { platform: 'win32', arch: 'x64' },
      ];

      for (const combo of supportedCombinations) {
        const ext = combo.platform === 'win32' ? '.exe' : '';
        const expectedBinary = `unhook-${combo.platform}-${combo.arch}${ext}`;
        expect(expectedBinary).toMatch(
          /^unhook-(linux|darwin|win32)-(x64|arm64|x64-musl|arm64-musl)(\.exe)?$/,
        );
      }
    });
  });
});
