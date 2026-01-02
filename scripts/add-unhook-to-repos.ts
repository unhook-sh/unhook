#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import readline from 'node:readline';

interface GitHubRepo {
  name: string;
  full_name: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
  fork: boolean;
}

interface VSCodeExtensions {
  recommendations: string[];
}

const GITHUB_USER = 'seawatts';
const TEMP_DIR = '/tmp/unhook-repos';
const UNHOOK_EXTENSION_ID = 'unhook.unhook-vscode';

// Test mode configuration
const TEST_MODE =
  process.argv.includes('--test') || process.argv.includes('-t');
const TEST_REPO = process.argv
  .find((arg) => arg.startsWith('--repo='))
  ?.split('=')[1];
// Auto-confirm flag (skip prompts)
const AUTO_YES = process.argv.includes('--yes') || process.argv.includes('-y');

// Unhook configuration template
const UNHOOK_CONFIG = `# Unhook Webhook Configuration
#
# For more information, visit: https://docs.unhook.sh/configuration
#
# Copy the following URL in your services:
# https://unhook.sh/wh_seawatts
#
# Optionally, you can attach ?source=Clerk to the URL.
# Clerk: https://unhook.sh/wh_seawatts?source=clerk
# Stripe: https://unhook.sh/wh_seawatts?source=stripe
# etc...
#
# Schema:
#   webhookUrl: string                    # Full webhook URL (e.g., https://unhook.sh/org/webhook-name)
#   destination:                         # Array of destination endpoints
#     - name: string                     # Name of the endpoint
#       url: string|URL|RemotePattern    # URL to forward webhooks to
#       ping?: boolean|string|URL        # Optional ping configuration
#   delivery:                             # Array of delivery rules
#     - source?: string                  # Optional source filter (default: *)
#       destination: string              # Name of the destination from 'destination' array

# Test Curl:
# curl -X POST https://unhook.sh/wh_seawatts?source=test -H "Content-Type: application/json" -d '{"type": "test.command", "data": { "message": "Hello, world!" }}'

webhookUrl: https://unhook.sh/your-org/your-webhook-name
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: local
`;

// VS Code extensions template
const VSCODE_EXTENSIONS = {
  recommendations: [
    'unhook.unhook-vscode',
    'ms-vscode.vscode-json',
    'redhat.vscode-yaml',
  ],
};

