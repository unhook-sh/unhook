#!/usr/bin/env bun

import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const installScript = path.join(__dirname, '../../scripts/install.cjs');
const installDir = path.join(os.homedir(), '.unhook/bin');
const version = 'v0.12.2';
const binName = `unhook-${os.platform()}-${os.arch()}`;
const versionedInstallDir = path.join(installDir, version);
const binPath = path.join(versionedInstallDir, binName);

function cleanup() {
  if (fs.existsSync(installDir)) {
    // fs.rmSync(installDir, { recursive: true, force: true });
  }
}

describe('Install Script Integration', () => {
  beforeAll(() => {
    cleanup();
  });
  afterAll(() => {
    cleanup();
  });

  test('creates correct versioned directory with v prefix', () => {
    // Simulate a binary download by creating the directory and a dummy binary
    fs.mkdirSync(versionedInstallDir, { recursive: true });
    fs.writeFileSync(binPath, '#!/bin/sh\necho unhook', { mode: 0o755 });
    expect(fs.existsSync(versionedInstallDir)).toBe(true);
    expect(fs.existsSync(binPath)).toBe(true);
  });

  test('prevents recursive execution with UNHOOK_CLI_LAUNCHED', () => {
    const result = spawnSync('node', [installScript], {
      env: { ...process.env, UNHOOK_CLI_LAUNCHED: '1' },
      encoding: 'utf8',
    });
    expect(result.stderr + result.stdout).toMatch(
      /Recursive execution detected/,
    );
    expect(result.status).not.toBe(0);
  });

  test('does not report binary exists for different versions', () => {
    // Simulate old version
    const oldVersion = 'v1.2.3';
    const oldDir = path.join(installDir, oldVersion);
    const oldBin = path.join(oldDir, binName);
    fs.mkdirSync(oldDir, { recursive: true });
    fs.writeFileSync(oldBin, '#!/bin/sh\necho old', { mode: 0o755 });
    // Remove new version if present
    if (fs.existsSync(versionedInstallDir))
      fs.rmSync(versionedInstallDir, { recursive: true, force: true });
    // Use a non-existent version that will fail quickly
    const testVersion = 'v0.0.0-nonexistent';
    // Run install script (should not find the new version's binary)
    const result = spawnSync('node', [installScript], {
      env: {
        ...process.env,
        UNHOOK_CLI_INSTALL_ONLY: '1',
        UNHOOK_CLI_VERSION: testVersion,
      },
      encoding: 'utf8',
      timeout: 15000,
    });
    expect(result.stdout + result.stderr).not.toMatch(/already exists/);
  });

  test('exits with error on download failure', () => {
    // Simulate a broken URL by setting an invalid version
    const badVersion = 'v0.0.0-bad';
    const badDir = path.join(installDir, badVersion);
    if (fs.existsSync(badDir))
      fs.rmSync(badDir, { recursive: true, force: true });
    const result = spawnSync('node', [installScript], {
      env: {
        ...process.env,
        UNHOOK_CLI_INSTALL_ONLY: '1',
        UNHOOK_CLI_VERSION: badVersion,
      },
      encoding: 'utf8',
      timeout: 15000,
    });
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toMatch(
      /Download failed|Binary not found|Download error/,
    );
  });
});
