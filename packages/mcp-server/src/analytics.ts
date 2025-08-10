// import { posthog } from '@unhook/analytics/posthog/server';

export interface MCPAnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  organizationId?: string;
}

export function trackMCPEvent({
  event,
  properties = {},
  userId,
  organizationId,
}: MCPAnalyticsEvent) {
  // Analytics disabled for standalone MCP server
  // console.log('MCP Event:', event, { userId, organizationId, properties });
}

export function trackToolUsage(
  toolName: string,
  properties: Record<string, unknown> = {},
  userId?: string,
  organizationId?: string,
) {
  trackMCPEvent({
    event: 'mcp_tool_used',
    organizationId,
    properties: {
      tool_name: toolName,
      ...properties,
    },
    userId,
  });
}

export function trackResourceAccess(
  resourceName: string,
  properties: Record<string, unknown> = {},
  userId?: string,
  organizationId?: string,
) {
  trackMCPEvent({
    event: 'mcp_resource_accessed',
    organizationId,
    properties: {
      resource_name: resourceName,
      ...properties,
    },
    userId,
  });
}

export function trackPromptUsage(
  promptName: string,
  properties: Record<string, unknown> = {},
  userId?: string,
  organizationId?: string,
) {
  trackMCPEvent({
    event: 'mcp_prompt_used',
    organizationId,
    properties: {
      prompt_name: promptName,
      ...properties,
    },
    userId,
  });
}

export function trackError(
  error: Error,
  context: Record<string, unknown> = {},
  userId?: string,
  organizationId?: string,
) {
  trackMCPEvent({
    event: 'mcp_error',
    organizationId,
    properties: {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      ...context,
    },
    userId,
  });
}
