import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Context } from '@unhook/api';
import {
  registerAnalyzeFailuresPrompt,
  registerDebugWebhookPrompt,
  registerPerformanceReportPrompt,
} from './prompts';
import {
  registerRecentEventsResource,
  registerRecentRequestsResource,
  registerWebhooksListResource,
} from './resources';
// Import all registration functions
import {
  registerAnalyzeEventTool,
  registerAnalyzeRequestTool,
  registerCreateTestEventTool,
  registerSearchEventsTool,
  registerSearchRequestsTool,
  registerWebhookStatsTool,
} from './tools';

export function createUnhookMCPServer(context: Context): McpServer {
  const server = new McpServer({
    name: 'unhook-mcp-server',
    version: '1.0.0',
  });

  // Register Resources
  registerRecentEventsResource(server, context);
  registerRecentRequestsResource(server, context);
  registerWebhooksListResource(server, context);

  // Register Tools
  registerSearchEventsTool(server, context);
  registerSearchRequestsTool(server, context);
  registerAnalyzeEventTool(server, context);
  registerAnalyzeRequestTool(server, context);
  registerWebhookStatsTool(server, context);
  registerCreateTestEventTool(server, context);

  // Register Prompts
  registerDebugWebhookPrompt(server);
  registerAnalyzeFailuresPrompt(server);
  registerPerformanceReportPrompt(server);

  return server;
}
