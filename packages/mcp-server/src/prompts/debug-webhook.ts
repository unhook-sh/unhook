import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';

import { trackPromptUsage } from '../analytics';

export const debugWebhookSchema = {
  timeframe: z.string().optional(),
  webhookId: z.string(),
};

export function registerDebugWebhookPrompt(server: McpServer) {
  server.registerPrompt(
    'debug_webhook_issue',
    {
      // biome-ignore lint/suspicious/noExplicitAny: MCP SDK requires any for schema type
      argsSchema: debugWebhookSchema as any,
      description: 'Debug a webhook issue step by step',
      title: 'Debug Webhook Issue',
    },
    // biome-ignore lint/suspicious/noExplicitAny: MCP SDK callback signature
    ({ webhookId, timeframe = 'last 24 hours' }: any, extra: any) => {
      const userId = extra.authInfo?.extra?.userId as string;
      const organizationId = extra.authInfo?.extra?.organizationId as string;

      // Track prompt usage
      trackPromptUsage(
        'debug_webhook_issue',
        {
          timeframe,
          webhook_id: webhookId,
        },
        userId,
        organizationId,
      );

      return {
        messages: [
          {
            content: {
              text: 'You are a webhook debugging assistant. Analyze the webhook data and help identify issues.',
              type: 'text',
            },
            role: 'assistant',
          },
          {
            content: {
              text: `Please help me debug webhook ${webhookId} for the ${timeframe}.

Start by:
1. Getting the webhook statistics
2. Searching for recent events and their status
3. Looking for failed requests and analyzing their errors
4. Providing recommendations for fixing any issues found`,
              type: 'text',
            },
            role: 'user',
          },
        ],
      };
    },
  );
}
