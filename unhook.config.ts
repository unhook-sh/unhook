import { defineTunnelConfig } from '@unhook/cli';

const config = defineTunnelConfig({
  tunnelId: 't_internal',
  telemetry: true,
  clientId: 'my-app',
  debug: false,
  from: [
    {
      name: 'Stripe',
      agent: {
        type: 'header',
        key: 'x-stripe-agent',
        value: 'Stripe',
      },
      timestamp: {
        type: 'header',
        key: 'x-stripe-timestamp',
        value: 'Stripe',
      },
      verification: {
        type: 'header',
        key: 'x-stripe-verification',
        value: 'Stripe',
      },
      secret: 'ws_secret', // process.env.STRIPE_WEBHOOK_SECRET
      defaultTimeout: 10000,
    },
  ],
  to: [{ name: 'localhost', url: 'http://localhost:3000' }],
  forward: [
    { from: '*', to: 'localhost' },
    { from: 'stripe', to: 'localhost' },
    { from: 'clerk', to: 'localhost' },
  ],
} as const);

export default config;
