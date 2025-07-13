import { z } from 'zod';

import { trackPromptUsage } from '../analytics';

export const performanceReportSchema = {
  webhookId: z.string().optional(),
};

export function registerPerformanceReportPrompt(server: any) {
  server.registerPrompt(
    'performance_report',
    {
      argsSchema: performanceReportSchema,
      description: 'Generate a performance report for webhooks',
      title: 'Performance Report',
    },
    ({ webhookId }: z.infer<typeof performanceReportSchema>, extra: any) => {
      const userId = extra?.authInfo?.extra?.userId;
      const organizationId = extra?.authInfo?.extra?.organizationId;

      // Track prompt usage
      trackPromptUsage(
        'performance_report',
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
              text: 'You are a webhook performance analyst. Generate comprehensive performance reports.',
              type: 'text',
            },
            role: 'system',
          },
          {
            content: {
              text: `Generate a performance report${
                webhookId ? ` for webhook ${webhookId}` : ' for all webhooks'
              }.

Include:
1. Overall statistics (total requests, success rate, etc.)
2. Response time analysis (average, min, max, percentiles)
3. Error rate trends
4. Peak usage times
5. Performance recommendations
6. Comparison with best practices`,
              type: 'text',
            },
            role: 'user',
          },
        ],
      };
    },
  );
}
