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

### 1. Initialize Your Project

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
2. Create an `unhook.yaml` file in your project
3. Configure your webhook endpoints

### 2. Start the Webhook

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

### 3. Configure Your Webhook Provider

Use the webhook URL in your provider's settings:

```bash
https://unhook.sh/wh_your_webhook_id
```

The webhook will automatically route requests based on the `source` and `destination` configuration in your `unhook.yaml`.

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

## Configuration

### Webhook Configuration

The `unhook.yaml` file supports the following options:

```typescript
interface WebhookConfig {
  webhookId: string;  // Your unique webhook ID
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
  }>;
  source?: Array<{
    name: string;     // Name of the source
  }>;
  delivery: Array<{
    source?: string;  // Source of the webhook (defaults to *)
    destination: string; // Name of the destination to deliver to
  }>;
}
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