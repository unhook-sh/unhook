// Removed API client dependency for standalone operation
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

// Get base URL for HTTP requests
export const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'https://unhook.sh';
};

// Define the handler with proper parameter validation
export const createWebAppHandler = () => {
  return createMcpHandler(
    async (server) => {
      // Get base URL - auth will be handled per-request via headers
      const baseUrl = getBaseUrl();

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
    },
    // Server capabilities
    {
      capabilities: {
        auth: {
          required: true,
          type: 'bearer',
        },
      },
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
