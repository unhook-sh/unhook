import type { Context } from '@unhook/api';
import { createCaller } from '@unhook/api';
import type {
  EventType,
  EventTypeWithRequest,
  RequestType,
  WebhookType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
import type {
  CallToolRequest,
  GetPromptRequest,
  InitializeRequest,
  JsonRpcError,
  JsonRpcRequest,
  JsonRpcResponse,
  ListPromptsRequest,
  ListResourcesRequest,
  ListToolsRequest,
  MCPServerCapabilities,
  Prompt,
  ReadResourceRequest,
  Resource,
  Tool,
} from './types';

const log = debug('unhook:mcp-server');

export class UnhookMCPServer {
  private capabilities: MCPServerCapabilities = {
    resources: {
      subscribe: false,
      listChanged: true,
    },
    tools: {
      listChanged: false,
    },
    prompts: {
      listChanged: false,
    },
    logging: {},
  };

  private protocolVersion = '2024-11-05';
  private serverInfo = {
    name: 'unhook-mcp-server',
    version: '1.0.0',
  };

  constructor(private context: Context) {
    log('MCP Server initialized');
  }

  async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    log('Handling request:', request.method);

    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request as InitializeRequest);
        case 'resources/list':
          return this.handleListResources(request as ListResourcesRequest);
        case 'resources/read':
          return this.handleReadResource(request as ReadResourceRequest);
        case 'tools/list':
          return this.handleListTools(request as ListToolsRequest);
        case 'tools/call':
          return this.handleCallTool(request as CallToolRequest);
        case 'prompts/list':
          return this.handleListPrompts(request as ListPromptsRequest);
        case 'prompts/get':
          return this.handleGetPrompt(request as GetPromptRequest);
        default:
          return this.createErrorResponse(
            request.id,
            -32601,
            `Method not found: ${request.method}`,
          );
      }
    } catch (error) {
      log('Error handling request:', error);
      return this.createErrorResponse(
        request.id,
        -32603,
        'Internal error',
        error,
      );
    }
  }

  private async handleInitialize(
    request: InitializeRequest,
  ): Promise<JsonRpcResponse> {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: this.protocolVersion,
        capabilities: this.capabilities,
        serverInfo: this.serverInfo,
      },
    };
  }

  private async handleListResources(
    request: ListResourcesRequest,
  ): Promise<JsonRpcResponse> {
    const resources: Resource[] = [
      {
        uri: 'webhook://events/recent',
        name: 'Recent Webhook Events',
        description: 'List of recent webhook events (last 100)',
        mimeType: 'application/json',
      },
      {
        uri: 'webhook://requests/recent',
        name: 'Recent Webhook Requests',
        description: 'List of recent webhook requests (last 100)',
        mimeType: 'application/json',
      },
      {
        uri: 'webhook://webhooks/list',
        name: 'Configured Webhooks',
        description: 'List of all configured webhooks',
        mimeType: 'application/json',
      },
    ];

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { resources },
    };
  }

  private async handleReadResource(
    request: ReadResourceRequest,
  ): Promise<JsonRpcResponse> {
    const { uri } = request.params;
    const caller = createCaller(this.context);

    try {
      let content: string;

      switch (uri) {
        case 'webhook://events/recent': {
          const events = await caller.events.all();
          content = JSON.stringify(events.slice(0, 100), null, 2);
          break;
        }
        case 'webhook://requests/recent': {
          const requests = await caller.requests.all();
          content = JSON.stringify(requests.slice(0, 100), null, 2);
          break;
        }
        case 'webhook://webhooks/list': {
          const webhooks = await caller.webhooks.all();
          content = JSON.stringify(webhooks, null, 2);
          break;
        }
        default:
          return this.createErrorResponse(
            request.id,
            -32602,
            `Unknown resource URI: ${uri}`,
          );
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: content,
            },
          ],
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        -32603,
        'Failed to read resource',
        error,
      );
    }
  }

  private async handleListTools(
    request: ListToolsRequest,
  ): Promise<JsonRpcResponse> {
    const tools: Tool[] = [
      {
        name: 'search_events',
        description: 'Search webhook events by various criteria',
        inputSchema: {
          type: 'object',
          properties: {
            webhookId: {
              type: 'string',
              description: 'Filter by webhook ID',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'failed'],
              description: 'Filter by event status',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 50)',
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: 'search_requests',
        description: 'Search webhook requests by various criteria',
        inputSchema: {
          type: 'object',
          properties: {
            webhookId: {
              type: 'string',
              description: 'Filter by webhook ID',
            },
            eventId: {
              type: 'string',
              description: 'Filter by event ID',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              description: 'Filter by request status',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 50)',
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: 'analyze_event',
        description: 'Analyze a specific webhook event in detail',
        inputSchema: {
          type: 'object',
          properties: {
            eventId: {
              type: 'string',
              description: 'The event ID to analyze',
            },
          },
          required: ['eventId'],
          additionalProperties: false,
        },
      },
      {
        name: 'analyze_request',
        description: 'Analyze a specific webhook request in detail',
        inputSchema: {
          type: 'object',
          properties: {
            requestId: {
              type: 'string',
              description: 'The request ID to analyze',
            },
          },
          required: ['requestId'],
          additionalProperties: false,
        },
      },
      {
        name: 'get_webhook_stats',
        description: 'Get statistics for a webhook',
        inputSchema: {
          type: 'object',
          properties: {
            webhookId: {
              type: 'string',
              description: 'The webhook ID to get stats for',
            },
          },
          required: ['webhookId'],
          additionalProperties: false,
        },
      },
    ];

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools },
    };
  }

  private async handleCallTool(
    request: CallToolRequest,
  ): Promise<JsonRpcResponse> {
    const { name, arguments: args } = request.params;
    const caller = createCaller(this.context);

    try {
      let result: string;

      switch (name) {
        case 'search_events': {
          const events = await this.searchEvents(caller, args);
          result = this.formatEventsList(events);
          break;
        }
        case 'search_requests': {
          const requests = await this.searchRequests(caller, args);
          result = this.formatRequestsList(requests);
          break;
        }
        case 'analyze_event': {
          const eventId = args?.eventId as string;
          const event = await caller.events.byId({ id: eventId });
          if (!event) {
            result = `Event ${eventId} not found`;
          } else {
            result = this.formatEventAnalysis(event);
          }
          break;
        }
        case 'analyze_request': {
          const requestId = args?.requestId as string;
          const request = await caller.requests.byId({ id: requestId });
          if (!request) {
            result = `Request ${requestId} not found`;
          } else {
            result = this.formatRequestAnalysis(request);
          }
          break;
        }
        case 'get_webhook_stats': {
          const webhookId = args?.webhookId as string;
          const stats = await this.getWebhookStats(caller, webhookId);
          result = stats;
          break;
        }
        default:
          return this.createErrorResponse(
            request.id,
            -32602,
            `Unknown tool: ${name}`,
          );
      }

      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        },
      };
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        -32603,
        'Tool execution failed',
        error,
      );
    }
  }

  private async handleListPrompts(
    request: ListPromptsRequest,
  ): Promise<JsonRpcResponse> {
    const prompts: Prompt[] = [
      {
        name: 'debug_webhook_issue',
        description: 'Debug a webhook issue step by step',
        arguments: [
          {
            name: 'webhookId',
            description: 'The webhook ID to debug',
            required: true,
          },
          {
            name: 'timeframe',
            description: 'Time frame to analyze (e.g., "last hour", "today")',
            required: false,
          },
        ],
      },
      {
        name: 'analyze_failures',
        description: 'Analyze webhook failures and suggest fixes',
        arguments: [
          {
            name: 'webhookId',
            description: 'The webhook ID to analyze',
            required: false,
          },
        ],
      },
      {
        name: 'performance_report',
        description: 'Generate a performance report for webhooks',
        arguments: [
          {
            name: 'webhookId',
            description: 'Specific webhook ID (optional, all if not provided)',
            required: false,
          },
        ],
      },
    ];

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { prompts },
    };
  }

  private async handleGetPrompt(
    request: GetPromptRequest,
  ): Promise<JsonRpcResponse> {
    const { name, arguments: args } = request.params;

    let messages;
    switch (name) {
      case 'debug_webhook_issue':
        messages = this.getDebugWebhookPrompt(args);
        break;
      case 'analyze_failures':
        messages = this.getAnalyzeFailuresPrompt(args);
        break;
      case 'performance_report':
        messages = this.getPerformanceReportPrompt(args);
        break;
      default:
        return this.createErrorResponse(
          request.id,
          -32602,
          `Unknown prompt: ${name}`,
        );
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        description: `Executing prompt: ${name}`,
        messages,
      },
    };
  }

  // Helper methods
  private createErrorResponse(
    id: string | number,
    code: number,
    message: string,
    data?: unknown,
  ): JsonRpcResponse {
    const error: JsonRpcError = {
      code,
      message,
    };
    if (data) {
      error.data = data;
    }
    return {
      jsonrpc: '2.0',
      id,
      error,
    };
  }

  private async searchEvents(
    caller: ReturnType<typeof createCaller>,
    args?: Record<string, unknown>,
  ): Promise<EventType[]> {
    let events = await caller.events.all();

    if (args?.webhookId) {
      events = events.filter((e: EventType) => e.webhookId === args.webhookId);
    }
    if (args?.status) {
      events = events.filter((e: EventType) => e.status === args.status);
    }

    const limit = (args?.limit as number) || 50;
    return events.slice(0, limit);
  }

  private async searchRequests(
    caller: ReturnType<typeof createCaller>,
    args?: Record<string, unknown>,
  ): Promise<RequestType[]> {
    let requests = await caller.requests.all();

    if (args?.webhookId) {
      requests = requests.filter(
        (r: RequestType) => r.webhookId === args.webhookId,
      );
    }
    if (args?.eventId) {
      requests = requests.filter(
        (r: RequestType) => r.eventId === args.eventId,
      );
    }
    if (args?.status) {
      requests = requests.filter((r: RequestType) => r.status === args.status);
    }

    const limit = (args?.limit as number) || 50;
    return requests.slice(0, limit);
  }

  private formatEventsList(events: EventType[]): string {
    if (events.length === 0) {
      return 'No events found matching the criteria.';
    }

    const summary = events
      .map(
        (e) =>
          `Event ${e.id}:
  - Webhook: ${e.webhookId}
  - Status: ${e.status}
  - Timestamp: ${e.timestamp}
  - Retry Count: ${e.retryCount}/${e.maxRetries}
  ${e.failedReason ? `- Failed Reason: ${e.failedReason}` : ''}`,
      )
      .join('\n\n');

    return `Found ${events.length} events:\n\n${summary}`;
  }

  private formatRequestsList(requests: RequestType[]): string {
    if (requests.length === 0) {
      return 'No requests found matching the criteria.';
    }

    const summary = requests
      .map(
        (r) =>
          `Request ${r.id}:
  - Webhook: ${r.webhookId}
  - Event: ${r.eventId || 'N/A'}
  - Status: ${r.status}
  - Method: ${r.request.method}
  - URL: ${r.request.sourceUrl}
  - Response Time: ${r.responseTimeMs || 'N/A'}ms
  ${r.failedReason ? `- Failed Reason: ${r.failedReason}` : ''}`,
      )
      .join('\n\n');

    return `Found ${requests.length} requests:\n\n${summary}`;
  }

  private formatEventAnalysis(event: EventType): string {
    const analysis = `Event Analysis for ${event.id}:

Basic Information:
- Webhook ID: ${event.webhookId}
- Status: ${event.status}
- Created: ${event.createdAt}
- Last Updated: ${event.updatedAt || 'N/A'}

Request Details:
- Method: ${event.originRequest.method}
- URL: ${event.originRequest.sourceUrl}
- Content Type: ${event.originRequest.contentType}
- Size: ${event.originRequest.size} bytes
- Client IP: ${event.originRequest.clientIp}

Headers:
${JSON.stringify(event.originRequest.headers, null, 2)}

${
  event.originRequest.body
    ? `Body:\n${event.originRequest.body}`
    : 'Body: (empty)'
}

Retry Information:
- Current Attempts: ${event.retryCount}
- Max Retries: ${event.maxRetries}
${event.failedReason ? `- Failed Reason: ${event.failedReason}` : ''}

API Key: ${event.apiKey ? `***${event.apiKey.slice(-4)}` : 'Not provided'}`;

    return analysis;
  }

  private formatRequestAnalysis(request: RequestType): string {
    const analysis = `Request Analysis for ${request.id}:

Basic Information:
- Webhook ID: ${request.webhookId}
- Event ID: ${request.eventId || 'N/A'}
- Status: ${request.status}
- Created: ${request.createdAt}
- Completed: ${request.completedAt || 'N/A'}

Request Details:
- Method: ${request.request.method}
- URL: ${request.request.sourceUrl}
- Content Type: ${request.request.contentType}
- Size: ${request.request.size} bytes
- Client IP: ${request.request.clientIp}

Request Headers:
${JSON.stringify(request.request.headers, null, 2)}

${
  request.request.body
    ? `Request Body:\n${request.request.body}`
    : 'Request Body: (empty)'
}

Destination:
- URL: ${request.destination.url}
- Timeout: ${request.destination.timeout}ms

${
  request.response
    ? `Response:
- Status: ${request.response.status}
- Headers: ${JSON.stringify(request.response.headers, null, 2)}
- Body: ${request.response.body || '(empty)'}
- Time: ${request.responseTimeMs}ms`
    : 'Response: Not received'
}

${request.failedReason ? `Failed Reason: ${request.failedReason}` : ''}`;

    return analysis;
  }

  private async getWebhookStats(
    caller: ReturnType<typeof createCaller>,
    webhookId: string,
  ): Promise<string> {
    const webhook = await caller.webhooks.byId({ id: webhookId });
    if (!webhook) {
      return `Webhook ${webhookId} not found`;
    }

    const events = await caller.events.byWebhookId({ webhookId });
    const requests = await caller.requests.byWebhookId({ webhookId });

    const eventStats = {
      total: events.length,
      pending: events.filter(
        (e: EventTypeWithRequest) => e.status === 'pending',
      ).length,
      processing: events.filter(
        (e: EventTypeWithRequest) => e.status === 'processing',
      ).length,
      completed: events.filter(
        (e: EventTypeWithRequest) => e.status === 'completed',
      ).length,
      failed: events.filter((e: EventTypeWithRequest) => e.status === 'failed')
        .length,
    };

    const requestStats = {
      total: requests.length,
      pending: requests.filter((r: RequestType) => r.status === 'pending')
        .length,
      completed: requests.filter((r: RequestType) => r.status === 'completed')
        .length,
      failed: requests.filter((r: RequestType) => r.status === 'failed').length,
    };

    const avgResponseTime =
      requests
        .filter((r: RequestType) => r.responseTimeMs)
        .reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) /
        requests.filter((r: RequestType) => r.responseTimeMs).length || 0;

    return `Webhook Statistics for ${webhook.name} (${webhookId}):

Webhook Information:
- Status: ${webhook.status}
- Created: ${webhook.createdAt}
- Total Requests: ${webhook.requestCount}

Event Statistics:
- Total Events: ${eventStats.total}
- Pending: ${eventStats.pending}
- Processing: ${eventStats.processing}
- Completed: ${eventStats.completed}
- Failed: ${eventStats.failed}

Request Statistics:
- Total Requests: ${requestStats.total}
- Pending: ${requestStats.pending}
- Completed: ${requestStats.completed}
- Failed: ${requestStats.failed}
- Average Response Time: ${avgResponseTime.toFixed(2)}ms

Configuration:
- Store Headers: ${webhook.config.storage.storeHeaders}
- Store Request Body: ${webhook.config.storage.storeRequestBody}
- Store Response Body: ${webhook.config.storage.storeResponseBody}
- Max Request Body Size: ${webhook.config.storage.maxRequestBodySize} bytes
- Max Response Body Size: ${webhook.config.storage.maxResponseBodySize} bytes`;
  }

  private getDebugWebhookPrompt(args?: Record<string, string>): Array<{
    role: 'user' | 'assistant' | 'system';
    content: { type: 'text'; text: string };
  }> {
    const webhookId = args?.webhookId || 'unknown';
    const timeframe = args?.timeframe || 'last 24 hours';

    return [
      {
        role: 'system',
        content: {
          type: 'text',
          text: 'You are a webhook debugging assistant. Analyze the webhook data and help identify issues.',
        },
      },
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please help me debug webhook ${webhookId} for the ${timeframe}. 
          
Start by:
1. Getting the webhook statistics
2. Searching for recent events and their status
3. Looking for failed requests and analyzing their errors
4. Providing recommendations for fixing any issues found`,
        },
      },
    ];
  }

  private getAnalyzeFailuresPrompt(args?: Record<string, string>): Array<{
    role: 'user' | 'assistant' | 'system';
    content: { type: 'text'; text: string };
  }> {
    const webhookId = args?.webhookId;

    return [
      {
        role: 'system',
        content: {
          type: 'text',
          text: 'You are a webhook failure analysis expert. Identify patterns in failures and suggest solutions.',
        },
      },
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please analyze webhook failures${
            webhookId ? ` for webhook ${webhookId}` : ' across all webhooks'
          }. 

Focus on:
1. Finding all failed events and requests
2. Identifying common failure patterns
3. Analyzing error messages and response codes
4. Suggesting specific fixes for each type of failure
5. Recommending configuration changes to prevent future failures`,
        },
      },
    ];
  }

  private getPerformanceReportPrompt(args?: Record<string, string>): Array<{
    role: 'user' | 'assistant' | 'system';
    content: { type: 'text'; text: string };
  }> {
    const webhookId = args?.webhookId;

    return [
      {
        role: 'system',
        content: {
          type: 'text',
          text: 'You are a webhook performance analyst. Generate comprehensive performance reports.',
        },
      },
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Generate a performance report${
            webhookId ? ` for webhook ${webhookId}` : ' for all webhooks'
          }. 

Include:
1. Overall statistics (total requests, success rate, etc.)
2. Response time analysis (average, min, max, percentiles)
3. Error rate trends
4. Peak usage times
5. Performance recommendations
6. Comparison with best practices`,
        },
      },
    ];
  }
}
