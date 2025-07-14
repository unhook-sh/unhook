import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { trackPromptUsage } from '../analytics';

export const analyzeFailuresSchema = {
  webhookId: z.string().optional(),
};

export function registerAnalyzeFailuresPrompt(server: McpServer) {
  server.registerPrompt(
    'analyze_failures',
    {
      argsSchema: analyzeFailuresSchema,
      description: 'Analyze webhook failures and suggest fixes',
      title: 'Analyze Failures',
    },
    ({ webhookId }, extra) => {
      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      // Track prompt usage
      trackPromptUsage(
        'analyze_failures',
        {
          webhook_id: webhookId,
        },
        userId,
        organizationId,
      );

      return {
        messages: [
          {
            content: {
              text: 'You are a webhook failure analysis expert. Identify patterns in failures and suggest solutions.',
              type: 'text',
            },
            role: 'assistant',
          },
          {
            content: {
              text: `Please analyze webhook failures${
                webhookId ? ` for webhook ${webhookId}` : ' across all webhooks'
              }.

Focus on:
1. Finding all failed events and requests
2. Identifying common failure patterns
3. Analyzing error messages and response codes
4. Suggesting specific fixes for each type of failure
5. Recommending configuration changes to prevent future failures`,
              type: 'text',
            },
            role: 'user',
          },
        ],
      };
    },
  );
}
