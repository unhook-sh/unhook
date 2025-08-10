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
import { debug, defaultLogger } from '@unhook/logger';
import { createHttpClient } from './http-client.js';
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
    // Create the MCP server with base URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://unhook.sh';

    if (process.env.UNHOOK_API_KEY) {
      try {
        // Test the API key by making a simple request
        const httpClient = createHttpClient({
          authToken: process.env.UNHOOK_API_KEY,
          baseUrl,
        });

        // Try to make a simple authenticated request to test the key
        await httpClient.getEvents({ limit: 1 });
        log('API key verified successfully');
      } catch (error) {
        log('Failed to verify API key, proceeding without auth:', error);
      }
    } else {
      log('No API key provided, proceeding without auth');
    }

    // Create the MCP server with base URL
    const server = createUnhookMCPServer(baseUrl);

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
