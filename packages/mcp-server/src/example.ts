#!/usr/bin/env node
/**
 * Example of running the Unhook MCP server locally using stdio transport
 * This can be used with Claude Desktop or other MCP clients
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTRPCContext } from '@unhook/api';
import { debug } from '@unhook/logger';
import { createUnhookMCPServer } from './server.js';

const log = debug('unhook:mcp-server:example');

async function main() {
  log('Starting Unhook MCP server on stdio...');

  // Create a mock context - in production this would come from the API route
  // You'll need to set proper environment variables for database access
  const context = await createTRPCContext({} as any);

  // Check if we have proper authentication
  if (!context.auth?.userId) {
    console.error(
      'Error: No authentication found. Make sure to set proper environment variables.',
    );
    process.exit(1);
  }

  // Create the MCP server
  const server = createUnhookMCPServer(context);

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect the server to the transport
  await server.connect(transport);

  log('MCP server is running on stdio transport');
  log(
    'You can now connect to this server from Claude Desktop or other MCP clients',
  );
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
