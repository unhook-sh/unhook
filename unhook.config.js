// @ts-check

/**
 * Tunnel Configuration Example
 *
 * Environment Variables:
 * All settings can also be configured using environment variables:
 * - TUNNEL_PORT=3000
 * - TUNNEL_API_KEY=your-api-key-here
 * - TUNNEL_CLIENT_ID=my-app
 * - TUNNEL_DEBUG=true|false|1|0|yes|no
 *
 * Priority order (highest to lowest):
 * 1. Command line arguments
 * 2. Environment variables
 * 3. Configuration file
 * 4. Default values
 *
 * @type {import('@unhook/cli').TunnelConfig}
 */
const config = {
  // API key for authentication with the tunnel server
  // Can also be set via:
  // - TUNNEL_ID environment variable
  // - --tunnel-id command line flag
  tunnelId: 't_internal',

  telemetry: true,

  // Optional: Unique client identifier
  // Can also be set via TUNNEL_CLIENT_ID environment variable
  // Default: auto-generated
  clientId: 'my-app',

  // Optional: Enable debug logging
  // Can also be set via TUNNEL_DEBUG environment variable
  // Default: false
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
  forward: [
    {
      from: 'Stripe',
      to: new URL('https://stripe.com'),
      ping: true,
    },
  ],
};

export default config;
