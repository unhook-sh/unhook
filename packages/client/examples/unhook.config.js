// @ts-check

/**
 * Webhook Configuration Example
 *
 * Environment Variables:
 * All settings can also be configured using environment variables:
 * - WEBHOOK_PORT=3000
 * - WEBHOOK_API_KEY=your-api-key-here
 * - WEBHOOK_CLIENT_ID=my-app
 * - WEBHOOK_DEBUG=true|false|1|0|yes|no
 *
 * Priority order (highest to lowest):
 * 1. Command line arguments
 * 2. Environment variables
 * 3. Configuration file
 * 4. Default values
 *
 * @type {import('@unhook/client/config').WebhookConfig}
 */
const config = {
  // Webhook ID for authentication with the webhook server
  // Can also be set via:
  // - WEBHOOK_WEBHOOK_ID environment variable
  // - --webhook-id command line flag
  webhookId: 't_2vCR1xwHHTLxE5m20AYewlc5y2j',

  // Optional: Unique client identifier
  // Can also be set via WEBHOOK_CLIENT_ID environment variable
  // Default: auto-generated
  clientId: 'my-app',

  // Optional: Enable debug logging
  // Can also be set via WEBHOOK_DEBUG environment variable
  // Default: false
  debug: false,

  destination: [
    {
      name: 'clerk',
      url: 'http://localhost:3000/api/webhooks/clerk',
    },
  ],
  deliver: [
    {
      source: 'clerk',
      destination: 'clerk',
    },
  ],
};

export default config;
