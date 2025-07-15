# Testing the Unhook MCP Server

This document provides comprehensive guidance for testing the Unhook MCP server using various tools and methods.

## Overview

The Unhook MCP server provides webhook debugging and analysis capabilities through the Model Context Protocol. This testing guide covers:

- Unit testing with Bun
- Integration testing with MCP Inspector
- Debugging and development tools
- Manual testing procedures

## Prerequisites

1. **Install MCP Inspector** (optional but recommended):
   ```bash
   # Install the official MCP Inspector
   npm install -g @modelcontextprotocol/inspector
   # or
   bun add -g @modelcontextprotocol/inspector
   ```

2. **Environment Setup**:
   ```bash
   # Install dependencies
   bun install

   # Set up environment variables (if testing with authentication)
   cp .env.example .env
   # Edit .env with your test credentials
   ```

## Testing Methods

### 1. Unit Testing

Run the unit tests to verify basic functionality:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

**Test Files**:
- `src/test/mcp-server.test.ts` - Basic server functionality tests

### 2. Development Server Testing

#### Method 1: Using the Development Server

```bash
# Start the development server
bun run dev:server

# In another terminal, connect with MCP Inspector
mcp-inspector --stdio
```

#### Method 2: Using the Custom Inspector

```bash
# Start the custom inspector (starts server automatically)
bun run dev:inspector
```

This provides an interactive CLI interface for testing:
- `list-tools` - List available tools
- `list-resources` - List available resources
- `list-prompts` - List available prompts
- `call-tool <name> [args]` - Call a specific tool
- `get-resource <uri>` - Get a specific resource
- `call-prompt <name> [args]` - Call a specific prompt

### 3. Debug Server Testing

For enhanced debugging with detailed logging:

```bash
# Start the debug server
bun run debug:server

# Connect with MCP Inspector
mcp-inspector --stdio
```

The debug server provides:
- Detailed request/response logging
- Error tracking
- Performance monitoring
- Authentication status logging

### 4. Manual Testing with MCP Inspector

#### Installation

```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector
```

#### Usage

1. **Start the MCP server**:
   ```bash
   bun run dev:server
   ```

2. **Connect with Inspector**:
   ```bash
   mcp-inspector --stdio
   ```

3. **Test Commands**:
   ```bash
   # List available tools
   tools/list

   # List available resources
   resources/list

   # List available prompts
   prompts/list

   # Call a tool
   tools/call search_events '{"limit": 5}'

   # Get a resource
   resources/read webhook://events/recent

   # Call a prompt
   prompts/call debug_webhook_issue '{"webhookId": "wh_test"}'
   ```

## Available Tools for Testing

### Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_events` | Search webhook events | `webhookId?`, `status?`, `limit?` |
| `search_requests` | Search webhook requests | `webhookId?`, `eventId?`, `status?`, `limit?` |
| `analyze_event` | Analyze specific event | `eventId` |
| `analyze_request` | Analyze specific request | `requestId` |
| `get_webhook_stats` | Get webhook statistics | `webhookId` |
| `create_test_event` | Create test event | `webhookId`, `provider`, `eventType`, `customData?` |

### Resources

| Resource | URI | Description |
|----------|-----|-------------|
| Recent Events | `webhook://events/recent` | Last 100 webhook events |
| Recent Requests | `webhook://requests/recent` | Last 100 webhook requests |
| Webhooks List | `webhook://webhooks/list` | All configured webhooks |

### Prompts

| Prompt | Description | Parameters |
|--------|-------------|------------|
| `debug_webhook_issue` | Debug webhook issues | `webhookId`, `timeframe?` |
| `analyze_failures` | Analyze failures | `webhookId?` |
| `performance_report` | Generate performance report | `webhookId?` |

## Testing Scenarios

### 1. Basic Connectivity Test

```bash
# Start server
bun run dev:server

# In MCP Inspector
initialize
tools/list
resources/list
prompts/list
```

### 2. Tool Testing

```bash
# Test search_events tool
tools/call search_events '{"limit": 10}'

# Test analyze_event tool (requires valid event ID)
tools/call analyze_event '{"eventId": "evt_test"}'

# Test create_test_event tool
tools/call create_test_event '{"webhookId": "wh_test", "provider": "stripe", "eventType": "customer.created"}'
```

### 3. Resource Testing

```bash
# Test recent events resource
resources/read webhook://events/recent

# Test recent requests resource
resources/read webhook://requests/recent

# Test webhooks list resource
resources/read webhook://webhooks/list
```

### 4. Prompt Testing

