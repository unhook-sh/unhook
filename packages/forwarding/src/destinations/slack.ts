import { createLogger } from '@unhook/logger';
import type {
  Destination,
  DestinationResult,
  SlackDestinationConfig,
} from '../types';

const logger = createLogger('slack-destination');

export class SlackDestination implements Destination {
  async send(
    data: unknown,
    config: SlackDestinationConfig,
  ): Promise<DestinationResult> {
    try {
      if (!config.webhookUrl) {
        throw new Error('Slack webhook URL is required');
      }

      // Format the message for Slack
      const slackMessage = this.formatSlackMessage(data, config);

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackMessage),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `Slack API error: ${response.status} - ${responseText}`,
        );
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        success: true,
        response: {
          status: response.status,
          headers,
          body: responseText,
        },
      };
    } catch (error) {
      logger.error('Failed to send to Slack:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private formatSlackMessage(
    data: unknown,
    config: SlackDestinationConfig,
  ): object {
    // If the data is already in Slack format, use it directly
    if (this.isSlackMessage(data)) {
      if (config.channel && typeof data === 'object' && data !== null) {
        return { ...data, channel: config.channel };
      }
      return data;
    }

    // Otherwise, format it as a simple message
    interface SlackMessage {
      text: string;
      channel?: string;
      blocks?: unknown[];
    }

    const message: SlackMessage = {
      text: 'Webhook Event',
    };

    if (config.channel) {
      message.channel = config.channel;
    }

    // Format the data as a code block
    if (typeof data === 'object' && data !== null) {
      const eventData = data as Record<string, unknown>;

      // Try to extract common webhook fields
      const eventType =
        eventData.type ||
        eventData.event ||
        eventData.action ||
        'Unknown Event';
      const timestamp =
        eventData.timestamp || eventData.created_at || new Date().toISOString();

      message.text = `Webhook Event: ${eventType}`;
      message.blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `Webhook Event: ${eventType}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Timestamp:*\n${timestamp}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Event Data:*\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``,
          },
        },
      ];
    } else {
      message.text = `Webhook Event: ${String(data)}`;
    }

    return message;
  }

  private isSlackMessage(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const msg = data as Record<string, unknown>;
    return (
      typeof msg.text === 'string' ||
      Array.isArray(msg.blocks) ||
      Array.isArray(msg.attachments)
    );
  }
}
