import * as vscode from 'vscode';
import type { AuthStore } from '../services/auth.service';
import { createConfigContentWithWebhookId } from '../utils/config-templates';

export function registerConfigCommands(
  context: vscode.ExtensionContext,
  authStore?: AuthStore,
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

      // Create the configuration content using the utility
      const configContent = await createConfigContentWithWebhookId(authStore);

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
      // Resolve API key dynamically from the webhook association
      const { ConfigManager } = await import('../config.manager');
      const configManager = ConfigManager.getInstance();
      if (!authStore || !authStore.isSignedIn) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook before setting up the MCP server.',
        );
        return;
      }

      const webhookId = configManager.getConfig()?.webhookId;
      if (!webhookId) {
        vscode.window.showErrorMessage(
          'No webhookId found in your Unhook config. Create an `unhook.yml` first.',
        );
        return;
      }

      const webhook = await authStore.api.webhooks.byId.query({
        id: webhookId,
      });
      if (!webhook) {
        vscode.window.showErrorMessage(
          `Webhook ${webhookId} was not found or you do not have access.`,
        );
        return;
      }

      const apiKeyRecord = await authStore.api.apiKeys.byId.query({
        id: webhook.apiKeyId,
      });
      if (!apiKeyRecord?.key) {
        vscode.window.showErrorMessage(
          'No API key associated with this webhook.',
        );
        return;
      }
      const apiKey = apiKeyRecord.key;

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

      // Prefer programmatic registration via Cursor MCP API
      const serverUrl = `${apiUrl}/api/mcp/sse`;
      const anyVscode = vscode as unknown as {
        cursor?: {
          mcp?: {
            registerServer?: (args: {
              name: string;
              server: { url: string; headers?: Record<string, string> };
            }) => Promise<void>;
          };
        };
      };

      let registeredViaApi = false;
      try {
        if (anyVscode?.cursor?.mcp?.registerServer) {
          await anyVscode.cursor.mcp.registerServer({
            name: 'unhook',
            server: {
              headers: { 'x-api-key': apiKey },
              url: serverUrl,
            },
          });
          registeredViaApi = true;
        }
      } catch (_err) {
        // Fall back to file-based configuration
        registeredViaApi = false;
      }

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

        // If API registration failed or isn't available, update .vscode/mcp.json
        if (!registeredViaApi) {
          const mcpJsonUri = vscode.Uri.joinPath(
            targetFolder.uri,
            '.vscode',
            'mcp.json',
          );

          // Ensure .vscode directory exists
          const vscodeDir = vscode.Uri.joinPath(targetFolder.uri, '.vscode');
          try {
            await vscode.workspace.fs.stat(vscodeDir);
          } catch {
            await vscode.workspace.fs.createDirectory(vscodeDir);
          }

          let mcpConfig: Record<string, unknown> & {
            servers: Record<string, unknown>;
          } = { servers: {} };
          try {
            const existing = await vscode.workspace.fs.readFile(mcpJsonUri);
            const text = new TextDecoder().decode(existing);
            const parsed = JSON.parse(text);
            if (parsed && typeof parsed === 'object') mcpConfig = parsed;
            if (!mcpConfig.servers || typeof mcpConfig.servers !== 'object') {
              mcpConfig.servers = {};
            }
          } catch {
            // No existing file or parse error; start fresh
            mcpConfig = { servers: {} };
          }

          // Write/overwrite the unhook server entry with x-api-key header
          mcpConfig.servers.unhook = {
            headers: { 'x-api-key': apiKey },
            type: 'sse',
            url: serverUrl,
          };

          await vscode.workspace.fs.writeFile(
            mcpJsonUri,
            encoder.encode(JSON.stringify(mcpConfig, null, 2)),
          );
        }

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
        // Open MCP config if file-based fallback was used
        if (!registeredViaApi) {
          const mcpJsonUri = vscode.Uri.joinPath(
            targetFolder.uri,
            '.vscode',
            'mcp.json',
          );
          const mcpDocument =
            await vscode.workspace.openTextDocument(mcpJsonUri);
          await vscode.window.showTextDocument(mcpDocument);
        }

        const rulesDocument =
          await vscode.workspace.openTextDocument(cursorRulesUri);
        await vscode.window.showTextDocument(rulesDocument);

        const serverType = isSelfHosted ? 'self-hosted' : 'cloud';
        vscode.window.showInformationMessage(
          registeredViaApi
            ? `Registered Cursor MCP server (unhook) via API for ${serverType} Unhook instance`
            : `Updated .vscode/mcp.json with Cursor MCP server (unhook) for ${serverType} Unhook instance`,
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
      // Repurposed: run MCP server setup
      await vscode.commands.executeCommand('unhook.createCursorMcpServer');
    },
  );

  context.subscriptions.push(
    createConfigCommand,
    createCursorMcpServerCommand,
    configureServerUrlsCommand,
    configureApiKeyCommand,
  );
}
