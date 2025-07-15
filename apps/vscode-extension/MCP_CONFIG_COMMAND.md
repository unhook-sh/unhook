# Create Cursor MCP Configuration Command

The `unhook.createMcpConfig` command allows you to easily create a Model Context Protocol (MCP) configuration file for Cursor, enabling AI-assisted webhook debugging and analysis.

## What is MCP?

Model Context Protocol (MCP) is a standard that allows AI assistants like Cursor to access external data and tools. The Unhook MCP server provides access to your webhook events, requests, and analysis tools.

## Prerequisites

- You must be signed in to Unhook in the VS Code extension
- You need an active workspace folder open

## Usage

### Method 1: Command Palette
1. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Unhook: Create Cursor MCP Configuration"
3. Select the command

### Method 2: Quick Actions
1. Click on the Unhook status bar item
2. Select "Create MCP Config" from the quick actions menu

### Method 3: Direct Command
```bash
# In VS Code command palette
unhook.createMcpConfig
```

## What the Command Does

1. **Checks Authentication**: Verifies you're signed in to Unhook
2. **Selects Workspace**: Chooses the target workspace folder (if multiple are open)
3. **Gets Configuration**: Retrieves your current Unhook API URL and authentication token
4. **Creates File**: Generates a `.cursor-mcp.json` file in your workspace root
5. **Provides Instructions**: Offers to show setup instructions for using the MCP server

## Generated Configuration

The command creates a `.cursor-mcp.json` file with the following structure:

```json
{
  "mcpServers": {
    "unhook": {
      "url": "https://unhook.sh/api/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer YOUR_AUTH_TOKEN"
      }
    }
  }
}
```

For self-hosted instances, the URL will point to your self-hosted API endpoint.

## Setup Instructions

After creating the configuration:

1. **Restart Cursor**: Close and reopen Cursor to load the new MCP configuration
2. **Verify Connection**: The MCP server should automatically connect to your Unhook instance
3. **Test the Connection**: Try asking Cursor about your webhooks

## Available Features

### Resources
- `webhook://events/recent` - Recent webhook events
- `webhook://requests/recent` - Recent webhook requests
- `webhook://webhooks/list` - Configured webhooks

### Tools
- `search_events` - Search events by criteria
- `search_requests` - Search requests by criteria
- `analyze_event` - Analyze specific events
- `analyze_request` - Analyze specific requests
- `get_webhook_stats` - Get webhook statistics
- `create_test_event` - Create test events

### Prompts
- `debug_webhook_issue` - Debug webhook issues
- `analyze_failures` - Analyze failures
- `performance_report` - Generate performance reports

## Example Usage

Once connected, you can interact with the MCP server using natural language:

```
"Show me the recent webhook events"
"Analyze failed requests for webhook wh_123"
"Help me debug issues with my Stripe webhook"
"Generate a performance report for all webhooks"
```

## Security Notes

- Your authentication token is included in the configuration file
- Keep this file secure and don't commit it to version control if it contains sensitive tokens
- Consider adding `.cursor-mcp.json` to your `.gitignore` file

## Troubleshooting

### "Please sign in to Unhook first"
- Make sure you're signed in to Unhook in the VS Code extension
- Try signing out and signing back in

### "Please open a workspace folder"
- Open a folder in VS Code before running the command
- The command needs a workspace to create the configuration file

### Connection Issues
- Verify your Unhook instance is accessible
- Check that your authentication token is valid
- Restart Cursor after creating the configuration

## Related Commands

- `unhook.createConfig` - Create Unhook configuration file
- `unhook.signIn` - Sign in to Unhook
- `unhook.signOut` - Sign out of Unhook