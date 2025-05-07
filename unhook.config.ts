import { defineTunnelConfig } from '@unhook/cli';

const config = defineTunnelConfig({
  tunnelId: 't_internal',
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
