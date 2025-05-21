<div align="center">

<img src="apps/web-app/public/logo.png" alt="Unhook Logo" width="100" height="100" />

# Unhook

[![npm version](https://img.shields.io/npm/v/@unhook/cli.svg)](https://www.npmjs.com/package/@unhook/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/unhook-sh/unhook/cli-release.yml?branch=main)](https://github.com/unhook-sh/unhook/actions/workflows/cli-release.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

<p align="center">
  <strong>The Modern Webhook Development Tool for Teams</strong>
</p>

<p align="center">
  Unhook is an open-source tool that makes testing webhooks during local development simple and secure. Perfect for teams - share a single webhook endpoint while everyone tests locally.
</p>

## Features

- 🚀 **Instant Setup**: Get started in seconds with a simple CLI command
- 👥 **Team-Friendly**: Share one webhook URL across your entire team
- 🔀 **Smart Distribution**: Automatically routes webhooks to the right developer
- 🔒 **Secure by Default**: End-to-end encryption for all webhook traffic
- 📊 **Beautiful Dashboard**: Real-time monitoring of webhook requests
- 🔄 **Request Replay**: Easily replay webhook requests for testing
- 🎯 **Smart Routing**: Route webhooks to different local ports
- 📝 **Request Logging**: Detailed logs of all webhook requests
- 🛠️ **Built for Developers**: Works with popular webhook providers:
  - Stripe
  - GitHub
  - Clerk
  - Discord
  - And many more!

## Quick Start

### 1. Install Unhook

```bash
# Using npm
npm install -g @unhook/cli

# Using yarn
yarn global add @unhook/cli

# Using bun
bun add -g @unhook/cli

# Using pnpm
pnpm add -g @unhook/cli
```

### 2. Initialize Your Project

Run the initialization command using your preferred package runner:

```bash
# Using npx
npx @unhook/cli init

# Using bunx
bunx @unhook/cli init

# Using pnpm
pnpm dlx @unhook/cli init

# Using deno
deno run --allow-net --allow-read --allow-write npm:@unhook/cli init
```

This will:
1. Open your browser to authenticate with Unhook
2. Create an `unhook.config.ts` file in your project
3. Configure your webhook endpoints

### 3. Start the Webhook

```bash
# Using npx
npx @unhook/cli

# Using bunx
bunx @unhook/cli

# Using pnpm
pnpm dlx @unhook/cli

# Using deno
deno run --allow-net --allow-read --allow-write npm:@unhook/cli
```

This will create a secure webhook endpoint that delivers requests to your local server based on the configuration.

### 4. Configure Your Webhook Provider

Use the webhook URL in your provider's settings:

```bash
https://unhook.sh/wh_your_webhook_id
```

The webhook will automatically route requests based on the `from` and `to` configuration in your `unhook.config.ts`.

## Configuration

### Webhook Configuration

The `unhook.config.ts` file supports the following options:

```typescript
interface WebhookConfig {
  webhookId: string;  // Your unique webhook ID
  clientId?: string;  // Optional client ID
  debug?: boolean;    // Enable debug mode
  telemetry?: boolean; // Enable telemetry
  destination: Array<{
    name: string;     // Name of the endpoint
    url: string | URL | {  // Local URL to deliver requests to
      protocol?: 'http' | 'https';
      hostname: string;
      port?: string;
      pathname?: string;
      search?: string;
    };
    ping?: boolean | string | URL | {  // Optional ping configuration
      protocol?: 'http' | 'https';
      hostname: string;
      port?: string;
      pathname?: string;
      search?: string;
    };
  }>;
  source?: Array<{
    name: string;     // Name of the source
    agent?: {         // Optional agent header configuration
      type: 'header';
      key: string;
      value: string;
    };
    timestamp?: {     // Optional timestamp header configuration
      type: 'header';
      key: string;
      value: string;
    };
    verification?: {  // Optional verification header configuration
      type: 'header';
      key: string;
      value: string;
    };
    secret?: string;  // Optional secret for verification
    defaultTimeout?: number; // Default timeout in milliseconds
  }>;
  delivery: Array<{
    source?: string;  // Source of the webhook (defaults to '*')
    destination: string; // Name of the destination to deliver to
  }>;
}
```

### Security Features

- API key authentication for private webhooks
- Method restrictions
- Source restrictions
- Request body size limits
- Header filtering
- End-to-end encryption

### Request Validation

The webhook endpoint validates:
- Webhook ID existence
- API key (for private webhooks)
- Webhook status (active/inactive)
- Allowed methods
- Allowed sources
- Request body size
- Required headers

### Request Storage

By default, the webhook endpoint:
- Stores request headers
- Stores request body (up to 10MB)
- Tracks request metadata (source, size, content type)
- Maintains request history
- Supports request replay

## Usage Examples

### Basic Usage

```bash
# Start webhook with default config
unhook

# Start with debug logging
unhook --debug

# Start with specific config file
unhook --config ./custom.config.ts
```

### Multiple Endpoints

Configure multiple endpoints in your `unhook.config.ts`:

```typescript
import { defineWebhookConfig } from '@unhook/cli';

const config = defineWebhookConfig({
  webhookId: 'wh_your_webhook_id',
  destination: [
    {
      name: 'clerk',
      url: 'http://localhost:3000/api/webhooks/clerk',
      ping: true
    },
    {
      name: 'stripe',
      url: 'http://localhost:3000/api/webhooks/stripe',
      ping: {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/webhooks/stripe/health'
      }
    },
    {
      name: 'github',
      url: 'http://localhost:3000/api/webhooks/github',
      ping: false
    }
  ],
  source: [
    {
      name: 'clerk',
    },
    {
      name: 'stripe',
    }
  ],
  delivery: [
    {
      source: 'clerk',
      destination: 'clerk'
    },
    {
      source: 'stripe',
      destination: 'stripe'
    },
    {
      source: 'github',
      destination: 'github'
    }
  ]
} as const);

export default config;
```

### Request Replay

The webhook dashboard allows you to replay previous requests:

1. View request history in the dashboard
2. Select a request to replay
3. Choose the target endpoint
4. Click "Replay Request"

The replayed request will maintain the original:
- Headers
- Body
- Content type
- Source information

## Team Development

### Shared Configuration

Teams can share a single webhook configuration:

```typescript
// team.unhook.config.ts
import { defineWebhookConfig } from '@unhook/cli';

const config = defineWebhookConfig({
  webhookId: 'wh_team_webhook_id',
  destination: [
    {
      name: 'dev1',
      url: 'http://localhost:3000/api/webhooks',
      ping: true
    },
    {
      name: 'dev2',
      url: 'http://localhost:3001/api/webhooks',
      ping: true
    }
  ],
  source: [
    {
      name: 'clerk',
    },
    {
      name: 'stripe',
    }
  ],
  delivery: [
    {
      source: 'clerk',
      destination: 'dev1'
    },
    {
      source: 'stripe',
      destination: 'dev2'
    }
  ]
} as const);

export default config;
```

### Team Features

- **Shared Webhook URL**: All team members use the same webhook URL
- **Individual Routing**: Each developer can receive specific webhook types
- **Request History**: View and replay requests across the team
- **Real-time Monitoring**: See incoming requests in real-time
- **Team Dashboard**: Monitor team activity and webhook status

### Team Management

Team leads can:
- Monitor all webhook activity across the team
- Set up shared configurations
- Control access with team API keys
- Share webhook history and logs
- Configure routing rules for team members

## Dashboard

Access the web dashboard at `https://app.unhook.sh` to:
- View real-time webhook requests across your team
- Monitor active team members and their connections
- Replay previous requests
- Analyze request/response data
- Configure webhook routing rules
- Manage team API keys and settings

## Security

Unhook takes security seriously:
- All traffic is encrypted end-to-end
- API keys are required for authentication
- No data is stored on our servers
- Open source and auditable

## Authentication

Unhook securely manages authentication state locally:

- Authentication tokens are stored securely in your home directory at `~/.unhook/auth-storage.json`
- No sensitive data is ever transmitted to our servers
- The auth store manages:
  - Authentication state
  - User tokens
  - Organization ID
  - Basic user info (first name, last name)

The local storage ensures:
- Persistent sessions between CLI restarts
- Secure token management
- No need to re-authenticate frequently
- Team and organization context preservation

To clear auth data:
```bash
rm ~/.unhook/auth-storage.json
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- [Documentation](https://docs.unhook.sh)
- [GitHub Issues](https://github.com/unhook-sh/unhook/issues)
- [Discord Community](https://discord.gg/unhook)

## License

MIT License - see [LICENSE](LICENSE) for details