async function main() {
  if (TEST_MODE) {
    if (!TEST_REPO) {
      console.error(
        '❌ Test mode requires specifying a repository with --repo=repo-name',
      );
      console.log(
        'Example: bun run scripts/add-unhook-to-repos.ts --test --repo=my-test-repo',
      );
      process.exit(1);
    }

    console.log(
      `🧪 TEST MODE: Adding Unhook to single repository: ${TEST_REPO}`,
    );
    console.log(`🚀 Starting to add Unhook to repository: ${TEST_REPO}`);
  } else {
    console.log(
      `🚀 Starting to add Unhook to all repositories for user: ${GITHUB_USER}`,
    );
  }

  try {
    // Create temp directory
    if (!existsSync(TEMP_DIR)) {
      mkdirSync(TEMP_DIR, { recursive: true });
    }

    if (TEST_MODE) {
      // Test mode: process only the specified repository
      const testRepo: GitHubRepo = {
        clone_url: `https://github.com/${GITHUB_USER}/${TEST_REPO}.git`,
        default_branch: 'main',
        fork: false,
        full_name: `${GITHUB_USER}/${TEST_REPO}`,
        name: TEST_REPO ?? 'unknown',
        private: false,
      };

      try {
        const proceed = await confirmForRepo(testRepo.name);
        if (proceed) {
          await processRepository(testRepo);
        } else {
          console.log(`⏭️  Skipped ${testRepo.name} by user choice`);
        }
        console.log('✅ Test completed successfully!');
        console.log(
          '💡 If everything looks good, run without --test to process all repositories',
        );
      } catch (unknownError) {
        console.error(`❌ Test failed for ${TEST_REPO}:`, unknownError);
        process.exit(1);
      }
    } else {
      // Normal mode: process all repositories
      const repos = await getGitHubRepos();
      console.log(`📋 Found ${repos.length} repositories`);

      // Filter out forks and process each repo
      const nonForkRepos = repos.filter((repo) => !repo.fork);
      console.log(`🎯 Processing ${nonForkRepos.length} non-fork repositories`);

      for (const repo of nonForkRepos) {
        try {
          const proceed = await confirmForRepo(repo.name);
          if (!proceed) {
            console.log(`⏭️  Skipped ${repo.name} by user choice`);
            continue;
          }
          await processRepository(repo);
        } catch (error) {
          console.error(`❌ Error processing ${repo.name}:`, error);
        }
      }

      console.log('✅ Completed processing all repositories');
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    // Cleanup temp directory
    cleanup();
  }
}

async function confirmForRepo(repoName: string): Promise<boolean> {
  if (AUTO_YES) return true;

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`❓ Add Unhook files to '${repoName}'? [y/N]: `, (answer) => {
      rl.close();
      const normalized = (answer || '').trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

async function getGitHubRepos(): Promise<GitHubRepo[]> {
  try {
    // Check if GitHub CLI is available
    execSync('gh --version', { stdio: 'ignore' });

    console.log('🔍 Using GitHub CLI to fetch repositories...');
    const output = execSync(
      `gh repo list ${GITHUB_USER} --json name,full_name,clone_url,default_branch,private,fork --limit 1000`,
      {
        encoding: 'utf8',
      },
    );

    return JSON.parse(output);
  } catch (error) {
    console.log('🔍 GitHub CLI not available, trying GitHub API...', {
      error,
    });

    // Fallback to GitHub API (requires GITHUB_TOKEN environment variable)
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(
        'GITHUB_TOKEN environment variable is required when GitHub CLI is not available',
      );
    }

    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&type=all`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as GitHubRepo[];
  }
}

async function processRepository(repo: GitHubRepo): Promise<void> {
  const repoPath = join(TEMP_DIR, repo.name);

  console.log(`\n📁 Processing: ${repo.name}`);

  try {
    // Clone repository
    if (existsSync(repoPath)) {
      console.log('  🔄 Repository already exists, pulling latest changes...');
      execSync('git pull', { cwd: repoPath, stdio: 'pipe' });
    } else {
      console.log('  📥 Cloning repository...');
      execSync(`git clone ${repo.clone_url} ${repoPath}`, { stdio: 'pipe' });
    }

    // Check if unhook.yml already exists
    const unhookConfigPath = join(repoPath, 'unhook.yml');
    if (existsSync(unhookConfigPath)) {
      console.log('  ⚠️  unhook.yml already exists, skipping...');
    } else {
      console.log('  ➕ Adding unhook.yml...');
      writeFileSync(unhookConfigPath, UNHOOK_CONFIG);
    }

    // Check if .vscode/extensions.json exists and update it
    const vscodeDir = join(repoPath, '.vscode');
    const extensionsPath = join(vscodeDir, 'extensions.json');

    if (existsSync(extensionsPath)) {
      console.log('  🔄 Updating existing .vscode/extensions.json...');
      await updateExtensionsFile(extensionsPath);
    } else {
      console.log('  ➕ Creating .vscode/extensions.json...');
      if (!existsSync(vscodeDir)) {
        mkdirSync(vscodeDir, { recursive: true });
      }
      writeFileSync(extensionsPath, JSON.stringify(VSCODE_EXTENSIONS, null, 2));
    }

    // Check if there are any changes to commit
    const status = execSync('git status --porcelain', {
      cwd: repoPath,
      encoding: 'utf8',
    });

    if (status.trim()) {
      console.log('  💾 Committing changes...');

      // Add all files
      execSync('git add .', { cwd: repoPath, stdio: 'pipe' });

      // Commit with descriptive message
      const commitMessage = `feat: add Unhook configuration and VS Code extension recommendations

- Add unhook.yml for webhook development setup
- Add VS Code extension recommendations including Unhook extension
- Configure local development environment for webhook testing`;

      execSync(`git commit -m "${commitMessage}"`, {
        cwd: repoPath,
        stdio: 'pipe',
      });

      // Push changes
      console.log('  🚀 Pushing changes...');
      execSync(`git push origin ${repo.default_branch}`, {
        cwd: repoPath,
        stdio: 'pipe',
      });

      console.log(`  ✅ Successfully updated ${repo.name}`);
    } else {
      console.log(`  ℹ️  No changes to commit for ${repo.name}`);
    }
  } catch (error) {
    console.error(`  ❌ Error processing ${repo.name}:`, error);
    throw error;
  }
}

async function updateExtensionsFile(extensionsPath: string): Promise<void> {
  try {
    const content = readFileSync(extensionsPath, 'utf8');
    const extensions: VSCodeExtensions = JSON.parse(content);

    // Add Unhook extension if not already present
    if (!extensions.recommendations.includes(UNHOOK_EXTENSION_ID)) {
      extensions.recommendations.unshift(UNHOOK_EXTENSION_ID);

      // Write back the updated file
      writeFileSync(extensionsPath, JSON.stringify(extensions, null, 2));
    }
  } catch (error) {
    console.error('  ⚠️  Error updating extensions.json:', error);
    // If there's an error parsing, create a new one
    writeFileSync(extensionsPath, JSON.stringify(VSCODE_EXTENSIONS, null, 2));
  }
}

function cleanup(): void {
  try {
    if (existsSync(TEMP_DIR)) {
      console.log('\n🧹 Cleaning up temporary directory...');
      execSync(`rm -rf "${TEMP_DIR}"`, { stdio: 'pipe' });
      console.log('✅ Cleanup completed');
    }
  } catch (error) {
    console.error('⚠️  Error during cleanup:', error);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Process interrupted by user');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Process terminated');
  cleanup();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
