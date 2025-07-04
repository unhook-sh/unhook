import { debug } from '@unhook/logger';
import type {
  Destination,
  DestinationResult,
  DiscordDestinationConfig,
} from '../types';

const log = debug('unhook:forwarding:discord-destination');

export class DiscordDestination implements Destination {
  async send(
    data: unknown,
    config: DiscordDestinationConfig,
  ): Promise<DestinationResult> {
    try {
      if (!config.webhookUrl) {
        throw new Error('Discord webhook URL is required');
      }

      // Format the message for Discord
      const discordMessage = this.formatDiscordMessage(data);

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordMessage),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `Discord API error: ${response.status} - ${responseText}`,
        );
      }

      // Convert headers to a plain object
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
      log('Failed to send to Discord:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private formatDiscordMessage(data: unknown): object {
    // If the data is already in Discord format, use it directly
    if (this.isDiscordMessage(data)) {
      return data as object;
    }

    // Otherwise, format it as an embed
    const embed: Record<string, unknown> = {
      title: 'Webhook Event',
      timestamp: new Date().toISOString(),
      color: 0x7289da, // Discord blurple
    };

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

      embed.title = `Webhook Event: ${eventType}`;
      embed.timestamp = timestamp as string;

      // Add fields for better formatting
      embed.fields = [
        {
          name: 'Event Data',
          value: `\`\`\`json\n${JSON.stringify(data, null, 2).substring(
            0,
            1000,
          )}\`\`\``,
          inline: false,
        },
      ];

      // Add description if data is small enough
      if (JSON.stringify(data).length < 200) {
        embed.description = JSON.stringify(data, null, 2);
        embed.fields = [];
      }
    } else {
      embed.description = String(data);
    }

    return {
      embeds: [embed],
    };
  }

  private isDiscordMessage(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const msg = data as Record<string, unknown>;
    return (
      typeof msg.content === 'string' ||
      Array.isArray(msg.embeds) ||
      typeof msg.username === 'string'
    );
  }
}
