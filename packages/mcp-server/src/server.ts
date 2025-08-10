import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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

export function createUnhookMCPServer(baseUrl?: string): McpServer {
  const server = new McpServer({
    name: 'unhook-mcp-server',
    version: '1.0.0',
  });

  // Register Resources
  registerRecentEventsResource(server, baseUrl);
  registerRecentRequestsResource(server, baseUrl);
  registerWebhooksListResource(server, baseUrl);

  // Register Tools
  registerSearchEventsTool(server, baseUrl);
  registerSearchRequestsTool(server, baseUrl);
  registerAnalyzeEventTool(server, baseUrl);
  registerAnalyzeRequestTool(server, baseUrl);
  registerWebhookStatsTool(server, baseUrl);
  registerCreateTestEventTool(server, baseUrl);

  // Register Prompts
  registerDebugWebhookPrompt(server);
  registerAnalyzeFailuresPrompt(server);
  registerPerformanceReportPrompt(server);

  return server;
}
