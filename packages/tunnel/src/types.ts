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
 * Options for configuring the tunnel client
 */
export interface TunnelClientOptions {
  /**
   * The port of the local service to forward traffic to.
   * Example: 3000
   */
  port: number;
  /**
   * API key for authentication with the tunnel server.
   */
  apiKey: string;
  /**
   * Metadata about the tunnel client connection.
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
  tunnelId: string;
  apiKey: string;
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
