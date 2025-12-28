import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { $ } from 'bun';
import type { PackageInfo } from './types';
import { REPO_URL } from './types';

export interface ChangelogOptions {
  includeCommitList: boolean;
}

/**
 * Fetch git diff for changelog analysis
 */
async function getGitDiff(
  fromTag: string | null,
  pathFilter: string,
): Promise<string> {
  try {
    const range = fromTag ? `${fromTag}..HEAD` : 'HEAD~20..HEAD';
    // Get a summarized diff (stat + limited patch) to avoid overwhelming the model
    const result =
      await $`git diff ${range} --stat --patch -U3 -- ${pathFilter}`.text();

    // Limit diff size to avoid token limits (~50KB)
    const maxDiffSize = 50000;
    if (result.length > maxDiffSize) {
      // If diff is too large, just use stat summary
      const statOnly =
        await $`git diff ${range} --stat -- ${pathFilter}`.text();
      return `[Diff truncated - showing summary only]\n\n${statOnly}`;
    }

    return result || '[No changes in diff]';
  } catch {
    return '[Unable to fetch git diff]';
  }
}

/**
 * Generate changelog using Claude Code CLI with OpenRouter
 *
 * We fetch the git diff ourselves and pass it to Claude for deep analysis,
 * since OpenRouter doesn't fully support Claude's agentic tool-use mode.
 *
 * Requires:
 * - Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)
 * - OPENROUTER_API_KEY environment variable set
 *
 * @see https://openrouter.ai/docs/guides/guides/claude-code-integration
 */
export async function generateChangelog(
  commits: string[],
  packageName: string,
  fromTag: string | null,
  pathFilter: string,
  options: ChangelogOptions = { includeCommitList: false },
  preGeneratedChangelog?: string,
): Promise<string> {
  // If we have a pre-generated changelog from the GitHub Action, use it
  if (preGeneratedChangelog?.trim()) {
    const changelog = preGeneratedChangelog.trim();
    if (options.includeCommitList) {
      return `${changelog}\n\n${formatCommitList(commits)}`;
    }
    return changelog;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.log('⚠️  OPENROUTER_API_KEY not set, using commit messages');
    return formatCommitsAsChangelog(commits, options);
  }

  if (commits.length === 0) {
    return '- Release maintenance';
  }

  // Fetch the git diff for Claude to analyze
  const gitDiff = await getGitDiff(fromTag, pathFilter);

  const commitList = commits
    .map((c) => {
      const parts = c.split('|');
      const [_fullHash, shortHash, message, author] = parts;
      return `- ${shortHash}: ${message} (${author})`;
    })
    .join('\n');

  // Construct a detailed prompt with the actual diff content
  const prompt = `You are a technical writer creating a changelog for ${packageName}.

## Context
- Repository: unhook-sh/unhook
- Package path: ${pathFilter}
- Changes since: ${fromTag || 'initial commit'}

## Commits
${commitList}

## Code Changes (git diff)
\`\`\`diff
${gitDiff}
\`\`\`

## Your Task

Analyze the code changes above to create a meaningful changelog. Don't just repeat commit messages - understand what the code actually does and explain it from a user's perspective.

## Output Requirements

1. **Categorize changes** (only include categories that have changes):
   - **Added**: New features or capabilities
   - **Changed**: Modifications to existing functionality
   - **Fixed**: Bug fixes
   - **Improved**: Performance or UX improvements

2. **Write user-focused descriptions**:
   - Start with action verbs (Add, Fix, Improve, Update, etc.)
   - Explain the benefit to users, not implementation details
   - Be concise but descriptive

3. **Skip these**:
   - "chore: version packages" or version bumps
   - Merge commits
   - Pure refactoring with no user impact

4. **If no meaningful user-facing changes**, respond with: "- Release maintenance"

## Format

Output ONLY the changelog content. Do NOT include:
- Version numbers or dates
- Introductory text like "Here's the changelog"
- Explanations of your analysis

Start directly with the category headers (e.g., "**Added**") and bullet points.`;

  try {
    // Use Claude Code CLI with --print flag for single-shot generation
    // We pass the diff content directly in the prompt
    // OpenRouter requires: ANTHROPIC_MODEL to specify which model to use
    const result = await $`claude --print ${prompt}`
      .env({
        ...process.env,
        ANTHROPIC_API_KEY: '', // Must be explicitly empty
        ANTHROPIC_AUTH_TOKEN: apiKey,
        ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
        ANTHROPIC_MODEL: 'anthropic/claude-3.5-haiku',
      })
      .text();

    const changelog = result.trim() || '- Release maintenance';

    if (options.includeCommitList && commits.length > 0) {
      return `${changelog}\n\n${formatCommitList(commits)}`;
    }

    return changelog;
  } catch (error) {
    console.error('Claude CLI failed, falling back to commit messages:', error);
    return formatCommitsAsChangelog(commits, options);
  }
}

/**
 * Format commits as a detailed list with author info
 * Format: [shortHash] - message (author)
 */
export function formatCommitList(commits: string[]): string {
  if (commits.length === 0) return '';

  const commitLines = commits
    .slice(0, 50) // Limit to 50 commits
    .map((c) => {
      const [fullHash, shortHash, message, author] = c.split('|');
      if (shortHash && message) {
        const authorPart = author ? ` (${author})` : '';
        return `- [\`${shortHash}\`](${REPO_URL}/commit/${fullHash}) - ${message}${authorPart}`;
      }
      return `- ${c}`;
    })
    .join('\n');

  return `### Commits\n\n${commitLines}`;
}

export function formatCommitsAsChangelog(
  commits: string[],
  options: ChangelogOptions = { includeCommitList: false },
): string {
  if (commits.length === 0) return '- Release maintenance';

  const summary = commits
    .slice(0, 20)
    .map((c) => {
      const [fullHash, shortHash, message] = c.split('|');
      if (shortHash && message) {
        return `- [\`${shortHash}\`](${REPO_URL}/commit/${fullHash}) - ${message}`;
      }
      return `- ${c}`;
    })
    .join('\n');

  if (options.includeCommitList) {
    return `${summary}\n\n${formatCommitList(commits)}`;
  }

  return summary;
}

export function getChangeTypeLabel(
  bumpType: 'patch' | 'minor' | 'major',
): string {
  switch (bumpType) {
    case 'major':
      return 'Major Changes';
    case 'minor':
      return 'Minor Changes';
    case 'patch':
      return 'Patch Changes';
  }
}

export function updateChangelogFile(
  pkg: PackageInfo,
  version: string,
  changes: string,
  bumpType: 'patch' | 'minor' | 'major',
): void {
  const changelogPath = pkg.changelogPath;
  const changeType = getChangeTypeLabel(bumpType);

  let existingContent = '';
  if (existsSync(changelogPath)) {
    existingContent = readFileSync(changelogPath, 'utf8');
  } else {
    existingContent = `# ${pkg.name}\n`;
  }

  const contentWithoutTitle = existingContent.replace(/^# .+\n+/, '');

  const newEntry = `## ${version}

### ${changeType}

${changes}

`;

  const newContent = `# ${pkg.name}

${newEntry}${contentWithoutTitle}`;

  writeFileSync(changelogPath, newContent);
}
