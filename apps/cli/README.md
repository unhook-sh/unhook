# Unhook CLI

The Unhook CLI is a command-line interface for testing webhooks during local development. It provides a secure, team-friendly way to receive and forward webhooks to your local development environment.

## Features

- **Interactive Terminal UI** - Beautiful, real-time interface for monitoring webhooks
- **Team Collaboration** - Share webhook URLs across your entire team
- **Smart Routing** - Automatically route webhooks to the right developer
- **Cross-Platform** - Works on Windows, macOS, and Linux (x64/ARM64)
- **Secure by Default** - End-to-end encryption for all webhook traffic
- **Health Checks** - Built-in health monitoring for your local endpoints
- **Debug Mode** - Verbose logging for troubleshooting

## Installation

### Global Installation

```bash
# Using npm
npm install -g @unhook/cli

# Using yarn
yarn global add @unhook/cli

# Using pnpm
pnpm add -g @unhook/cli

# Using bun
bun add -g @unhook/cli
```

### One-time Usage

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

## Quick Start

1. **Initialize your project:**
   ```bash
   npx @unhook/cli init
   ```
   This will:
   - Open your browser to authenticate with Unhook
   - Create an `unhook.yml` configuration file
   - Configure your webhook endpoints

2. **Start the webhook relay:**
   ```bash
   npx @unhook/cli listen
   ```
   This creates a secure webhook endpoint that delivers requests to your local server.

3. **Configure your webhook provider:**
   Use the generated webhook URL in your provider's settings:
   ```bash
   https://unhook.sh/wh_your_webhook_id
   ```

## Commands

### `unhook init`

Authenticate with Unhook and set up your project. Creates an `unhook.yml` config and guides you through connecting your webhook provider.

```bash
unhook init [options]

Options:
  -c, --code         Authentication code for direct login (advanced)
  -t, --destination  Set the local destination URL to forward webhooks to
  -s, --source       Set the source name for incoming webhooks
  -w, --webhook      Specify a webhook ID to use
  -v, --verbose      Enable verbose debug logging
```

### `unhook listen`

Start the Unhook relay to receive and forward webhooks to your local server. Keeps the CLI running and displays incoming requests.

```bash
unhook listen [options]

Options:
  -c, --config       Path to a custom unhook.yml configuration file
  --path             Directory to watch for config changes (default: ".")
  -v, --verbose      Enable verbose debug logging
```

### `unhook login`

Authenticate your CLI with your Unhook account. Opens a browser for login.

```bash
unhook login [options]

Options:
  -c, --code         Authentication code for direct login (advanced)
  -v, --verbose      Enable verbose debug logging
```

## Configuration

The CLI uses an `unhook.yml` file for configuration:

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
  - source: "*"  # Optional: Source filter (defaults to "*")
    destination: local  # Name of the destination from 'destination' array
```

## Interactive UI

The CLI includes a beautiful interactive terminal UI that shows:

- **Connection Status** - Real-time connection information
- **Webhook Activity** - Live feed of incoming webhook requests
- **Request Details** - Detailed view of request headers, body, and timing
- **Error Messages** - Clear error reporting and debugging information
- **Debug Panel** - Verbose logging when debug mode is enabled

### Navigation

- **Arrow Keys** - Navigate through lists and menus
- **Enter** - Select items or execute actions
- **ESC** - Go back to previous screen
- **q** - Quit the application
- **?** - Show keyboard shortcuts

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

- **Shared Webhook URL** - All team members use the same webhook URL
- **Individual Routing** - Each developer can receive specific webhook types
- **Request History** - View and replay requests across the team
- **Real-time Monitoring** - See incoming requests in real-time
- **Team Dashboard** - Monitor team activity and webhook status

## Cross-Platform Support

The CLI automatically downloads and installs the correct platform-specific binary for your system:

### Supported Platforms

- **Windows**: x64 (64-bit)
- **macOS**: Intel (x64) and Apple Silicon (ARM64)
- **Linux**: x64 and ARM64 with both glibc and musl (Alpine Linux) support

### How It Works

1. **Platform Detection** - Automatically detects your OS, architecture, and C library variant
2. **Binary Download** - Downloads the appropriate pre-compiled binary from GitHub releases
3. **Smart Caching** - Stores binaries locally in `~/.unhook/bin/{version}/` for fast access
4. **Transparent Execution** - CLI wrapper seamlessly executes the native binary
5. **Version Management** - Automatically cleans up old versions during updates

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

## Environment Variables

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

## Examples

### Basic Development Setup
```bash
# Initialize project
npx @unhook/cli init

# Start webhook
npx @unhook/cli listen
```

### Team Development
```bash
# Developer 1
npx @unhook/cli init --webhook wh_team_webhook_id
npx @unhook/cli listen

# Developer 2
npx @unhook/cli init --webhook wh_team_webhook_id
npx @unhook/cli listen
```

### Custom Configuration
```bash
# Use custom config file
npx @unhook/cli listen --config ./config/unhook.yml

# Watch custom directory
npx @unhook/cli listen --path ./config
```

### Debug Mode
```bash
# Enable debug logging
npx @unhook/cli listen --verbose

# Debug initialization
npx @unhook/cli init --verbose
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Check your internet connection
   - Verify the webhook ID is correct
   - Ensure the port is available

2. **Authentication Problems**
   - Clear auth data: `rm ~/.unhook/auth-storage.json`
   - Re-run initialization: `npx @unhook/cli init`

3. **Configuration Issues**
   - Verify YAML syntax in `unhook.yml`
   - Check file permissions
   - Ensure required fields are present

4. **Debug Mode**
   - Enable debug logging: `npx @unhook/cli listen --verbose`
   - Check the debug panel for detailed information

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/unhook-sh/unhook.git
cd unhook/apps/cli

# Install dependencies
bun install

# Build the CLI
bun run build

# Run in development mode
bun run dev
```

### Testing

```bash
# Run tests
bun test

# Run tests with coverage
bun test --coverage
```

## Support

- [Documentation](https://docs.unhook.sh/cli)
- [GitHub Issues](https://github.com/unhook-sh/unhook/issues)
- [Discord Community](https://discord.gg/unhook)

## License

The Unhook CLI is open source software licensed under the MIT License.
