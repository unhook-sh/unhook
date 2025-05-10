/**
 * Request structure for webhook messages between client and server
 */
export interface WebhookRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string; // base64 encoded
  timestamp: number;
  size: number;
  contentType: string;
  clientIp: string;
}

/**
 * Options for configuring the webhook client
 */
export interface WebhookClientOptions {
  /**
   * The port of the local service to forward traffic to.
   * Example: 3000
   */
  port: number;
  /**
   * API key for authentication with the webhook server.
   */
  webhookId: string;
  /**
   * Metadata about the webhook client connection.
   */
  metadata?: {
    clientId: string;
    clientVersion: string;
    clientOs: string;
    clientHostname: string;
    clientIp?: string;
  };
}

/**
 * Structure of a webhook record from the database
 */
export interface WebhookRecord {
  id: string;
  webhookId: string;
  userId: string;
  orgId: string;
  status: string;
  request: WebhookRequest;
  response?: {
    status: number;
    headers: Record<string, string>;
    body?: string;
  };
  createdAt: Date;
  completedAt?: Date;
}
