import { defineWebhookConfig } from '@unhook/cli';

const config = defineWebhookConfig({
  webhookId: 'wh_xpsduom94d3hhdu0wp9cink1',
  to: [
    {
      name: 'default',
      url: 'http://localhost:3000/api/webhooks/clerk',
    },
  ],
  deliver: [
    {
      from: 'clerk',
      to: 'default',
    },
  ],
} as const);

export default config;
