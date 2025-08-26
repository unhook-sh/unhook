/**
 * Utility functions for parsing and validating webhook URLs
 */

export interface ParsedWebhookUrl {
  orgName: string;
  webhookName: string;
  baseUrl: string;
  fullUrl: string;
}

/**
 * Parses a webhook URL to extract organization name and webhook name
 * Supports both localhost and production URLs
 *
 * @param webhookUrl - The webhook URL to parse
 * @returns Parsed webhook URL with org name, webhook name, base URL, and full URL
 * @throws Error if the URL format is invalid
 *
 * @example
 * ```typescript
 * // Production URL
 * parseWebhookUrl('https://unhook.sh/my-org/my-webhook')
 * // Returns: { orgName: 'my-org', webhookName: 'my-webhook', baseUrl: 'https://unhook.sh', fullUrl: 'https://unhook.sh/my-org/my-webhook' }
 *
 * // Localhost URL
 * parseWebhookUrl('http://localhost:3000/my-org/my-webhook')
 * // Returns: { orgName: 'my-org', webhookName: 'my-webhook', baseUrl: 'http://localhost:3000', fullUrl: 'http://localhost:3000/my-org/my-webhook' }
 * ```
 */
export function parseWebhookUrl(webhookUrl: string): ParsedWebhookUrl {
  try {
    const url = new URL(webhookUrl);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    if (pathSegments.length < 2) {
      throw new Error(
        'Invalid webhook URL format - must have org/webhook path',
      );
    }

    const orgName = pathSegments[0] ?? '';
    const webhookName = pathSegments[1] ?? '';

    if (!webhookName || !orgName) {
      throw new Error('Invalid webhook URL - missing org name or webhook name');
    }

    // Validate org name format (lowercase, alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(orgName)) {
      throw new Error(
        'Invalid organization name format - must contain only lowercase letters, numbers, and hyphens',
      );
    }

    // Validate webhook name format (lowercase, alphanumeric, hyphens only)
    if (!/^[a-z0-9-]+$/.test(webhookName)) {
      throw new Error(
        'Invalid webhook name format - must contain only lowercase letters, numbers, and hyphens',
      );
    }

    const baseUrl = `${url.protocol}//${url.host}`;

    return {
      baseUrl,
      fullUrl: webhookUrl,
      orgName,
      webhookName,
    };
  } catch (urlError) {
    if (urlError instanceof Error) {
      throw new Error(
        `Invalid webhook URL format: ${webhookUrl}. ${urlError.message}`,
      );
    }
    throw new Error(`Invalid webhook URL format: ${webhookUrl}`);
  }
}

/**
 * Checks if a webhook URL is a localhost URL
 *
 * @param webhookUrl - The webhook URL to check
 * @returns true if the URL is a localhost URL, false otherwise
 */
export function isLocalhostUrl(webhookUrl: string): boolean {
  try {
    const url = new URL(webhookUrl);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Creates a webhook URL from its components
 *
 * @param baseUrl - The base URL (e.g., 'https://unhook.sh' or 'http://localhost:3000')
 * @param orgName - The organization name
 * @param webhookName - The webhook name
 * @returns The complete webhook URL
 */
export function createWebhookUrl(
  baseUrl: string,
  orgName: string,
  webhookName: string,
): string {
  // Ensure baseUrl doesn't end with a slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/${orgName}/${webhookName}`;
}

/**
 * Extracts just the organization name from a webhook URL
 *
 * @param webhookUrl - The webhook URL to parse
 * @returns The organization name
 * @throws Error if the URL format is invalid
 */
export function extractOrgName(webhookUrl: string): string {
  return parseWebhookUrl(webhookUrl).orgName;
}

/**
 * Extracts just the webhook name from a webhook URL
 *
 * @param webhookUrl - The webhook URL to parse
 * @returns The webhook name
 * @throws Error if the URL format is invalid
 */
export function extractWebhookName(webhookUrl: string): string {
  return parseWebhookUrl(webhookUrl).webhookName;
}
