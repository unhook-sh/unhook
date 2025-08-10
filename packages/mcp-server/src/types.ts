// Local type definitions for MCP server to avoid database dependencies

export interface EventType {
  id: string;
  webhookId: string;
  requestId?: string;
  eventType: string;
  data: Record<string, unknown>;
  headers: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestType {
  id: string;
  webhookId: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestTypeWithEventType extends RequestType {
  events: EventType[];
}

export interface WebhookType {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  userId: string;
  orgId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookStatsType {
  totalEvents: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastEventAt?: Date;
  lastRequestAt?: Date;
}
