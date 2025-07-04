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
        return { success: false, error: 'Slack webhook URL is not configured' };
      }
      const handler = new SlackDestination();
      return handler.send(data, {
        webhookUrl: destination.config.slackWebhookUrl,
        channel: destination.config.slackChannel,
      });
    }
    case 'discord': {
      if (!destination.config.discordWebhookUrl) {
        return {
          success: false,
          error: 'Discord webhook URL is not configured',
        };
      }
      const handler = new DiscordDestination();
      return handler.send(data, {
        webhookUrl: destination.config.discordWebhookUrl,
      });
    }
    case 'teams': {
      if (!destination.config.teamsWebhookUrl) {
        return { success: false, error: 'Teams webhook URL is not configured' };
      }
      const handler = new TeamsDestination();
      return handler.send(data, {
        webhookUrl: destination.config.teamsWebhookUrl,
      });
    }
    case 'webhook': {
      if (!destination.config.url) {
        return { success: false, error: 'Webhook URL is not configured' };
      }
      const handler = new WebhookDestination();
      return handler.send(data, {
        url: destination.config.url,
        headers: destination.config.headers,
        authentication: destination.config.authentication,
      });
    }
    case 'email':
      return {
        success: false,
        error: 'Email destination is not implemented yet',
      };
    default:
      return {
        success: false,
        error: `Unknown destination type: ${destination.type}`,
      };
  }
}
