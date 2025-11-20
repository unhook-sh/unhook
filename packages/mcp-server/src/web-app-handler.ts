import { createTRPCContext } from '@unhook/api';
import {
  createMcpHandler,
  experimental_withMcpAuth as withMcpAuth,
} from 'mcp-handler';
import { verifyToken } from './auth';
import {
  registerAnalyzeFailuresPrompt,
  registerDebugWebhookPrompt,
  registerPerformanceReportPrompt,
} from './prompts';
import { registerRecentEventsResource } from './resources/recent-events';
import { registerRecentRequestsResource } from './resources/recent-requests';
import { registerWebhooksListResource } from './resources/webhooks-list';
import {
  registerAnalyzeEventTool,
  registerAnalyzeRequestTool,
  registerCreateTestEventTool,
  registerSearchEventsTool,
  registerSearchRequestsTool,
  registerWebhookStatsTool,
} from './tools';

// Define the handler with proper parameter validation
export const createWebAppHandler = () => {
  return createMcpHandler(
    async (server) => {
      const context = await createTRPCContext();
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
    },
    // Server capabilities
    {
      capabilities: {},
    },
    // Route configuration
    {
      basePath: '/api/mcp',
      sseEndpoint: '/sse',
      sseMessageEndpoint: '/message',
      streamableHttpEndpoint: '/mcp',
    },
  );
};

// Create the auth handler with required scopes
export const createAuthHandler = () => {
  const handler = createWebAppHandler();
  return withMcpAuth(handler, verifyToken, {
    required: true,
    // requiredScopes: ['read:webhooks', 'read:events'],
    // resourceMetadataPath: '/.well-known/oauth-protected-resource',
  });
};
