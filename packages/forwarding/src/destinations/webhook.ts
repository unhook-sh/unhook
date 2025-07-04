import { debug } from '@unhook/logger';
import type {
  Destination,
  DestinationResult,
  WebhookDestinationConfig,
} from '../types';

const log = debug('unhook:forwarding:webhook-destination');

export class WebhookDestination implements Destination {
  async send(
    data: unknown,
    config: WebhookDestinationConfig,
  ): Promise<DestinationResult> {
    try {
      if (!config.url) {
        throw new Error('Webhook URL is required');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers,
      };

      // Add authentication headers if configured
      if (config.authentication) {
        switch (config.authentication.type) {
          case 'bearer':
            if (config.authentication.token) {
              headers.Authorization = `Bearer ${config.authentication.token}`;
            }
            break;
          case 'basic':
            if (
              config.authentication.username &&
              config.authentication.password
            ) {
              const credentials = Buffer.from(
                `${config.authentication.username}:${config.authentication.password}`,
              ).toString('base64');
              headers.Authorization = `Basic ${credentials}`;
            }
            break;
          case 'apiKey':
            if (
              config.authentication.apiKey &&
              config.authentication.apiKeyHeader
            ) {
              headers[config.authentication.apiKeyHeader] =
                config.authentication.apiKey;
            }
            break;
        }
      }

      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      const responseText = await response.text();
      let responseBody: unknown;

      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status} - ${responseText}`);
      }

      // Convert headers to a plain object
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        success: true,
        response: {
          status: response.status,
          headers: responseHeaders,
          body: responseBody,
        },
      };
    } catch (error) {
      log('Failed to send webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
