# Webhook Forwarding

This package provides webhook forwarding functionality for Unhook, allowing you to filter, transform, and forward webhooks to external services like Slack, Discord, Microsoft Teams, or custom webhook endpoints.

## Features

- **Multiple Destinations**: Support for Slack, Discord, Teams, and custom webhooks
- **Flexible Filtering**: Filter webhooks by event name, HTTP method, path patterns, headers, or custom JavaScript
- **JavaScript Transformations**: Transform webhook payloads using sandboxed JavaScript
- **Priority-based Execution**: Control rule execution order with priorities
- **Execution Tracking**: Monitor success rates and error counts

## Architecture

### Database Schema

The forwarding system uses three main tables:

1. **ForwardingDestinations**: Stores destination configurations
2. **ForwardingRules**: Stores filtering and transformation rules
3. **ForwardingExecutions**: Logs execution history

### Core Components

1. **Forwarder** (`forwarder.ts`): Main orchestrator that processes events through rules
2. **Filters** (`filters/`): Evaluates whether a webhook should be forwarded
3. **Transformers** (`transformers/`): Applies JavaScript transformations to payloads
4. **Destinations** (`destinations/`): Sends transformed webhooks to external services

## Usage

### Creating a Destination

```typescript
import { CreateForwardingDestinationSchema } from '@unhook/db/schema';

const destination = {
  name: 'Payments Slack Channel',
  type: 'slack',
  config: {
    slackWebhookUrl: 'https://hooks.slack.com/services/...',
    slackChannel: '#payments'
  },
  isActive: true
};
```

### Creating a Forwarding Rule

```typescript
import { CreateForwardingRuleSchema } from '@unhook/db/schema';

const rule = {
  name: 'Send payment events to Slack',
  description: 'Forward successful payments to the payments channel',
  webhookId: 'wh_123',
  destinationId: 'dest_456',
  filters: {
    eventNames: ['payment.succeeded', 'payment.failed'],
    methods: ['POST']
  },
  transformation: `
    function transform({ body }) {
      return {
        text: \`Payment \${body.status}: $\${body.amount / 100}\`,
        blocks: [{
          type: "section",
          text: {
            type: "mrkdwn",
            text: \`*Payment \${body.status}*\\nAmount: $\${body.amount / 100}\\nCustomer: \${body.customer.email}\`
          }
        }]
      };
    }
  `,
  priority: 0,
  isActive: true
};
```

### JavaScript Transformations

Transformation functions receive a context object with:

- `event`: The webhook event metadata
- `request`: The original HTTP request details
- `body`: The parsed request body
- `headers`: The request headers

Helper functions available:
- `extractField(obj, path)`: Extract nested fields using dot notation
- `formatDate(date, format)`: Format dates ('iso' or 'unix')

Example transformation:

```javascript
function transform({ event, request, body, headers }) {
  // Extract relevant data
  const eventType = body.type || body.event;
  const amount = body.amount / 100;
  
  // Return transformed payload for Slack
  return {
    text: `New ${eventType} event`,
    attachments: [{
      color: body.status === 'succeeded' ? 'good' : 'danger',
      fields: [
        { title: 'Amount', value: `$${amount}`, short: true },
        { title: 'Customer', value: body.customer.email, short: true }
      ],
      timestamp: Math.floor(Date.now() / 1000)
    }]
  };
}
```

### Custom Filters

Write JavaScript expressions that return `true` to forward or `false` to skip:

```javascript
// Only forward high-value payments
body.amount > 10000 && body.currency === 'USD'

// Forward based on customer type
body.customer.type === 'premium' || body.customer.subscription === 'enterprise'

// Complex filtering with multiple conditions
(body.event === 'payment.succeeded' && body.amount > 5000) ||
(body.event === 'subscription.created' && body.plan.interval === 'yearly')
```

## Security

- JavaScript transformations run in isolated sandboxes using `isolated-vm`
- Execution time is limited to 5 seconds
- Memory usage is limited to 128MB
- No access to filesystem, network, or Node.js APIs

## Destination Types

### Slack
Sends formatted messages to Slack channels. Supports custom message formatting with blocks and attachments.

### Discord
Sends embedded messages to Discord channels. Automatically formats webhooks as rich embeds.

### Microsoft Teams
Sends adaptive cards to Teams channels. Formats webhooks as MessageCard with sections and facts.

### Custom Webhook
Sends JSON payloads to any HTTP endpoint. Supports:
- Custom headers
- Bearer token authentication
- API key authentication

## Error Handling

- Failed rules don't stop other rules from executing
- Errors are logged and tracked in the database
- Retry logic can be implemented at the event level
- Each rule execution is logged with timing and error information