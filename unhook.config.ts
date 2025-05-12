import { defineWebhookConfig } from '@unhook/cli';

const config = defineWebhookConfig({
  webhookId: 'wh_xpsduom94d3hhdu0wp9cink1',
  to: [
    {
      name: 'localClerk',
      url: 'http://localhost:3000/api/webhooks/clerk',
    },
    {
      name: 'slack',
      url: 'https://hooks.slack.com/services/T00000000/B00000000/X00000000',
    },
  ],
  forward: [{ from: 'clerk', to: 'localClerk' }],
} as const);

export default config;
