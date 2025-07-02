import type {
  EventType,
  ForwardingRuleType,
  RequestPayload,
} from '@unhook/db/schema';

export interface ForwardingContext {
  event: EventType;
  request: RequestPayload;
  rule: ForwardingRuleType;
}

export interface TransformResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface FilterResult {
  shouldForward: boolean;
  reason?: string;
}

export interface DestinationResult {
  success: boolean;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: unknown;
  };
  error?: string;
}

export interface WebhookDestinationConfig {
  url: string;
  headers?: Record<string, string>;
  authentication?: {
    type: 'bearer' | 'basic' | 'apiKey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
}

export interface SlackDestinationConfig {
  webhookUrl: string;
  channel?: string;
}

export interface DiscordDestinationConfig {
  webhookUrl: string;
}

export interface TeamsDestinationConfig {
  webhookUrl: string;
}

export interface EmailDestinationConfig {
  to: string;
  from?: string;
  subject?: string;
}

export type DestinationConfig =
  | { type: 'webhook'; config: WebhookDestinationConfig }
  | { type: 'slack'; config: SlackDestinationConfig }
  | { type: 'discord'; config: DiscordDestinationConfig }
  | { type: 'teams'; config: TeamsDestinationConfig }
  | { type: 'email'; config: EmailDestinationConfig };

export interface Destination {
  send(data: unknown, config: unknown): Promise<DestinationResult>;
}
