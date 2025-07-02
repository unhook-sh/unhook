import type { ForwardingDestinationType } from '@unhook/db/schema';
import type { DestinationResult } from '../types';
import { DiscordDestination } from './discord';
import { SlackDestination } from './slack';
import { TeamsDestination } from './teams';
import { WebhookDestination } from './webhook';

const destinations = {
  slack: new SlackDestination(),
  discord: new DiscordDestination(),
  teams: new TeamsDestination(),
  webhook: new WebhookDestination(),
  email: null, // Email destination not implemented yet
};

export async function sendToDestination(
  data: unknown,
  destination: ForwardingDestinationType,
): Promise<DestinationResult> {
  const handler = destinations[destination.type];

  if (!handler) {
    return {
      success: false,
      error: `Destination type "${destination.type}" is not implemented yet`,
    };
  }

  // Extract the appropriate config based on destination type
  let config: unknown;
  switch (destination.type) {
    case 'slack':
      config = {
        webhookUrl: destination.config.slackWebhookUrl,
        channel: destination.config.slackChannel,
      };
      break;
    case 'discord':
      config = {
        webhookUrl: destination.config.discordWebhookUrl,
      };
      break;
    case 'teams':
      config = {
        webhookUrl: destination.config.teamsWebhookUrl,
      };
      break;
    case 'webhook':
      config = {
        url: destination.config.url,
        headers: destination.config.headers,
        authentication: destination.config.authentication,
      };
      break;
    default:
      return {
        success: false,
        error: `Unknown destination type: ${destination.type}`,
      };
  }

  return handler.send(data, config);
}
