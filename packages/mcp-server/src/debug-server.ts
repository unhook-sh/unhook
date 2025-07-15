#!/usr/bin/env bun
/**
 * Debug server for MCP development with enhanced logging
 * This server provides detailed logging and debugging information
 *
 * Usage:
 * 1. Run this server: bun run debug:server
 * 2. Connect with MCP Inspector or other clients
 * 3. Monitor detailed logs for debugging
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTRPCContext } from '@unhook/api';
import { debug, defaultLogger } from '@unhook/logger';
import { createUnhookMCPServer } from './server.js';

// Enable all debug logging
defaultLogger.enableNamespace('*');

const log = debug('unhook:mcp-server:debug');

// Add request/response logging
const _requestLog = debug('unhook:mcp-server:request');
const _responseLog = debug('unhook:mcp-server:response');
const errorLog = debug('unhook:mcp-server:error');

async function main() {
  log('Starting Unhook MCP debug server...');

  try {
    // Create a mock context for development
    const context = await createTRPCContext();

    // Check if we have proper authentication
    if (!context.auth?.userId) {
      console.error(
        'Warning: No authentication found. Some features may not work properly.',
      );
      console.error(
        'To test with authentication, set up proper environment variables.',
      );
    } else {
      log('Authentication found:', {
        orgId: context.auth.orgId,
        userId: context.auth.userId,
      });
    }

    // Create the MCP server
    const server = createUnhookMCPServer(context);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect the server to the transport
    await server.connect(transport);

    log('MCP debug server is running on stdio transport');
    log('Server capabilities:');
    log(
      '- Tools: search_events, search_requests, analyze_event, analyze_request, get_webhook_stats, create_test_event',
    );
    log(
      '- Resources: webhook://events/recent, webhook://requests/recent, webhook://webhooks/list',
    );
    log('- Prompts: debug_webhook_issue, analyze_failures, performance_report');
    log('');
    log('You can now connect to this server using:');
    log('  - MCP Inspector: mcp-inspector --stdio');
    log('  - Claude Desktop: Add to MCP configuration');
    log('  - Custom client: Connect via stdio transport');
    log('');
    log('Press Ctrl+C to stop the server');

    // Keep the process alive
    process.on('SIGINT', () => {
      log('Shutting down MCP debug server...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      log('Shutting down MCP debug server...');
      process.exit(0);
    });

    // Log unhandled errors
    process.on('uncaughtException', (error) => {
      errorLog('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      errorLog('Unhandled rejection:', { promise, reason });
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start MCP debug server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Debug server error:', error);
  process.exit(1);
});
