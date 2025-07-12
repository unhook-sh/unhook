# Unhook MCP Server

This package provides a Model Context Protocol (MCP) server implementation for Unhook, allowing AI assistants like Claude Desktop and Cursor to access webhook events and request data for debugging purposes.

## Features

### Resources
The MCP server exposes the following resources:
- **Recent Webhook Events** (`webhook://events/recent`) - Last 100 webhook events
- **Recent Webhook Requests** (`webhook://requests/recent`) - Last 100 webhook requests
- **Configured Webhooks** (`webhook://webhooks/list`) - List of all configured webhooks

### Tools
The server provides several tools for webhook analysis:
- **search_events** - Search webhook events by various criteria (webhookId, status, limit)
- **search_requests** - Search webhook requests by various criteria (webhookId, eventId, status, limit)
- **analyze_event** - Analyze a specific webhook event in detail
- **analyze_request** - Analyze a specific webhook request in detail
- **get_webhook_stats** - Get comprehensive statistics for a webhook

### Prompts
Pre-configured prompts for common debugging scenarios:
- **debug_webhook_issue** - Step-by-step webhook debugging assistance
- **analyze_failures** - Analyze webhook failures and suggest fixes
- **performance_report** - Generate performance reports for webhooks

## API Endpoint

The MCP server is exposed via HTTP/SSE at:
```
https://app.unhook.sh/api/mcp
```

## Usage in Claude Desktop

To use this MCP server in Claude Desktop, add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "unhook": {
      "url": "https://app.unhook.sh/api/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer YOUR_AUTH_TOKEN"
      }
    }
  }
}
```

## Usage in Cursor

To use in Cursor:

1. Open Cursor Settings
2. Navigate to MCP Servers
3. Add a new server with:
   - Name: `Unhook`
   - Type: `URL`
   - URL: `https://app.unhook.sh/api/mcp`
   - Add your authentication token in the headers

## Example Usage

Once connected, you can interact with the MCP server using natural language:

```
"Show me the recent webhook events"
"Analyze failed requests for webhook wh_123"
"Help me debug issues with my Stripe webhook"
"Generate a performance report for all webhooks"
```

## Authentication

The MCP server requires authentication via Clerk. Make sure you're logged into the Unhook web app before attempting to connect.

## Architecture

The MCP server is built using:
- TypeScript
- tRPC for API calls
- Server-Sent Events (SSE) for real-time communication
- JSON-RPC 2.0 for message protocol

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type check
bun run typecheck
```