#!/usr/bin/env bun
/**
 * Development server for MCP Inspector testing
 * This server runs on stdio transport and can be used with the MCP Inspector
 *
 * Usage:
 * 1. Run this server: bun run dev:server
 * 2. In another terminal, run the MCP Inspector: mcp-inspector --stdio
 * 3. The inspector will connect to this server for testing
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTRPCContext } from '@unhook/api';
import { debug } from '@unhook/logger';
import { createUnhookMCPServer } from './server.js';

const log = debug('unhook:mcp-server:dev');

async function main() {
  log('Starting Unhook MCP development server...');

  try {
    // Create a mock context for development
    // In a real scenario, you'd need proper environment variables set
    const context = await createTRPCContext();

    // Check if we have proper authentication
    if (!context.auth?.userId) {
      console.error(
        'Warning: No authentication found. Some features may not work properly.',
      );
      console.error(
        'To test with authentication, set up proper environment variables.',
      );
    }

    // Create the MCP server
    const server = createUnhookMCPServer(context);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect the server to the transport
    await server.connect(transport);

    log('MCP development server is running on stdio transport');
    log('You can now connect to this server using the MCP Inspector:');
    log('  mcp-inspector --stdio');
    log('');
    log('Or use it with Claude Desktop or other MCP clients');
    log('');
    log('Press Ctrl+C to stop the server');

    // Keep the process alive
    process.on('SIGINT', () => {
      log('Shutting down MCP development server...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      log('Shutting down MCP development server...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start MCP development server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
