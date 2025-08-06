import { ConfigManager } from '../config.manager';
import type { AuthStore } from '../services/auth.service';

/**
 * Gets the default webhook ID to use when no webhook is available
 * @returns The default webhook ID
 */
export function getDefaultWebhookId(): string {
  return 'wh_example';
}

/**
 * Fetches the first webhook ID from the user's account or returns the default
 * @param authStore - The auth store to use for API calls
 * @returns The webhook ID to use in the configuration
 */
export async function getWebhookIdForConfig(
  authStore: AuthStore | undefined,
): Promise<string> {
  let webhookId = getDefaultWebhookId();

  if (authStore?.isSignedIn && authStore?.api) {
    try {
      const webhooks = await authStore.api.webhooks.all.query();
      if (webhooks && webhooks.length > 0 && webhooks[0]) {
        webhookId = webhooks[0].id;
        console.log(`Using webhook ID from account: ${webhookId}`);
      } else {
        console.log('No webhooks found in account, using default ID');
      }
    } catch (error) {
      // If we can't fetch webhooks, fall back to the default
      console.warn('Failed to fetch webhooks for config template:', error);
    }
  } else {
    console.log('User not signed in, using default webhook ID');
  }

  return webhookId;
}

/**
 * Creates a complete configuration content with the webhook ID fetched from the user's account
 * @param authStore - The auth store to use for API calls
 * @returns The configuration content with the webhook ID replaced
 */
export async function createConfigContentWithWebhookId(
  authStore: AuthStore | undefined,
): Promise<string> {
  const webhookId = await getWebhookIdForConfig(authStore);
  const configManager = ConfigManager.getInstance();
  const apiUrl = configManager.getApiUrl();

  return `# Unhook Webhook Configuration
#
# For more information, visit: https://docs.unhook.sh/configuration
#
# Copy the following URL in your services:
# ${apiUrl}/${webhookId}
#
# Optionally, you can attach ?source=Clerk to the URL.
# Clerk: ${apiUrl}/${webhookId}?source=clerk
# Stripe: ${apiUrl}/${webhookId}?source=stripe
# etc...
#
# Schema:
#   webhookId: string                    # Unique identifier for your webhook
#   destination:                         # Array of destination endpoints
#     - name: string                     # Name of the endpoint
#       url: string|URL|RemotePattern    # URL to forward webhooks to
#       ping?: boolean|string|URL        # Optional ping configuration
#   delivery:                             # Array of delivery rules
#     - source?: string                  # Optional source filter (default: *)
#       destination: string              # Name of the destination from 'destination' array

# Test Curl:
# curl -X POST ${apiUrl}/${webhookId}?source=test -H "Content-Type: application/json" -d '{"type": "test.command", "data": { "message": "Hello, world!" }}'

webhookId: ${webhookId}
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: local
`;
}
