# Unhook JetBrains Plugin

A JetBrains plugin for webhook development that simplifies testing webhooks locally.

## Features

- **Real-time webhook event monitoring** - See webhook events as they arrive
- **Webhook request inspection** - View headers, body, and metadata for each webhook
- **Event replay** - Replay webhook events to test your handling logic
- **Team collaboration** - Share webhook URLs across your development team
- **Provider support** - Built-in support for Stripe, GitHub, Clerk, and more
- **Secure forwarding** - End-to-end encrypted webhook forwarding to local endpoints
- **Configuration management** - Manage settings via `unhook.yaml` configuration files

## Installation

1. Download from the [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/unhook-jetbrains)
2. Install via IDE: `File → Settings → Plugins → Marketplace → Search "Unhook"`
3. Restart your IDE

## Quick Start

1. **Sign in to Unhook** - Use the "Sign in to Unhook" action or click the status bar
2. **Create configuration** - Add an `unhook.yaml` file to your project root:
   ```yaml
   team_id: your-team-id
   api_key: your-api-key
   webhook_url: https://unhook.sh/wh_your_webhook_id
   endpoints:
     default:
       url: http://localhost:3000/webhook
       method: POST
   ```
3. **Start monitoring** - The plugin will automatically start monitoring when you open a project with valid configuration

## Usage

### Tool Window

Open the Unhook tool window from `View → Tool Windows → Unhook` or click the status bar widget.

The tool window shows:
- List of recent webhook events
- Event details including headers, body, and metadata
- Connection status and controls

### Status Bar

The status bar widget shows the current connection state:
- **Sign In Required** - Authentication needed
- **Disconnected** - Not connected to Unhook service
- **Active** - Connected and forwarding events
- **Paused** - Connected but event forwarding is disabled

### Actions

Available actions in the `Tools → Unhook` menu:
- **Show Events** - Open the tool window
- **Toggle Event Forwarding** - Enable/disable webhook forwarding
- **Sign In/Out** - Manage authentication
- **Clear Events** - Clear event history
- **Refresh Events** - Refresh the event list

### Configuration

Configure the plugin via `File → Settings → Tools → Unhook`:
- API URL (for self-hosted instances)
- Event forwarding settings
- Event history limits
- Notification preferences

## Configuration File

Create an `unhook.yaml` file in your project root:

```yaml
# Required
team_id: your-team-id
api_key: your-api-key
webhook_url: https://unhook.sh/wh_your_webhook_id

# Optional
endpoints:
  default:
    url: http://localhost:3000/webhook
    method: POST
    headers:
      Authorization: Bearer your-token
    timeout: 30000

filters:
  - payment_intent.succeeded
  - customer.created

settings:
  max_event_history: 100
  auto_reconnect: true
  notifications_enabled: true
  log_level: info
```

## Development

### Building

```bash
# Build the plugin
./gradlew build

# Run IDE with plugin for development
./gradlew runIde

# Build distribution
./gradlew buildPlugin
```

### Testing

```bash
# Run tests
./gradlew test

# Verify plugin compatibility
./gradlew verifyPlugin
```

## Supported IDEs

- IntelliJ IDEA (Community & Ultimate)
- WebStorm
- PhpStorm
- PyCharm
- RubyMine
- CLion
- GoLand
- DataGrip
- Android Studio
- And other JetBrains IDEs

## Requirements

- JetBrains IDE 2024.2 or later
- Java 21 or later
- Unhook account (sign up at [unhook.sh](https://unhook.sh))

## Support

- [Documentation](https://docs.unhook.sh)
- [GitHub Issues](https://github.com/unhook-sh/unhook/issues)
- [Discord Community](https://discord.gg/unhook)

## License

MIT License - see [LICENSE](LICENSE) file for details.