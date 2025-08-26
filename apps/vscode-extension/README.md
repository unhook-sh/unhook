# Unhook VS Code Extension

<div align="center">
  <img src="https://raw.githubusercontent.com/unhook-sh/unhook/main/apps/web-app/public/logo.png" alt="Unhook Logo" width="100" height="100" />
</div>

## The Modern Webhook Development Tool for Teams — Now in VS Code

Unhook is the open-source platform that makes testing and collaborating on webhooks simple and secure. This extension brings Unhook's powerful webhook routing, monitoring, and team features directly into your VS Code workflow.

[Learn more about Unhook](https://unhook.sh)

---

## Features

- **Webhook Event Explorer**: View and manage webhook events directly in the VS Code sidebar
- **Team Collaboration**: See active team members and their webhook sessions
- **Request Replay**: Instantly replay webhook requests for rapid debugging
- **Real-Time Monitoring**: Inspect incoming webhook payloads and responses
- **Secure by Default**: End-to-end encryption and API key authentication
- **Provider Integrations**: Out-of-the-box support for Stripe, GitHub, Clerk, Discord, and more
- **Smart Routing**: Route webhooks to your local environment based on team and session
- **Beautiful, Native UI**: Seamless integration with the VS Code interface
- **Custom File Icons**: Dedicated icons for Unhook configuration files (`unhook.yml`, `unhook.yaml`, `unhook.json`, `unhook.ts`)

---

## Getting Started

### 1. Install the Extension

- Open the Extensions view in VS Code (`Ctrl+Shift+X` / `Cmd+Shift+X`)
- Search for `Unhook - Webhook Development`
- Click **Install**

### 2. Authenticate with Unhook

- Click the Unhook icon in the Activity Bar
- Click "Sign in to Unhook" in the status bar
- Complete the OAuth flow in your browser
- If you don't have an account, you can create one for free at [unhook.sh](https://unhook.sh)

### 3. Configure Your Workspace

Create an `unhook.yml` file in your workspace root:

**Option 1: Use the VS Code Extension (Recommended)**
- Click the Unhook icon in the Activity Bar
- Select "Create Configuration File" from the Quick Actions menu
- Choose your workspace folder
- Select a webhook from your account (or create one if none exist)
- The extension will automatically generate the configuration file

**Option 2: Manual Creation**
```yaml
webhookUrl: https://unhook.sh/your-org/your-webhook-name
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
    ping: true
delivery:
  - source: "*"
    destination: local
```

### 4. Start Receiving Webhooks

- Create a webhook URL at [unhook.sh/app](https://unhook.sh/app)
- Configure your webhook provider to use the Unhook URL
- View events in the VS Code sidebar as they arrive

### 5. Create Webhooks from VS Code (New!)

You can now create new webhooks directly from VS Code:

- **Quick Access**: Click the "Create New Webhook" button in the Events sidebar
- **Command Palette**: Press `Ctrl+Shift+P` and type "Unhook: Create New Webhook"
- **Keyboard Shortcut**: Use `Ctrl+Shift+W` (when signed in)
- **Status Bar**: Click the Unhook status bar item and select "Create New Webhook"
- **Context Menu**: Right-click in the Events panel and select "Create New Webhook"

The extension will:
1. Prompt you for a webhook name
2. Create the webhook via the Unhook API
3. Automatically update your local configuration file
4. Copy the webhook URL to your clipboard
5. Open the configuration file for review

This makes it easy to set up new webhook endpoints without leaving your development environment!

---

## Configuration

### Basic Configuration

The extension automatically detects Unhook configuration files in your workspace:

```yaml
# Required: Your unique webhook URL
webhookUrl: https://unhook.sh/your-org/your-webhook-name

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

### Configuration File Locations

The extension will look for configuration files in the following order:

1. `unhook.yml` (workspace root)
2. `unhook.yaml` (workspace root)
3. `unhook.config.yml` (workspace root)
4. `unhook.config.yaml` (workspace root)
5. `unhook.config.js` (workspace root)
6. `unhook.config.cjs` (workspace root)
7. `unhook.config.ts` (workspace root)
8. `unhook.config.json` (workspace root)

### Custom Configuration Path

You can specify a custom configuration file path in VS Code settings:

```json
{
  "unhook.configFilePath": "./config/unhook.yml"
}
```

---

## Extension Settings

### Output Settings

```json
{
  "unhook.output.autoShow": true,
  "unhook.output.maxLines": 1000
}
```

- **`unhook.output.autoShow`** (boolean, default: `false`)
  Automatically show the output panel when new events are received

- **`unhook.output.maxLines`** (number, default: `1000`)
  Maximum number of lines to keep in the output panel

### Event Management Settings

```json
{
  "unhook.events.maxHistory": 100,
  "unhook.events.autoClear": false
}
```

- **`unhook.events.maxHistory`** (number, default: `100`)
  Maximum number of events to keep in history

- **`unhook.events.autoClear`** (boolean, default: `false`)
  Automatically clear old events when the maximum history is reached

### Delivery Settings

```json
{
  "unhook.delivery.enabled": true
}
```

- **`unhook.delivery.enabled`** (boolean, default: `true`)
  Enable or disable forwarding new events to their destinations

### Polling Settings

```json
{
  "unhook.polling.interval": 5000,
  "unhook.polling.autoPauseEnabled": true,
  "unhook.polling.autoPauseTimeout": 600000
}
```

- **`unhook.polling.interval`** (number, default: `5000`)
  Polling interval in milliseconds for checking new events

- **`unhook.polling.autoPauseEnabled`** (boolean, default: `true`)
  Enable auto-pause after inactivity to save resources

- **`unhook.polling.autoPauseTimeout`** (number, default: `600000`)
  Auto-pause timeout in milliseconds after no events are received

### Status Bar Settings

```json
{
  "unhook.statusBar.showPollingStatus": true,
  "unhook.statusBar.showPollingInterval": true,
  "unhook.statusBar.showLastEventTime": true
}
```

- **`unhook.statusBar.showPollingStatus`** (boolean, default: `true`)
  Show polling status in the status bar

- **`unhook.statusBar.showPollingInterval`** (boolean, default: `true`)
  Show polling interval in the status bar

- **`unhook.statusBar.showLastEventTime`** (boolean, default: `true`)
  Show last event time in the status bar

### Notification Settings

```json
{
  "unhook.notifications.showForNewEvents": true
}
```

- **`unhook.notifications.showForNewEvents`** (boolean, default: `true`)
  Show notifications when new webhook events are received

### Analytics Settings

```json
{
  "unhook.analytics.enabled": false
}
```

- **`unhook.analytics.enabled`** (boolean, default: `false`)
  Enable anonymous usage analytics to help improve Unhook

---

## Commands

### Authentication Commands

| Command | Description |
|---------|-------------|
| `unhook.signIn` | Sign in to Unhook |
| `unhook.signOut` | Sign out of Unhook |

### Event Management Commands

| Command | Description |
|---------|-------------|
| `unhook.showEvents` | Show Events sidebar |
| `unhook.events.refresh` | Refresh events list |
| `unhook.events.filter` | Filter events |
| `unhook.quickPick` | Show Quick Pick interface |
| `unhook.createWebhook` | Create a new webhook and update configuration |

### Webhook Management Commands

| Command | Description |
|---------|-------------|
| `unhook.createWebhook` | Create a new webhook and update configuration |
| `unhook.createConfig` | Create unhook.yml configuration file |
| `unhook.configureServerUrls` | Configure server URLs for cloud or self-hosted |
| `unhook.configureApiKey` | Setup MCP Server with API key |

### Event Actions

| Command | Description | Context |
|---------|-------------|---------|
| `unhook.viewEvent` | View event details | Event item |
| `unhook.replayEvent` | Replay event | Event item |
| `unhook.copyEvent` | Copy event to clipboard | Event item |
| `unhook.viewRequest` | View request details | Request item |
| `unhook.replayRequest` | Replay request | Request item |

### Output & Settings Commands

| Command | Description |
|---------|-------------|
| `unhook.focusOutput` | Focus output panel |
| `unhook.clearOutput` | Clear output panel |
| `unhook.toggleOutput` | Toggle output panel |
| `unhook.toggleAutoShowOutput` | Toggle auto-show output |
| `unhook.toggleAutoClearEvents` | Toggle auto-clear events |
| `unhook.toggleDelivery` | Toggle event delivery |

### Polling Commands

| Command | Description |
|---------|-------------|
| `unhook.startPolling` | Start polling |
| `unhook.pausePolling` | Pause polling |
| `unhook.resumePolling` | Resume polling |
| `unhook.stopPolling` | Stop polling |
| `unhook.togglePolling` | Toggle polling |

---

## Keyboard Shortcuts

| Shortcut | Command | Description |
|----------|---------|-------------|
| `Ctrl+Shift+W` | `unhook.createWebhook` | Create a new webhook (when signed in) |
| `Escape` | `unhook.cancelAuth` | Cancel authentication (when pending) |

---

## Team Development

### Shared Configuration

Teams can share a single webhook configuration:

```yaml
webhookUrl: https://unhook.sh/your-org/your-team-webhook
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

---

## Provider Integration

The extension works with all supported webhook providers:

- **Stripe** - Payment and subscription webhooks
- **GitHub** - Repository and organization events
- **Clerk** - Authentication and user management events
- **Discord** - Bot and server events
- **Custom Providers** - Any webhook-enabled service

---

## File Icons

The extension provides custom icons for Unhook configuration files:
- `unhook.yml` and `unhook.yaml` - YAML configuration files
- `unhook.json` - JSON configuration files
- `unhook.ts` - TypeScript configuration files
- `unhook.js` and `unhook.cjs` - JavaScript configuration files

---

## Troubleshooting

### Common Issues

1. **Authentication Problems**
   - Sign out and sign in again using the command palette
   - Ensure you have a valid Unhook account at [unhook.sh](https://unhook.sh)

2. **No Events Appearing**
   - Verify your `unhook.yml` configuration is correct
   - Ensure the webhook URL is properly configured with your provider
   - Use the refresh button in the Events panel

3. **Configuration Not Found**
   - Ensure `unhook.yml` exists in your workspace root
   - Set custom path via `unhook.configFilePath` setting
   - Check YAML syntax is valid

4. **Replay Failures**
   - Ensure delivery is not paused (use "Toggle Event Delivery")
   - Verify destination URLs are accessible
   - Check the output panel for error messages

---

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/unhook-sh/unhook.git
cd unhook/apps/vscode-extension

# Install dependencies
bun install

# Build the extension
bun run build

# Package as VSIX
bun run package
```

### Development Mode

```bash
# Start development mode
bun run dev

# This runs both:
# - Extension compilation in watch mode
# - Webview development server
```

---

## Support & Feedback

- [Documentation](https://docs.unhook.sh/vscode-extension)
- [GitHub Issues](https://github.com/unhook-sh/unhook/issues)
- [Discord Community](https://discord.gg/unhook)

---

© Unhook. All rights reserved.
