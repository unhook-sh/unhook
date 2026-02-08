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
  // Optional: Unique client identifier
  // Can also be set via WEBHOOK_CLIENT_ID environment variable
  // Default: auto-generated
  clientId: 'my-app',

  // Optional: Enable debug logging
  // Can also be set via WEBHOOK_DEBUG environment variable
  // Default: false
  debug: false,

  // Delivery rules: each rule maps a source to a local destination URL
  delivery: [
    {
      // Destination: the local URL to forward webhooks to
      destination: 'http://localhost:3000/api/webhooks/clerk',
      // Source filter: which webhook source to match ("*" = all sources)
      source: 'clerk',
      // Optional: custom field name in the webhook body that contains the event type
      // Useful when the provider uses a non-standard field like "resourceType" or "subscriptionType"
      // Supports dot notation for nested fields (e.g., "data.type")
      // eventTypeField: 'type',
    },
  ],

  // Full webhook URL for authentication with the webhook server
  // Format: https://unhook.sh/{orgName}/{webhookName}
  // Can also be set via:
  // - WEBHOOK_WEBHOOK_URL environment variable
  // - --webhook-url command line flag
  webhookUrl: 'https://unhook.sh/my-org/my-webhook',
};

export default config;