```bash
# Test debug webhook prompt
prompts/call debug_webhook_issue '{"webhookId": "wh_test", "timeframe": "last 24 hours"}'

# Test analyze failures prompt
prompts/call analyze_failures '{"webhookId": "wh_test"}'

# Test performance report prompt
prompts/call performance_report '{"webhookId": "wh_test"}'
```

## VS Code Debugging

### Launch Configurations

The following VS Code launch configurations are available for debugging the MCP server:

1. **Debug MCP Server** - Launches the development server with debugging enabled
   - Sets breakpoints in server code
   - Full debug output with `DEBUG=*`
   - Integrated terminal output

2. **Debug MCP Inspector** - Launches the interactive inspector with debugging
   - Debug the inspector CLI interface
   - Step through request/response handling

3. **Debug MCP Debug Server** - Launches the debug server with enhanced logging
   - Extra verbose logging
   - Request/response tracking

4. **Test MCP Server** - Runs tests with debugging enabled
   - Debug test failures
   - Step through test execution

5. **MCP Server with Infisical** - Launches server with environment variables [[memory:494256]]
   - Uses `infisical run` for proper env setup
   - Full authentication support

### How to Debug

1. **Set Breakpoints**: Click in the gutter next to any line in the MCP server code
2. **Start Debugging**: Press F5 or select a configuration from the Run and Debug panel
3. **Use Debug Console**: Evaluate expressions and inspect variables
4. **Step Through Code**: Use F10 (step over), F11 (step into), Shift+F11 (step out)

### VS Code Tasks

Available tasks (Ctrl+Shift+P → "Tasks: Run Task"):

- **Build MCP Server** - Build the MCP server
- **Test MCP Server** - Run all tests
- **Start MCP Dev Server** - Start the development server
- **Start MCP Inspector** - Start the interactive inspector
- **Typecheck MCP Server** - Run TypeScript type checking

## Debugging

### Common Issues

1. **Authentication Errors**:
   - Ensure environment variables are set correctly
   - Check that the user has proper permissions
   - Verify the API endpoint is accessible

2. **Connection Issues**:
   - Ensure the server is running
   - Check that stdio transport is working
   - Verify MCP Inspector is compatible

3. **Tool/Resource Errors**:
   - Check input parameters match expected schema
   - Verify the underlying API calls work
   - Check for proper error handling

### Debug Commands

```bash
# Start with debug logging
DEBUG=* bun run dev:server

# Start debug server with enhanced logging
bun run debug:server

# Test with verbose output
bun run dev:inspector
```

## Integration Testing

### With Claude Desktop

1. Add to Claude Desktop configuration:
   ```json
   {
     "mcpServers": {
       "unhook": {
         "command": "bun",
         "args": ["run", "src/dev-server.ts"],
         "cwd": "/path/to/packages/mcp-server"
       }
     }
   }
   ```

2. Test natural language queries:
   - "Show me recent webhook events"
   - "Analyze failed requests for webhook wh_123"
   - "Help me debug issues with my Stripe webhook"

### With Cursor

1. Use the VS Code extension command to generate MCP configuration
2. Test the integration through Cursor's AI features

## Performance Testing

### Load Testing

```bash
# Test multiple concurrent requests
for i in {1..10}; do
  echo '{"jsonrpc":"2.0","id":'$i',"method":"tools/list"}' | bun run dev:server &
done
```

### Memory Testing

```bash
# Monitor memory usage
bun run debug:server &
# Use MCP Inspector to make multiple requests
# Monitor memory usage with: ps aux | grep bun
```

## Continuous Integration

### GitHub Actions

The MCP server tests can be integrated into CI/CD pipelines:

```yaml
- name: Test MCP Server
  run: |
    cd packages/mcp-server
    bun install
    bun test
    bun run typecheck
```

## Troubleshooting

### Common Problems

1. **"Server not found" errors**:
   - Check that the server script exists and is executable
   - Verify the working directory is correct
   - Ensure all dependencies are installed

2. **"Authentication failed" errors**:
   - Check environment variables
   - Verify API credentials
   - Test API connectivity separately

3. **"Tool not found" errors**:
   - Check tool registration in server.ts
   - Verify tool names match exactly
   - Check for typos in tool calls

### Getting Help

1. Check the debug logs: `DEBUG=* bun run dev:server`
2. Use the debug server: `bun run debug:server`
3. Test with MCP Inspector for detailed error messages
4. Check the MCP specification for protocol details

## Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP Inspector Documentation](https://modelcontextprotocol.io/docs/tools/inspector)
- [MCP Debugging Guide](https://modelcontextprotocol.io/docs/tools/debugging)
- [Unhook API Documentation](https://docs.unhook.sh/api-reference)