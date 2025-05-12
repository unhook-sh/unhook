<div align="center">

<img src="apps/web-app/public/logo.png" alt="Unhook Logo" width="100" height="100" />

# Unhook

[![npm version](https://img.shields.io/npm/v/@unhook/cli.svg)](https://www.npmjs.com/package/@unhook/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/unhook-sh/unhook/ci.yml?branch=main)](https://github.com/unhook-sh/unhook/actions)
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
```

### 2. Start the Webhook

```bash
unhook
```

This will create a secure webhook to your local server and provide you with a webhook URL in this format:

```
# Full parameter names
https://unhook.sh/t_123?endpoint=YOUR_ENDPOINT

# Shorthand parameters (k=key, e=endpoint)
https://unhook.sh/t_123?e=YOUR_ENDPOINT
```

For example:
```bash
# Using full parameter names
https://unhook.sh/t_123?from=stripe
```

Components of the URL:
- `key` or `k`: Your public API key for authentication
- `endpoint` or `e`: The local endpoint where webhooks should be forwarded

### 3. Configure Your Webhook Provider

Use either URL format in your webhook provider's settings:

#### Stripe
```bash
# Full parameters
https://unhook.sh/t_123?endpoint=api/webhooks/stripe

# Shorthand
https://unhook.sh/t_123?e=api/webhooks/stripe
```

#### GitHub
```bash
# GitHub webhook endpoint
https://unhook.sh/t_123?endpoint=api/webhooks/github
```

## Usage Examples

### Basic Usage

```bash
# Start webhook on port 3000
unhook

# Enable debug logging
unhook --debug
```

### Configuration File

Create an `unhook.config.js` file in your project root:

```javascript
module.exports = {
  port: 3000,
  webhookId: 'your-webhook-id',
  debug: false,
  // Add other configuration options
}
```

## Team Development

### One URL, Many Developers

Unhook simplifies webhook testing for teams by sharing the same webhook URL:

```bash
# Webhook URL (shared across the team)
https://unhook.sh/t_123?e=api/webhooks/stripe

# Developer 1
unhook --port 3000 --client-id dev1

# Developer 2
unhook --port 3000 --client-id dev2

# Developer 3 (different port)
unhook --port 8080 --client-id dev3
```

Each developer runs Unhook locally, and the service automatically routes incoming webhooks to the appropriate developer's machine based on their active session and routing rules.

### Team Management

Team leads can:
- Monitor all webhook activity across the team
- Set up shared configurations
- Control access with team API keys
- Share webhook history and logs

### Shared Configuration

Create a team configuration file to standardize settings:

```javascript
// team.unhook.js
module.exports = {
  team: {
    name: 'frontend-team',
    webhookPrefix: 'frontend',
    defaultPort: 3000,
    // Optional: configure routing rules
    routing: {
      'stripe-*': 'payment-team',
      'github-*': 'devops-team'
    }
  }
}
```

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
