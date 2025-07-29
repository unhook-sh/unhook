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
- **Custom File Icons**: Dedicated icons for Unhook configuration files (`unhook.yaml`, `unhook.yml`, `unhook.json`, `unhook.ts`)

---

## Getting Started

### 1. Install the Extension

- Open the Extensions view in VS Code (`⇧⌘X`)
- Search for `Unhook - Webhook Development` (or install from a local `.vsix` file if provided)
- Click **Install**

### 2. Authenticate with Unhook

- Open the Unhook sidebar from the Activity Bar
- Follow the prompts to sign in with your Unhook account
- If you don't have an account, you can create one for free at [unhook.sh](https://unhook.sh)

### 3. Start Using Unhook in VS Code

- Use the sidebar to view, replay, and debug webhook events
- Add or manage API events with the provided commands
- Collaborate with your team in real time

---

## Configuration

Create an `unhook.yml` file in your workspace root:

```yaml
webhookId: your_webhook_id_here
destination:
  url: http://localhost:3000/webhook
  name: Local Development Server
delivery:
  enabled: true
```

## Settings

The following settings are available in VS Code:

- `unhook.delivery.enabled`: Enable or disable automatic webhook delivery
- `unhook.events.autoClear`: Automatically clear old events when max history is reached
- `unhook.events.maxHistory`: Maximum number of events to keep in history
- `unhook.notifications.showForNewEvents`: Show notifications for new webhook events
- `unhook.output.autoShow`: Automatically show the output panel for new events
- `unhook.output.maxLines`: Maximum number of lines in the output panel

---

## Why Unhook?

- **For Teams**: Share a single webhook endpoint while everyone tests locally
- **For Security**: All traffic is encrypted and authenticated
- **For Productivity**: No more switching between tools—debug webhooks where you code

---

## Configuration & Advanced Usage

### Extension Settings

- **Event Forwarding**: Control whether new webhook events are automatically forwarded to their destinations
  - Setting: `unhook.delivery.enabled` (default: `true`)
  - When disabled, events will be received and displayed but not forwarded until manually replayed
  - Toggle via Command Palette: "Unhook: Toggle Event Forwarding"

### Advanced Configuration

- Configure routing and provider integrations via the Unhook web dashboard or CLI
- For advanced configuration, see the [Unhook documentation](https://unhook.sh/docs)

### File Icons

The extension provides custom icons for Unhook configuration files:
- `unhook.yaml` and `unhook.yml` - YAML configuration files
- `unhook.json` - JSON configuration files
- `unhook.ts` - TypeScript configuration files

To use the custom file icons, enable the "Unhook File Icons" icon theme in VS Code:
1. Open VS Code Settings (`⌘,`)
2. Search for "File Icon Theme"
3. Select "Unhook File Icons" from the dropdown

---

## Support & Feedback

- [Unhook Documentation](https://unhook.sh/docs)
- [GitHub Issues](https://github.com/unhook-sh/unhook/issues)
- [Contact Us](https://unhook.sh/contact)

---

© Unhook. All rights reserved.
