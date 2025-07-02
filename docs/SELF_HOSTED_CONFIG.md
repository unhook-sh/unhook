# Self-Hosted Configuration Guide

This guide explains how to configure the Unhook CLI and VS Code extension to connect to your self-hosted Unhook instance instead of the cloud service.

## Overview

When running a self-hosted Unhook instance, you need to configure your development tools to connect to your server instead of the default cloud service at unhook.sh.

## Configuration File

Both the CLI and VS Code extension use the same configuration file. Create an `unhook.yaml` file in your project root:

```yaml
# Your webhook ID from the self-hosted dashboard
webhookId: 'wh_your_webhook_id'

# Server configuration for self-hosted deployment
server:
  # The API URL of your self-hosted Unhook instance
  apiUrl: 'https://api.your-domain.com'
  
  # The dashboard URL (optional, defaults to apiUrl)
  dashboardUrl: 'https://dashboard.your-domain.com'

# Destination configuration
destination:
  - name: 'local'
    url: 'http://localhost:3000/api/webhooks'

# Delivery rules
delivery:
  - destination: 'local'
```

## CLI Configuration

### Option 1: Configuration File (Recommended)

1. Create the `unhook.yaml` file as shown above
2. The CLI will automatically detect and use it when you run:
   ```bash
   npx @unhook/cli
   ```

### Option 2: Environment Variable

You can also set the API URL via environment variable:

```bash
export NEXT_PUBLIC_API_URL="https://api.your-domain.com"
npx @unhook/cli
```

### Verifying Configuration

When the CLI starts with a self-hosted configuration, you'll see:
```
Using API URL from config: https://api.your-domain.com
```

## VS Code Extension Configuration

The VS Code extension automatically detects the `unhook.yaml` file in your workspace.

### Additional VS Code Settings

You can also configure the extension through VS Code settings:

1. Open VS Code Settings (Cmd/Ctrl + ,)
2. Search for "unhook"
3. Set the `unhook.configFilePath` if your config file is in a non-standard location

### Manual Configuration

In your VS Code workspace settings (`.vscode/settings.json`):

```json
{
  "unhook.configFilePath": "./path/to/unhook.yaml"
}
```

## Web Dashboard Configuration

When deploying the web dashboard, set these environment variables:

```env
# For self-hosted deployments
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_WEBHOOK_BASE_URL=https://webhooks.your-domain.com
NEXT_PUBLIC_IS_SELF_HOSTED=true
```

## Docker Compose Configuration

When using Docker Compose, these are set in your `.env` file:

```env
# URLs for self-hosted instance
WEBHOOK_BASE_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com
```

## Kubernetes Configuration

Update the ConfigMap with your domain:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: unhook-config
  namespace: unhook
data:
  NEXT_PUBLIC_API_URL: "https://your-domain.com"
  NEXT_PUBLIC_WEBHOOK_BASE_URL: "https://your-domain.com"
```

## Troubleshooting

### CLI Not Connecting

1. Verify the `unhook.yaml` file is in your project root
2. Check that the `apiUrl` is accessible:
   ```bash
   curl https://api.your-domain.com/api/health
   ```
3. Enable debug mode:
   ```yaml
   debug: true
   ```

### VS Code Extension Issues

1. Reload the VS Code window after adding the config file
2. Check the Output panel (View > Output > Unhook) for error messages
3. Ensure you're signed in with valid credentials for your self-hosted instance

### Authentication Issues

Self-hosted instances use the same Clerk authentication. Ensure:
1. Your Clerk keys are properly configured in the self-hosted instance
2. The callback URLs in Clerk include your self-hosted domain
3. CORS is properly configured on your server

## Example Projects

See the `unhook.self-hosted.example.yaml` file in the repository for a complete example configuration.

## Support

For issues specific to self-hosted deployments:
- Check the [deployment guide](DEPLOYMENT.md)
- Review server logs for errors
- Ensure all services are running and accessible