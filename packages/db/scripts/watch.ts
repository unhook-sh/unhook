#!/usr/bin/env tsx

import { spawn } from 'node:child_process';
import { watch } from 'chokidar';
import { debounce } from 'lodash-es';

// Function to run type generation
async function generateTypes() {
  console.log('🔄 Generating types...');
  try {
    const process = spawn('bun', ['gen-supabase-types'], {
      stdio: 'inherit',
      shell: true,
    });

    await new Promise((resolve, reject) => {
      process.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Types generated successfully');
          resolve(code);
        } else {
          console.error('❌ Type generation failed');
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  } catch (error) {
    console.error('Error generating types:', error);
  }
}

// Debounced version of generateTypes to avoid multiple runs
const debouncedGenerateTypes = debounce(generateTypes, 1000);

// Start TypeScript compiler in watch mode
const tsc = spawn('tsc', ['--watch', '--preserveWatchOutput'], {
  stdio: 'inherit',
  shell: true,
});

// Watch for changes in schema files
const watcher = watch(['src/schema.ts'], {
  ignoreInitial: true,
});

// Run type generation on file changes
watcher.on('all', (event, path) => {
  console.log(`📁 ${event} detected in ${path}`);
  debouncedGenerateTypes();
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  watcher.close();
  tsc.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down...');
  watcher.close();
  tsc.kill();
  process.exit(0);
});

// Initial type generation
generateTypes();
