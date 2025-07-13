# Unhook MCP Server Integration Guide

This guide explains how to use the Unhook Model Context Protocol (MCP) server with AI assistants like Claude Desktop and Cursor to debug webhooks and analyze request data.

## What is MCP?

The Model Context Protocol (MCP) is an open standard created by Anthropic that enables AI assistants to securely access external data sources and tools. Think of it as a universal adapter that allows AI models to connect to various services in a standardized way.

## Why Use Unhook's MCP Server?

The Unhook MCP server provides AI assistants with direct access to your webhook data, enabling:

- **Real-time debugging** - Analyze webhook failures as they happen
- **Pattern recognition** - Identify common issues across multiple webhooks
- **Performance analysis** - Generate comprehensive reports on webhook performance
- **Intelligent troubleshooting** - Get AI-powered suggestions for fixing issues

## Available Features

### 1. Resources (Data Access)

The MCP server exposes three main resources:

- **Recent Events** - Access the last 100 webhook events
- **Recent Requests** - View the last 100 webhook requests with full details
- **Webhook List** - See all configured webhooks and their settings

### 2. Tools (Actions)

The server provides powerful tools for analysis:

- **search_events** - Filter events by webhook ID, status, or other criteria
- **search_requests** - Find specific requests based on various parameters
- **analyze_event** - Deep dive into a specific event with all details
- **analyze_request** - Examine request/response data in detail
- **get_webhook_stats** - Generate statistics and performance metrics

### 3. Prompts (Guided Workflows)

Pre-built prompts for common scenarios:

- **debug_webhook_issue** - Step-by-step debugging assistance
- **analyze_failures** - Pattern analysis and fix recommendations
- **performance_report** - Comprehensive performance analysis

## Setup Instructions

### For Claude Desktop

1. Locate your Claude Desktop configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add the Unhook MCP server configuration:

```json
{
  "mcpServers": {
    "unhook": {
      "url": "https://app.unhook.sh/api/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer YOUR_CLERK_TOKEN"
      }
    }
  }
}
```

3. Get your authentication token:
   - Log into Unhook web app
   - Open browser developer tools
   - Look for the `__clerk_db_jwt` cookie or authorization header
   - Copy the token value

4. Restart Claude Desktop

### For Cursor

1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Navigate to "Features" → "MCP Servers"
3. Click "Add New MCP Server"
4. Configure as follows:
   - **Name**: Unhook
   - **Type**: URL
   - **URL**: `https://app.unhook.sh/api/mcp`
   - **Headers**: Add `Authorization: Bearer YOUR_TOKEN`

5. Enable the server and refresh

## Usage Examples

Once connected, you can interact with your webhook data naturally:

### Basic Queries

```
"Show me the recent webhook events"
"List all failed requests from the last hour"
"What webhooks do I have configured?"
```

### Debugging

```
"Help me debug webhook wh_abc123"
"Why are my Stripe webhooks failing?"
"Analyze the failed events and suggest fixes"
```

### Analysis

```
"Generate a performance report for my webhooks"
"What's the average response time for webhook wh_xyz?"
"Show me error patterns across all webhooks"
```

### Advanced Usage

```
"Find all requests with 500 errors in the last 24 hours"
"Compare the performance of my Stripe vs GitHub webhooks"
"Show me the request/response details for event evt_123"
```

## Best Practices

1. **Be Specific** - Include webhook IDs or time ranges for better results
2. **Use Tools** - Let the AI use the available tools for detailed analysis
3. **Iterate** - Start with broad queries, then drill down into specifics
4. **Check Stats** - Regularly review webhook statistics to catch issues early

## Troubleshooting

### Connection Issues

- Ensure you're logged into the Unhook web app
- Verify your authentication token is valid
- Check that the MCP server URL is accessible

### No Data Returned

- Confirm you have webhooks configured
- Check that events/requests exist in your account
- Verify organization access permissions

### Authentication Errors

- Token may have expired - get a fresh one
- Ensure the token has the correct format
- Check organization membership

## Security Considerations

- The MCP server respects Unhook's existing authentication and authorization
- Only data from your organization is accessible
- All communication is encrypted via HTTPS
- Tokens should be kept secure and rotated regularly

## Limitations

- Maximum 100 events/requests returned per query
- Real-time updates require manual refresh
- Some complex queries may require multiple steps
- Rate limiting applies to prevent abuse

## Future Enhancements

We're continuously improving the MCP server. Planned features include:

- Real-time event streaming
- Custom alert configurations
- Webhook replay functionality
- Advanced filtering options
- Export capabilities

## Support

If you encounter issues or have questions:

1. Check the Unhook documentation at https://docs.unhook.sh
2. Review the MCP specification at https://modelcontextprotocol.io
3. Contact support at support@unhook.sh

## Contributing

The MCP server is part of the Unhook open-source project. Contributions are welcome! Visit our GitHub repository to learn more about contributing.