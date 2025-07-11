import { debug } from '@unhook/logger';
import type {
  Destination,
  DestinationResult,
  TeamsDestinationConfig,
} from '../types';

const log = debug('unhook:forwarding:teams-destination');

export class TeamsDestination implements Destination {
  async send(
    data: unknown,
    config: TeamsDestinationConfig,
  ): Promise<DestinationResult> {
    try {
      if (!config.webhookUrl) {
        throw new Error('Teams webhook URL is required');
      }

      // Format the message for Teams
      const teamsMessage = this.formatTeamsMessage(data);

      const response = await fetch(config.webhookUrl, {
        body: JSON.stringify(teamsMessage),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `Teams API error: ${response.status} - ${responseText}`,
        );
      }

      // Convert headers to a plain object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        response: {
          body: responseText,
          headers,
          status: response.status,
        },
        success: true,
      };
    } catch (error) {
      log('Failed to send to Teams:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      };
    }
  }

  private formatTeamsMessage(data: unknown): object {
    // If the data is already in Teams format, use it directly
    if (this.isTeamsMessage(data)) {
      return data as object;
    }

    // Otherwise, format it as an adaptive card
    const sections: unknown[] = [];

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

      sections.push({
        activitySubtitle: timestamp,
        activityTitle: `Webhook Event: ${eventType}`,
        facts: Object.entries(data)
          .slice(0, 10)
          .map(([key, value]) => ({
            name: key,
            value: String(value).substring(0, 100),
          })),
        markdown: true,
      });

      // Add raw data section if needed
      if (Object.keys(data).length > 10) {
        sections.push({
          markdown: true,
          text: `\`\`\`json\n${JSON.stringify(data, null, 2).substring(
            0,
            1000,
          )}\`\`\``,
        });
      }
    } else {
      sections.push({
        markdown: false,
        text: String(data),
      });
    }

    return {
      '@context': 'https://schema.org/extensions',
      '@type': 'MessageCard',
      sections,
      summary: 'Webhook Event',
      themeColor: '0078D7',
    };
  }

  private isTeamsMessage(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const msg = data as Record<string, unknown>;
    return (
      msg['@type'] === 'MessageCard' ||
      typeof msg.text === 'string' ||
      Array.isArray(msg.sections)
    );
  }
}
