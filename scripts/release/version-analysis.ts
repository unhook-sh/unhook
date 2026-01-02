/**
 * AI SDK v6 implementation for version bump analysis
 * Uses structured output with zod schemas to determine semantic version bumps
 * Configured to use OpenRouter via baseURL
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const versionBumpSchema = z.object({
  bumpType: z
    .enum(['patch', 'minor', 'major'])
    .describe('The semantic version bump type'),
  reasoning: z
    .string()
    .describe('Brief explanation for the version bump choice'),
});

export interface VersionBumpAnalysis {
  bumpType: 'patch' | 'minor' | 'major';
  reasoning: string;
}

/**
 * Get the OpenAI model via OpenRouter
 */
function getModel() {
  const model = process.env.AI_MODEL || 'openai/gpt-4o-mini';
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is required for version bump analysis.',
    );
  }

  const openai = createOpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });
  return openai(model);
}

/**
 * Analyze a changelog to determine the appropriate semantic version bump
 *
 * @param changelog - The changelog content to analyze
 * @param packageName - The name of the package being released
 * @returns The version bump analysis with type and reasoning
 */
export async function analyzeVersionBump(
  changelog: string,
  packageName: string,
): Promise<VersionBumpAnalysis> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    // Fallback to patch if no API key is available
    console.warn(
      '⚠️  No OPENROUTER_API_KEY found. Defaulting to patch version bump.',
    );
    return {
      bumpType: 'patch',
      reasoning:
        'No OPENROUTER_API_KEY available. Defaulted to patch version bump.',
    };
  }

  try {
    const prompt = `You are analyzing a changelog for ${packageName} to determine the appropriate semantic version bump according to Semantic Versioning (semver.org).

## Changelog Content

${changelog}

## Semantic Versioning Guidelines

- **MAJOR** (x.0.0): Breaking changes that are incompatible with previous versions
  - API removals or changes that break backward compatibility
  - Significant architectural changes
  - Changes that require users to modify their code
  - Deprecation of major features

- **MINOR** (0.x.0): New features that are backward-compatible
  - New features or capabilities
  - New APIs or functions
  - Enhancements that don't break existing functionality
  - New configuration options

- **PATCH** (0.0.x): Backward-compatible bug fixes
  - Bug fixes
  - Security patches
  - Performance improvements
  - Documentation updates
  - Refactoring with no user-facing impact
  - Maintenance releases

## Analysis Instructions

1. Review the changelog categories (Added, Changed, Fixed, Improved)
2. Identify the highest-impact change type
3. Determine the appropriate version bump:
   - If there are ANY breaking changes → MAJOR
   - If there are new features (Added section) → MINOR
   - If only bug fixes and improvements → PATCH
4. Provide clear reasoning for your decision

Consider the user impact and whether the changes require action from users.`;

    const model = getModel();
    const result = await generateText({
      model,
      output: Output.object({ schema: versionBumpSchema }),
      prompt,
    });

    // AI SDK v6 returns structured output in result.output
    return {
      bumpType: result.output.bumpType,
      reasoning: result.output.reasoning,
    };
  } catch (error) {
    console.error('AI version analysis failed:', error);
    // Fallback to patch on error
    return {
      bumpType: 'patch',
      reasoning: `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Defaulted to patch version bump.`,
    };
  }
}
