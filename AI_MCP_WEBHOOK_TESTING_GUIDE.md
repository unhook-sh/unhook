# Testing AI Calls with MCP Servers using Unhook

## Overview

This guide explains how to use Unhook to test and debug webhooks triggered by AI agents using Model Context Protocol (MCP) servers. This is particularly useful for validating agentic systems and AI-driven automations.

## What is MCP?

Model Context Protocol (MCP) is an open standard developed by Anthropic that connects AI models (like Claude, GPT, etc.) to external data sources and tools. Think of MCP as the "USB-C of AI integrations" - a universal protocol that allows AI agents to:

- Access databases and file systems
- Call external APIs and services
- Trigger webhooks and notifications
- Perform actions in external systems

## Why Test AI-Triggered Webhooks?

When AI agents use MCP tools to perform actions, they often trigger webhooks to notify other systems or services. Testing these webhooks is crucial for:

### 1. **Validation of AI Actions**
- Ensure AI agents are correctly executing intended actions
- Verify that MCP tool calls produce expected webhook payloads
- Validate data transformation between AI intent and webhook output

### 2. **Debugging Agentic Workflows**
- Trace complete AI decision-making processes
- Identify where AI workflows fail or produce unexpected results
- Monitor multi-step AI processes and their side effects

### 3. **Integration Testing**
- Test how external services respond to AI-triggered webhooks
- Validate that downstream systems properly handle AI-generated data
- Ensure reliability of AI-driven business processes

## Common Use Cases

### Customer Service Automation
```
User Query → AI Agent → MCP Tool (CRM Update) → Webhook → Notification System
```
- **Test**: Does the AI correctly categorize support tickets?
- **Validate**: Are webhook payloads properly formatted for the CRM?
- **Debug**: Why are some tickets not triggering notifications?

### E-commerce Order Processing
```
AI Agent → MCP Tool (Inventory Check) → Webhook → Payment Processing
```
- **Test**: Does the AI correctly validate inventory before processing orders?
- **Validate**: Are payment webhooks triggered with correct amounts?
- **Debug**: Why are some orders failing to process?

### Content Generation Workflows
```
AI Agent → MCP Tool (Content Creation) → Webhook → Publishing System
```
- **Test**: Does the AI generate content that meets publishing standards?
- **Validate**: Are webhook metadata and content properly structured?
- **Debug**: Why are some articles not being published?

### Security Monitoring
```
AI Agent → MCP Tool (Threat Detection) → Webhook → Security System
```
- **Test**: Does the AI correctly identify security threats?
- **Validate**: Are alert webhooks sent with proper severity levels?
- **Debug**: Why are some threats not triggering alerts?

## Setting Up AI + MCP + Webhook Testing

### 1. Install Unhook VS Code Extension

```bash
# Install from VS Code Marketplace
code --install-extension unhook.unhook-vscode

# Or use the direct link
vscode:extension/unhook.unhook-vscode
```

### 2. Create Webhook Endpoints

```bash
# Using Unhook CLI
unhook create --name "ai-agent-testing"
# Returns: https://unhook.sh/wh_abc123
```

### 3. Configure Your MCP Server

Example MCP server tool that triggers webhooks:

```javascript
// mcp-webhook-tool.js
import { Tool } from '@modelcontextprotocol/server';

const webhookTool = new Tool({
  name: 'trigger-webhook',
  description: 'Triggers a webhook with specified data',
  parameters: {
    type: 'object',
    properties: {
      endpoint: { type: 'string', description: 'Webhook endpoint URL' },
      event: { type: 'string', description: 'Event type' },
      data: { type: 'object', description: 'Event data payload' }
    },
    required: ['endpoint', 'event', 'data']
  },
  handler: async ({ endpoint, event, data }) => {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'mcp-agent'
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    return {
      success: response.ok,
      status: response.status,
      webhookId: response.headers.get('x-webhook-id')
    };
  }
});
```

### 4. Configure AI Agent

Example AI agent prompt that uses MCP tools:

```
You are an AI assistant that helps manage user accounts. You have access to a webhook tool that can notify external systems of account changes.

When a user requests account creation:
1. Validate the user data
2. Use the trigger-webhook tool to notify the CRM system
3. Confirm the action was completed

Available tools:
- trigger-webhook: Send webhook notifications to external systems

Webhook endpoint: https://unhook.sh/wh_abc123
```

## Testing Workflow

### 1. Start Unhook Extension

Open VS Code and start monitoring your webhook endpoint:

1. Open the Unhook sidebar
2. Connect to your webhook endpoint
3. Enable real-time monitoring

### 2. Trigger AI Action

