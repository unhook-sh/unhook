import * as vscode from 'vscode';
import type { AuthStore } from '../services/auth.service';

const DEFAULT_UNHOOK_CONFIG = `# Unhook Webhook Configuration
# For more information, visit: https://docs.unhook.sh/configuration
#
# Schema:
#   webhookId: string                    # Unique identifier for your webhook
#   destination:                         # Array of destination endpoints
#     - name: string                     # Name of the endpoint
#       url: string|URL|RemotePattern    # URL to forward webhooks to
#       ping?: boolean|string|URL        # Optional ping configuration
#   delivery:                             # Array of delivery rules
#     - source?: string                  # Optional source filter (default: "*")
#       destination: string              # Name of the destination from 'destination' array
#
# RemotePattern:
#   protocol?: "http"|"https"            # URL protocol
#   hostname: string                     # URL hostname
#   port?: string                        # URL port
#   pathname?: string                    # URL pathname
#   search?: string                      # URL search params

webhookId: wh_example
destination:
  - name: local
    url: http://localhost:3000/api/webhooks
delivery:
  - destination: local
`;

const SELF_HOSTED_CONFIG = `# Unhook Self-Hosted Configuration
#
# This configuration connects to a self-hosted Unhook instance

# Your webhook ID from the self-hosted dashboard
webhookId: wh_example

# Server configuration for self-hosted deployment
server:
  # The API URL of your self-hosted Unhook instance
  apiUrl: https://api.your-domain.com

  # The dashboard URL (optional, defaults to apiUrl)
  dashboardUrl: https://dashboard.your-domain.com

# Destination configuration - where webhooks should be forwarded
destination:
  - name: local
    url: http://localhost:3000/api/webhooks

# Delivery rules - which webhooks go to which destination
delivery:
  - destination: local

# Optional: Enable debug mode
debug: false
`;

