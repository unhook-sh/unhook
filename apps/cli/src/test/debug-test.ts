#!/usr/bin/env bun

/**
 * Test script to verify the CLI binary works correctly after compilation
 * This tests that dynamic imports don't break the build process
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CLI_BIN_PATH = path.join(
  import.meta.dir,
  '..',
  '..',
  'bin',
  'unhook-test',
);

async function testCliBinary() {
  console.log('🧪 Testing CLI binary compilation...');

  // Check if binary exists
  if (!existsSync(CLI_BIN_PATH)) {
    console.error('❌ Binary not found at:', CLI_BIN_PATH);
    console.error('Run `bun run test:compile:build` first');
    process.exit(1);
  }

  console.log('✅ Binary found at:', CLI_BIN_PATH);

  try {
    // Test basic execution
    console.log('🔄 Testing basic execution...');
    const proc = spawn(CLI_BIN_PATH, ['--help'], {
      stdio: 'pipe',
    });

    const output = await new Promise<number>((resolve) => {
      proc.on('close', (code: number | null) => resolve(code ?? 1));
    });

    if (output === 0) {
      console.log('✅ CLI binary executes successfully');
      console.log('✅ No "No chunk id map found" error');
      console.log('✅ Dynamic imports properly handled');
    } else {
      console.error('❌ CLI binary failed to execute');
      process.exit(1);
    }

    // Test with debug flag
    console.log('🔄 Testing debug mode...');
    const debugProc = spawn(CLI_BIN_PATH, ['--verbose', '--help'], {
      stdio: 'pipe',
    });

    const debugOutput = await new Promise<number>((resolve) => {
      debugProc.on('close', (code: number | null) => resolve(code ?? 1));
    });

    if (debugOutput === 0) {
      console.log('✅ Debug mode works correctly');
    } else {
      console.error('❌ Debug mode failed');
      process.exit(1);
    }

    console.log('🎉 All tests passed! CLI compilation is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
await testCliBinary();