Prompt your AI agent to perform an action:

```
User: "Please create an account for john.doe@example.com with the name John Doe"

AI Agent: I'll create the account and notify the CRM system.
[Calls MCP tool: trigger-webhook]
```

### 3. Inspect Webhook in VS Code

The Unhook extension will capture the webhook and display:

```json
{
  "event": "user_created",
  "data": {
    "userId": "user_12345",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "createdAt": "2025-01-09T10:30:00Z"
  },
  "timestamp": "2025-01-09T10:30:00Z",
  "source": "mcp-agent"
}
```

### 4. Validate and Debug

In the VS Code extension:
- **Inspect payload**: Verify data structure and content
- **Check headers**: Validate authentication and metadata
- **Replay webhook**: Test how downstream services handle the data
- **Compare expected vs actual**: Identify discrepancies

## Advanced Testing Scenarios

### Testing AI Decision-Making

```javascript
// Test different user inputs to validate AI reasoning
const testCases = [
  {
    input: "Create account for invalid-email",
    expectedWebhook: null, // Should not trigger webhook
    reason: "AI should validate email format"
  },
  {
    input: "Create account for john@example.com",
    expectedWebhook: { event: "user_created", email: "john@example.com" },
    reason: "Valid input should trigger webhook"
  }
];
```

### Testing Error Handling

```javascript
// Simulate webhook endpoint failures
const mockResponses = [
  { status: 500, description: "Server error" },
  { status: 404, description: "Endpoint not found" },
  { status: 200, description: "Success" }
];

// Test how AI handles each scenario
```

### Testing Complex Workflows

```javascript
// Multi-step AI workflow
const workflow = [
  "User requests password reset",
  "AI validates user existence",
  "AI generates reset token",
  "AI triggers email webhook",
  "AI triggers audit log webhook"
];

// Validate each step triggers appropriate webhooks
```

## Best Practices

### 1. **Structured Testing**
- Create test plans for different AI scenarios
- Document expected webhook formats
- Use consistent test data

### 2. **Environment Isolation**
- Use separate webhook endpoints for testing
- Mock external services to control responses
- Maintain test data consistency

### 3. **Automated Validation**
- Write scripts to validate webhook payloads
- Set up automated replay testing
- Monitor webhook response times

### 4. **Error Scenario Testing**
- Test AI behavior with invalid inputs
- Simulate webhook endpoint failures
- Validate error handling and fallbacks

### 5. **Performance Testing**
- Test AI response times with webhook calls
- Monitor webhook payload sizes
- Validate system behavior under load

## Debugging Common Issues

### AI Not Triggering Webhooks
1. **Check MCP tool configuration**: Ensure the tool is properly registered
2. **Validate AI prompts**: Verify the AI understands when to use tools
3. **Review tool permissions**: Confirm the AI has access to the webhook tool

### Incorrect Webhook Payloads
1. **Inspect MCP tool logic**: Check data transformation in tool implementation
2. **Validate AI input parsing**: Ensure AI correctly extracts data from prompts
3. **Review payload structure**: Compare against expected format

### Webhook Delivery Failures
1. **Check endpoint availability**: Verify webhook URL is accessible
2. **Validate authentication**: Ensure proper headers and credentials
3. **Monitor network issues**: Check for timeouts or connectivity problems

## Integration with CI/CD

### Automated Testing Pipeline

```yaml
# .github/workflows/ai-webhook-tests.yml
name: AI Webhook Testing
on: [push, pull_request]

jobs:
  test-ai-webhooks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Unhook CLI
        run: npm install -g @unhook/cli
        
      - name: Create test webhook
        run: echo "WEBHOOK_URL=$(unhook create --name ci-test)" >> $GITHUB_ENV
        
      - name: Run AI agent tests
        run: |
          npm test -- --webhook-url=$WEBHOOK_URL
          
      - name: Validate webhooks
        run: unhook validate --endpoint=$WEBHOOK_URL --expect=user_created
```

## Conclusion

Testing AI calls with MCP servers using Unhook provides unprecedented visibility into agentic systems. By monitoring webhook events triggered by AI actions, developers can:

- Validate that AI agents perform intended actions
- Debug complex AI workflows and decision-making processes
- Ensure reliable integration between AI systems and external services
- Build confidence in AI-driven business processes

This testing approach is essential for building robust, reliable AI applications that interact with real-world systems through webhooks and API integrations.

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Unhook VS Code Extension](https://marketplace.visualstudio.com/items?itemName=unhook.unhook-vscode)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)
- [AI Agent Testing Best Practices](https://docs.unhook.sh/ai-testing)