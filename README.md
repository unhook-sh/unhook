<div align="center">

<img src="https://raw.githubusercontent.com/unhook-sh/unhook/main/apps/web-app/public/logo.svg" alt="Unhook Logo" width="100" height="100" />

# Unhook

[![npm version](https://img.shields.io/npm/v/@unhook/cli.svg)](https://www.npmjs.com/package/@unhook/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/unhook-sh/unhook/vscode-extension-release.yml?branch=main)](https://github.com/unhook-sh/unhook/actions/workflows/vscode-extension-release.yml)
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
- 🌍 **Cross-Platform**: Works seamlessly on Windows, macOS, and Linux (x64/ARM64)
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

### Option 1: VS Code Extension (Recommended)

The fastest way to get started with Unhook is using our VS Code extension:

1. **Install Extension**
   - Open VS Code
   - Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
   - Search for "Unhook - Webhook Development"
   - Click **Install**

2. **Authenticate**
   - Click the Unhook icon in the Activity Bar
   - Click "Sign in to Unhook" in the status bar
   - Complete the OAuth flow in your browser

3. **Configure**
   - Create an `unhook.yml` file in your workspace:
   ```yaml
   webhookId: wh_your_webhook_id
   destination:
     - name: local
       url: http://localhost:3000/api/webhooks
   delivery:
     - source: "*"
       destination: local
   ```

4. **Start Receiving Webhooks**
   - Create a webhook URL at [unhook.sh/app](https://unhook.sh/app)
   - Configure your provider to use the Unhook URL
   - View events in the VS Code sidebar as they arrive

### Option 2: CLI

1. **Install CLI**
   ```bash
   # Using npx (recommended)
   npx @unhook/cli init

   # Using bunx
   bunx @unhook/cli init

   # Using pnpm
   pnpm dlx @unhook/cli init

   # Using deno
   deno run --allow-net --allow-read --allow-write npm:@unhook/cli init
   ```

2. **Initialize Project**
   ```bash
   npx @unhook/cli init
   ```
   This will:
   - Open your browser to authenticate with Unhook
   - Create an `unhook.yml` file in your project
   - Configure your webhook endpoints

3. **Start the Webhook**
   ```bash
   npx @unhook/cli listen
   ```
   This will create a secure webhook endpoint that delivers requests to your local server based on the configuration.

4. **Configure Your Webhook Provider**
   Use the webhook URL in your provider's settings:
   ```bash
   https://unhook.sh/wh_your_webhook_id
   ```

## Configuration

### Configuration File

The `unhook.yml` file is the primary way to configure Unhook. It supports the following structure:

```yaml
# Required: Your unique webhook ID
webhookId: wh_your_webhook_id

# Optional: Enable debug mode
debug: false

# Optional: Enable telemetry
telemetry: true

# Required: Array of destination endpoints
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
    ping: true  # Optional: Health check configuration

# Optional: Array of webhook sources
source:
  - name: stripe
  - name: github

# Required: Array of delivery rules
delivery:
  - source: "*"  # Optional: Source filter (defaults to *)
    destination: local  # Name of the destination from 'destination' array
```

### Environment Variables

All configuration options can be set via environment variables:

```bash
# Core settings
WEBHOOK_ID=wh_your_webhook_id
WEBHOOK_DEBUG=true
WEBHOOK_TELEMETRY=true

# Destination settings
WEBHOOK_DESTINATION_0_NAME=local
WEBHOOK_DESTINATION_0_URL=http://localhost:3000/api/webhooks
WEBHOOK_DESTINATION_0_PING=true

# Source settings
WEBHOOK_SOURCE_0_NAME=stripe
WEBHOOK_SOURCE_1_NAME=github

# Delivery settings
WEBHOOK_DELIVERY_0_SOURCE=*
WEBHOOK_DELIVERY_0_DESTINATION=local
```

## CLI Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `unhook init` | Authenticate with Unhook and set up your project |
| `unhook listen` | Start the Unhook relay to receive and forward webhooks |
| `unhook login` | Authenticate your CLI with your Unhook account |

### Command Options

#### `unhook init`
```bash
unhook init [options]

Options:
  -c, --code         Authentication code for direct login (advanced)
  -t, --destination  Set the local destination URL to forward webhooks to
  -s, --source       Set the source name for incoming webhooks
  -w, --webhook      Specify a webhook ID to use
  -v, --verbose      Enable verbose debug logging
```

#### `unhook listen`
```bash
unhook listen [options]

Options:
  -c, --config       Path to a custom unhook.yml configuration file
  --path             Directory to watch for config changes (default: ".")
  -v, --verbose      Enable verbose debug logging
```

## Team Development

### Shared Configuration

Teams can share a single webhook configuration:

```yaml
webhookId: wh_team_webhook_id
destination:
  - name: dev1
    url: http://localhost:3000/api/webhooks
    ping: true
  - name: dev2
    url: http://localhost:3001/api/webhooks
    ping: true
source:
  - name: clerk
  - name: stripe
delivery:
  - source: clerk
    destination: dev1
  - source: stripe
    destination: dev2
```

### Team Features
- **Shared Webhook URL**: All team members use the same webhook URL
- **Individual Routing**: Each developer can receive specific webhook types
- **Request History**: View and replay requests across the team
- **Real-time Monitoring**: See incoming requests in real-time
- **Team Dashboard**: Monitor team activity and webhook status

## Cross-Platform Installation

Unhook CLI automatically downloads and installs the correct platform-specific binary for your system during installation. This ensures optimal performance and eliminates the need for compilation or build tools.

### Supported Platforms

- **Windows**: x64 (64-bit)
- **macOS**: Intel (x64) and Apple Silicon (ARM64)
- **Linux**: x64 and ARM64 with both glibc and musl (Alpine Linux) support

### How It Works

1. **Platform Detection**: Automatically detects your OS, architecture, and C library variant
2. **Binary Download**: Downloads the appropriate pre-compiled binary from GitHub releases
3. **Smart Caching**: Stores binaries locally in `~/.unhook/bin/{version}/` for fast access
4. **Transparent Execution**: CLI wrapper seamlessly executes the native binary
5. **Version Management**: Automatically cleans up old versions during updates

### Package Manager Support

Works with all major JavaScript package managers:

```bash
# npm
npm install -g @unhook/cli

# yarn
yarn global add @unhook/cli

# pnpm
pnpm add -g @unhook/cli

# bun
bun add -g @unhook/cli
```

For detailed technical information about the cross-platform implementation, see our [Cross-Platform CLI Setup Guide](https://docs.unhook.sh/cross-platform-setup).

## Provider Setup

### Stripe
1. Go to your [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add Endpoint"
3. Enter your Unhook URL:
   ```bash
   https://unhook.sh/wh_your_webhook_id
   ```

### GitHub
1. Go to your repository settings
2. Navigate to "Webhooks"
3. Click "Add webhook"
4. Enter your Unhook URL:
   ```bash
   https://unhook.sh/wh_your_webhook_id
   ```

### Clerk
1. Go to your [Clerk Dashboard](https://dashboard.clerk.dev)
2. Navigate to "Webhooks"
3. Click "Add Endpoint"
4. Enter your Unhook URL:
   ```bash
   https://unhook.sh/wh_your_webhook_id
   ```

## Security Features

- API key authentication for private webhooks
- Method restrictions
- Source restrictions
- Request body size limits
- Header filtering
- End-to-end encryption

## Authentication

Authentication data is stored locally at `~/.unhook/auth-storage.json`:
- Authentication state
- User tokens
- Organization ID
- Basic user info

To clear auth data:
```bash
rm ~/.unhook/auth-storage.json
```

## Deployment

Unhook can be deployed both as a self-hosted solution or on cloud infrastructure.

### Self-Hosted Deployment

Deploy Unhook on your own infrastructure using Docker:

```bash
# Quick start
make deploy-local

# Production deployment with nginx
make deploy-prod
```

### Cloud Deployment

Deploy to Kubernetes or cloud providers:

```bash
# Deploy to Kubernetes
make deploy-k8s

# Or use cloud-specific deployment guides
```

For detailed deployment instructions, see our [Deployment Guide](docs/DEPLOYMENT.md).

### Key Features for Self-Hosting

- **Complete Control**: Run on your own infrastructure
- **Data Privacy**: Keep all webhook data within your organization
- **Custom Configuration**: Adapt to your specific needs
- **Docker & Kubernetes**: Production-ready deployment options
- **High Availability**: Built for scale with Redis and PostgreSQL

## Documentation

- **[Quick Start Guide](https://docs.unhook.sh/quickstart)** - Get started in under 5 minutes
- **[CLI Reference](https://docs.unhook.sh/cli)** - Complete CLI documentation
- **[VS Code Extension](https://docs.unhook.sh/vscode-extension)** - VS Code extension guide
- **[Configuration](https://docs.unhook.sh/configuration)** - Configuration file reference
- **[Provider Guides](https://docs.unhook.sh/providers)** - Setup guides for webhook providers
- **[Team Setup](https://docs.unhook.sh/team-setup)** - Configure Unhook for your team
- **[Self-Hosting](https://docs.unhook.sh/deployment)** - Deploy your own Unhook instance

## Support

- [Documentation](https://docs.unhook.sh)
- [GitHub Issues](https://github.com/unhook-sh/unhook/issues)
- [Discord Community](https://discord.gg/unhook)
- [Official Website](https://unhook.sh)

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

## License

Unhook is open source software licensed under the MIT License.