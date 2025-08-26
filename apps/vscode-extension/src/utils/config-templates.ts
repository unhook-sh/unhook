import { ConfigManager } from '../config.manager';
import type { AuthStore } from '../services/auth.service';

/**
 * Gets the default webhook URL to use when no webhook is available
 * @returns The default webhook URL
 */
export function getDefaultWebhookUrl(): string {
  const configManager = ConfigManager.getInstance();
  const baseUrl = configManager.getApiUrl();
  return `${baseUrl}/my-org/unhook-prod`;
}

/**
 * Fetches the first webhook URL from the user's account or returns the default
 * @param authStore - The auth store to use for API calls
 * @returns The webhook URL to use in the configuration
 */
export async function getWebhookUrlForConfig(
  authStore: AuthStore | undefined,
): Promise<string> {
  const configManager = ConfigManager.getInstance();
  const baseUrl = configManager.getApiUrl();
  let webhookUrl = getDefaultWebhookUrl();

  if (authStore?.isSignedIn && authStore?.api) {
    try {
      const webhooks = await authStore.api.webhooks.all.query();
      if (webhooks && webhooks.length > 0 && webhooks[0]) {
        const authInfo = await authStore.api.auth.verifySessionToken.query({
          sessionId: authStore.sessionId || '',
          sessionTemplate: 'cli',
        });
        const orgName = authInfo.orgName || 'my-org';
        webhookUrl = `${baseUrl}/${orgName}/${webhooks[0].name}`;
        console.log(`Using webhook URL from account: ${webhookUrl}`);
      } else {
        console.log('No webhooks found in account, using default URL');
      }
    } catch (error) {
      // If we can't fetch webhooks, fall back to the default
      console.warn('Failed to fetch webhooks for config template:', error);
    }
  } else {
    console.log('User not signed in, using default webhook URL');
  }

  return webhookUrl;
}

/**
 * Creates a complete configuration content with the webhook ID fetched from the user's account
 * @param authStore - The auth store to use for API calls
 * @returns The configuration content with the webhook ID replaced
 */
export async function createConfigContentWithWebhookUrl(
  authStore: AuthStore | undefined,
): Promise<string> {
  const webhookUrl = await getWebhookUrlForConfig(authStore);
  const configManager = ConfigManager.getInstance();
  const apiUrl = configManager.getApiUrl();

  return `# Unhook Webhook Configuration
#
# For more information, visit: https://docs.unhook.sh/configuration
#
# Copy the following URL in your services:
# ${webhookUrl}
#
# Optionally, you can attach ?source=Clerk to the URL.
# Clerk: ${webhookUrl}?source=clerk
# Stripe: ${webhookUrl}?source=stripe
# etc...
#
# Schema:
#   webhookUrl: string                   # Full webhook URL (e.g., ${apiUrl}/my-org/my-webhook)
#   destination:                         # Array of destination endpoints
#     - name: string                     # Name of the endpoint
#       url: string|URL|RemotePattern    # URL to forward webhooks to
#       ping?: boolean|string|URL        # Optional ping configuration
#   delivery:                             # Array of delivery rules
#     - source?: string                  # Optional source filter (default: *)
#       destination: string              # Name of the destination from 'destination' array

# Test Curl:
# curl -X POST ${webhookUrl}?source=test -H "Content-Type: application/json" -d '{"type": "test.command", "data": { "message": "Hello, world!" }}'

webhookUrl: ${webhookUrl}
destination:
  - name: localhost
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: localhost
`;
}

/**
 * Creates a minimal YAML configuration without comments
 * @param webhookUrl - The webhook URL to use in the configuration
 * @returns The minimal YAML configuration content
 */
export function createMinimalConfigContent(webhookUrl: string): string {
  return `webhookUrl: ${webhookUrl}
destination:
  - name: localhost
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: localhost`;
}

/**
 * Creates a complete configuration content with a specific webhook URL
 * @param webhookUrl - The specific webhook URL to use
 * @returns The configuration content with the webhook URL
 */
export function createConfigContentWithSpecificWebhookUrl(
  webhookUrl: string,
): string {
  const configManager = ConfigManager.getInstance();
  const apiUrl = configManager.getApiUrl();
  return `# Unhook Webhook Configuration
#
# For more information, visit: https://docs.unhook.sh/configuration
#
# Copy the following URL in your services:
# ${webhookUrl}
#
# Optionally, you can attach ?source=Clerk to the URL.
# Clerk: ${webhookUrl}?source=clerk
# Stripe: ${webhookUrl}?source=stripe
# etc...
#
# Schema:
#   webhookUrl: string                   # Full webhook URL (e.g., ${apiUrl}/my-org/my-webhook)
#   destination:                         # Array of destination endpoints
#     - name: string                     # Name of the endpoint
#       url: string|URL|RemotePattern    # URL to forward webhooks to
#       ping?: boolean|string|URL        # Optional ping configuration
#   delivery:                             # Array of delivery rules
#     - source?: string                  # Optional source filter (default: *)
#       destination: string              # Name of the destination from 'destination' array

# Test Curl:
# curl -X POST ${webhookUrl}?source=test -H "Content-Type: application/json" -d '{"type": "test.command", "data": { "message": "Hello, world!" }}'

webhookUrl: ${webhookUrl}
destination:
  - name: localhost
    url: http://localhost:3000/api/webhooks
delivery:
  - source: '*'
    destination: localhost
`;
}
