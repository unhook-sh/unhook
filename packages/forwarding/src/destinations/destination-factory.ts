import type { ForwardingDestinationType } from '@unhook/db/schema';
import type { DestinationResult } from '../types';
import { DiscordDestination } from './discord';
import { SlackDestination } from './slack';
import { TeamsDestination } from './teams';
import { WebhookDestination } from './webhook';

export async function sendToDestination(
  data: unknown,
  destination: ForwardingDestinationType,
): Promise<DestinationResult> {
  // Handle each destination type separately to ensure proper typing
  switch (destination.type) {
    case 'slack': {
      if (!destination.config.slackWebhookUrl) {
        return { error: 'Slack webhook URL is not configured', success: false };
      }
      const handler = new SlackDestination();
      return handler.send(data, {
        channel: destination.config.slackChannel,
        webhookUrl: destination.config.slackWebhookUrl,
      });
    }
    case 'discord': {
      if (!destination.config.discordWebhookUrl) {
        return {
          error: 'Discord webhook URL is not configured',
          success: false,
        };
      }
      const handler = new DiscordDestination();
      return handler.send(data, {
        webhookUrl: destination.config.discordWebhookUrl,
      });
    }
    case 'teams': {
      if (!destination.config.teamsWebhookUrl) {
        return { error: 'Teams webhook URL is not configured', success: false };
      }
      const handler = new TeamsDestination();
      return handler.send(data, {
        webhookUrl: destination.config.teamsWebhookUrl,
      });
    }
    case 'webhook': {
      if (!destination.config.url) {
        return { error: 'Webhook URL is not configured', success: false };
      }
      const handler = new WebhookDestination();
      return handler.send(data, {
        authentication: destination.config.authentication,
        headers: destination.config.headers,
        url: destination.config.url,
      });
    }
    case 'email':
      return {
        error: 'Email destination is not implemented yet',
        success: false,
      };
    default:
      return {
        error: `Unknown destination type: ${destination.type}`,
        success: false,
      };
  }
}