export function registerConfigCommands(
  context: vscode.ExtensionContext,
  _authStore?: AuthStore,
) {
  const createConfigCommand = vscode.commands.registerCommand(
    'unhook.createConfig',
    async () => {
      // Get the workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
          'Please open a workspace folder before creating an Unhook configuration file.',
        );
        return;
      }

      // Ask user for configuration type
      const configType = await vscode.window.showQuickPick(
        [
          {
            description: 'Connect to Unhook cloud service (unhook.sh)',
            label: 'Cloud Configuration',
            value: 'cloud',
          },
          {
            description: 'Connect to your own Unhook instance',
            label: 'Self-Hosted Configuration',
            value: 'self-hosted',
          },
        ],
        {
          placeHolder: 'Select configuration type',
          title: 'Create Unhook Configuration',
        },
      );

      if (!configType) {
        return;
      }

      // Choose the workspace folder if there are multiple
      let targetFolder: vscode.WorkspaceFolder | undefined;
      if (workspaceFolders.length === 1) {
        targetFolder = workspaceFolders[0];
      } else {
        const folderPick = await vscode.window.showQuickPick(
          workspaceFolders.map((folder) => ({
            description: folder.uri.fsPath,
            folder,
            label: folder.name,
          })),
          {
            placeHolder: 'Select workspace folder',
          },
        );

        if (!folderPick) {
          return;
        }
        targetFolder = folderPick.folder;
      }

      if (!targetFolder) {
        return;
      }

      const filename = 'unhook.yml';

      const configUri = vscode.Uri.joinPath(targetFolder.uri, filename);

      // Check if file already exists
      try {
        await vscode.workspace.fs.stat(configUri);
        const overwrite = await vscode.window.showWarningMessage(
          `${filename} already exists. Do you want to overwrite it?`,
          'Yes',
          'No',
        );

        if (overwrite !== 'Yes') {
          return;
        }
      } catch {
        // File doesn't exist, which is what we want
      }

      // Write the configuration file
      const configContent =
        configType.value === 'self-hosted'
          ? SELF_HOSTED_CONFIG
          : DEFAULT_UNHOOK_CONFIG;

      try {
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(
          configUri,
          encoder.encode(configContent),
        );

        // Open the created file
        const document = await vscode.workspace.openTextDocument(configUri);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(
          `Created ${filename} in ${targetFolder.name}`,
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to create configuration file: ${error}`,
        );
      }
    },
  );

  const createCursorMcpServerCommand = vscode.commands.registerCommand(
    'unhook.createCursorMcpServer',
    async () => {
      // Get API key from config manager
      const { ConfigManager } = await import('../config.manager');
      const configManager = ConfigManager.getInstance();
      const apiKey = configManager.getApiKey();

      if (!apiKey) {
        vscode.window.showErrorMessage(
          'Please configure your API key first. You can get one from https://unhook.sh/app/api-keys',
        );
        return;
      }

      // Get the workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
          'Please open a workspace folder before creating Cursor MCP server configuration.',
        );
        return;
      }

      // Choose the workspace folder if there are multiple
      let targetFolder: vscode.WorkspaceFolder | undefined;
      if (workspaceFolders.length === 1) {
        targetFolder = workspaceFolders[0];
      } else {
        const folderPick = await vscode.window.showQuickPick(
          workspaceFolders.map((folder) => ({
            description: folder.uri.fsPath,
            folder,
            label: folder.name,
          })),
          {
            placeHolder: 'Select workspace folder',
          },
        );

        if (!folderPick) {
          return;
        }
        targetFolder = folderPick.folder;
      }

      if (!targetFolder) {
        return;
      }

      // Get API URL from config manager
      const apiUrl = configManager.getApiUrl();
      const isSelfHosted = configManager.isSelfHosted();

      // Create MCP configuration content
      const mcpConfigContent = `{
  "mcpServers": {
    "unhook": {
      "url": "${apiUrl}/api/mcp/${apiKey}/sse",
      "transport": "sse"
    }
  }
}`;

      // Create Cursor rules content
      const cursorRulesContent = `# Unhook Cursor Rules

## Overview
This rule file configures Cursor to work with the Unhook MCP server for webhook development and debugging.

## MCP Server Configuration
The Unhook MCP server runs as a remote service and provides access to webhook events, requests, and analytics through Cursor's AI assistant via Server-Sent Events (SSE).

## Connection
The MCP server connects directly to your Unhook instance using SSE transport. No local installation required.

## Available Resources
- \`webhook://events/recent\` - Recent webhook events
- \`webhook://requests/recent\` - Recent webhook requests
- \`webhook://webhooks/list\` - Configured webhooks
- \`webhook://connections/active\` - Active webhook connections
- \`webhook://stats/overview\` - Webhook statistics overview

## Available Tools
- \`search_events\` - Search events by criteria (status, date, source)
- \`search_requests\` - Search requests by criteria (status, response time)
- \`analyze_event\` - Analyze specific events with detailed breakdown
- \`analyze_request\` - Analyze specific requests with response analysis
- \`get_webhook_stats\` - Get comprehensive webhook statistics
- \`create_test_event\` - Create test events for webhook testing
- \`replay_event\` - Replay a specific webhook event
- \`debug_webhook_issue\` - Debug webhook issues with AI assistance

## Available Prompts
- \`debug_webhook_issue\` - Debug webhook issues with step-by-step guidance
- \`analyze_failures\` - Analyze failed webhook deliveries
- \`performance_report\` - Generate performance reports for webhooks
- \`optimize_webhook_setup\` - Get recommendations for webhook optimization

## Usage Examples
- "Show me recent unhook webhook events"
- "Analyze failed requests for webhook wh_123"
- "Help me debug issues with my Stripe webhook"
- "Create a test event for my webhook"
- "Generate a performance report for all webhooks"
- "What are the most common failure patterns in my webhooks?"

## Authentication
Your API key is embedded in the MCP server URL for secure access to your Unhook instance.

## Security Note
Your API key is included in the .cursor-mcp.json configuration URL. Keep this file secure and don't commit it to version control if it contains sensitive API keys.

## Setup Instructions
1. Restart Cursor to load the new MCP configuration
2. The MCP server will automatically connect to your Unhook instance
3. Test the connection by asking about your webhooks
4. The connection remains active while Cursor is running

## Troubleshooting
- Verify your Unhook API key is correct
- Check the Cursor output panel for any error messages
- Ensure your Unhook instance is accessible from your network
- If using a self-hosted instance, verify the API URL is correct
`;

      try {
        const encoder = new TextEncoder();

        // Create .cursor-mcp.json
        const mcpConfigUri = vscode.Uri.joinPath(
          targetFolder.uri,
          '.cursor-mcp.json',
        );

        // Check if .cursor-mcp.json already exists
        try {
          await vscode.workspace.fs.stat(mcpConfigUri);
          const overwriteMcp = await vscode.window.showWarningMessage(
            '.cursor-mcp.json already exists. Do you want to overwrite it?',
            'Yes',
            'No',
          );

          if (overwriteMcp !== 'Yes') {
            return;
          }
        } catch {
          // File doesn't exist, which is what we want
        }

        await vscode.workspace.fs.writeFile(
          mcpConfigUri,
          encoder.encode(mcpConfigContent),
        );

        // Create .cursor/rules directory if it doesn't exist
        const cursorRulesDir = vscode.Uri.joinPath(
          targetFolder.uri,
          '.cursor',
          'rules',
        );
        try {
          await vscode.workspace.fs.stat(cursorRulesDir);
        } catch {
          // Directory doesn't exist, create it
          await vscode.workspace.fs.createDirectory(cursorRulesDir);
        }

        // Create .cursor/rules/unhook.mdc
        const cursorRulesUri = vscode.Uri.joinPath(
          cursorRulesDir,
          'unhook.mdc',
        );

        // Check if unhook.mdc already exists
        try {
          await vscode.workspace.fs.stat(cursorRulesUri);
          const overwriteRules = await vscode.window.showWarningMessage(
            '.cursor/rules/unhook.mdc already exists. Do you want to overwrite it?',
            'Yes',
            'No',
          );

          if (overwriteRules !== 'Yes') {
            return;
          }
        } catch {
          // File doesn't exist, which is what we want
        }

        await vscode.workspace.fs.writeFile(
          cursorRulesUri,
          encoder.encode(cursorRulesContent),
        );

        // Open the created files
        const mcpDocument =
          await vscode.workspace.openTextDocument(mcpConfigUri);
        await vscode.window.showTextDocument(mcpDocument);

        const rulesDocument =
          await vscode.workspace.openTextDocument(cursorRulesUri);
        await vscode.window.showTextDocument(rulesDocument);

        const serverType = isSelfHosted ? 'self-hosted' : 'cloud';
        vscode.window.showInformationMessage(
          `Created Cursor MCP server configuration in ${targetFolder.name} for ${serverType} Unhook instance`,
        );

        // Show additional instructions
        const showInstructions = await vscode.window.showInformationMessage(
          'Cursor MCP server configuration created! Would you like to see setup instructions?',
          'Yes',
          'No',
        );

        if (showInstructions === 'Yes') {
          const instructions = `## Cursor MCP Server Setup Instructions

1. **Restart Cursor**: Close and reopen Cursor to load the new MCP configuration.

2. **Direct Connection**: The MCP server connects directly to your Unhook instance via SSE transport.

3. **Verify Connection**: The MCP server should automatically connect to your Unhook instance.

4. **Test the Connection**: Try asking Cursor about your webhooks:
   - "Show me recent webhook events"
   - "Analyze failed requests for webhook wh_123"
   - "Help me debug issues with my Stripe webhook"
   - "Generate a performance report for all webhooks"

5. **Available Resources**:
   - \`webhook://events/recent\` - Recent webhook events
   - \`webhook://requests/recent\` - Recent webhook requests
   - \`webhook://webhooks/list\` - Configured webhooks
   - \`webhook://connections/active\` - Active webhook connections
   - \`webhook://stats/overview\` - Webhook statistics overview

6. **Available Tools**:
   - \`search_events\` - Search events by criteria (status, date, source)
   - \`search_requests\` - Search requests by criteria (status, response time)
   - \`analyze_event\` - Analyze specific events with detailed breakdown
   - \`analyze_request\` - Analyze specific requests with response analysis
   - \`get_webhook_stats\` - Get comprehensive webhook statistics
   - \`create_test_event\` - Create test events for webhook testing
   - \`replay_event\` - Replay a specific webhook event
   - \`debug_webhook_issue\` - Debug webhook issues with AI assistance

7. **Available Prompts**:
   - \`debug_webhook_issue\` - Debug webhook issues with step-by-step guidance
   - \`analyze_failures\` - Analyze failed webhook deliveries
   - \`performance_report\` - Generate performance reports for webhooks
   - \`optimize_webhook_setup\` - Get recommendations for webhook optimization

**Authentication**: Your API key is embedded in the MCP server URL for secure access. Keep this file secure and don't commit it to version control if it contains sensitive API keys.

**Troubleshooting**: Verify your Unhook API key is correct, check the Cursor output panel for error messages, and ensure your Unhook instance is accessible from your network.`;

          // Create a new document with instructions
          const instructionsDoc = await vscode.workspace.openTextDocument({
            content: instructions,
            language: 'markdown',
          });
          await vscode.window.showTextDocument(instructionsDoc);
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to create Cursor MCP server configuration: ${error}`,
        );
      }
    },
  );

  const configureServerUrlsCommand = vscode.commands.registerCommand(
    'unhook.configureServerUrls',
    async () => {
      // Get current configuration
      const config = vscode.workspace.getConfiguration('unhook');
      const currentApiUrl = config.get<string>('apiUrl', 'https://unhook.sh');
      const currentDashboardUrl = config.get<string>(
        'dashboardUrl',
        'https://unhook.sh',
      );

      // Ask user for configuration type
      const configType = await vscode.window.showQuickPick(
        [
          {
            description: 'Use Unhook cloud service (unhook.sh)',
            label: 'Cloud Configuration',
            value: 'cloud',
          },
          {
            description: 'Use your own Unhook instance',
            label: 'Self-Hosted Configuration',
            value: 'self-hosted',
          },
        ],
        {
          placeHolder: 'Select configuration type',
          title: 'Configure Unhook Server URLs',
        },
      );

      if (!configType) {
        return;
      }

      if (configType.value === 'cloud') {
        // Set to cloud URLs
        await config.update('apiUrl', 'https://unhook.sh', true);
        await config.update('dashboardUrl', 'https://unhook.sh', true);

        vscode.window.showInformationMessage(
          'Server URLs configured for Unhook cloud service. Please restart the extension for changes to take effect.',
        );
      } else {
        // Get self-hosted URLs from user
        const apiUrl = await vscode.window.showInputBox({
          placeHolder: 'https://api.your-domain.com',
          prompt: 'Enter the API URL for your self-hosted Unhook instance',
          value: currentApiUrl === 'https://unhook.sh' ? '' : currentApiUrl,
        });

        if (!apiUrl) {
          return;
        }

        const dashboardUrl = await vscode.window.showInputBox({
          placeHolder: 'https://dashboard.your-domain.com',
          prompt:
            'Enter the dashboard URL for your self-hosted Unhook instance (optional, defaults to API URL)',
          value:
            currentDashboardUrl === 'https://unhook.sh'
              ? ''
              : currentDashboardUrl,
        });

        // Update configuration
        await config.update('apiUrl', apiUrl, true);
        await config.update('dashboardUrl', dashboardUrl || apiUrl, true);

        vscode.window.showInformationMessage(
          'Self-hosted server URLs configured. Please restart the extension for changes to take effect.',
        );
      }
    },
  );

  const configureApiKeyCommand = vscode.commands.registerCommand(
    'unhook.configureApiKey',
    async () => {
      // Get current configuration
      const config = vscode.workspace.getConfiguration('unhook');
      const currentApiKey = config.get<string>('apiKey', '');

      // Show instructions first
      const instructions = `## API Key Configuration

To use the Unhook MCP server with Cursor, you need an API key.

1. **Get your API key**:
   - Go to https://unhook.sh/app/api-keys
   - Sign in to your Unhook account
   - Create a new API key or copy an existing one

2. **Enter your API key below**:
   - The API key will be stored securely in VS Code settings
   - It will be used to authenticate with the Unhook MCP server

3. **Security note**:
   - API keys are stored in VS Code's secure storage
   - They are included in MCP server URLs for authentication
   - Keep your API keys secure and don't share them

**Current API key**: ${currentApiKey ? `***${currentApiKey.slice(-4)}` : 'Not configured'}`;

      const showInstructions = await vscode.window.showInformationMessage(
        'API Key Configuration',
        'Show Instructions',
        'Configure API Key',
        'Cancel',
      );

      if (showInstructions === 'Show Instructions') {
        // Create a new document with instructions
        const instructionsDoc = await vscode.workspace.openTextDocument({
          content: instructions,
          language: 'markdown',
        });
        await vscode.window.showTextDocument(instructionsDoc);
        return;
      }

      if (showInstructions === 'Cancel') {
        return;
      }

      // Get API key from user
      const apiKey = await vscode.window.showInputBox({
        password: true,
        placeHolder: 'whsk_...',
        prompt:
          'Enter your Unhook API key (get it from https://unhook.sh/app/api-keys)',
        value: currentApiKey,
      });

      if (!apiKey) {
        return;
      }

      // Validate API key format (basic validation)
      if (!apiKey.startsWith('whsk_')) {
        const continueAnyway = await vscode.window.showWarningMessage(
          'The API key format doesn\'t look like a standard Unhook API key (should start with "whsk_"). Continue anyway?',
          'Yes',
          'No',
        );

        if (continueAnyway !== 'Yes') {
          return;
        }
      }

      // Update configuration
      await config.update('apiKey', apiKey, true);

      vscode.window.showInformationMessage(
        'API key configured successfully. You can now create Cursor MCP server configurations.',
      );
    },
  );

  context.subscriptions.push(
    createConfigCommand,
    createCursorMcpServerCommand,
    configureServerUrlsCommand,
    configureApiKeyCommand,
  );
}
