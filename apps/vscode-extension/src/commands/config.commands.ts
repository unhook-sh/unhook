import * as vscode from 'vscode';
import type { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';
import type { FirstTimeUserService } from '../services/first-time-user.service';
import { createConfigContentWithSpecificWebhookId } from '../utils/config-templates';

export function registerConfigCommands(
  context: vscode.ExtensionContext,
  authStore?: AuthStore,
  analyticsService?: AnalyticsService,
  firstTimeUserService?: FirstTimeUserService,
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

      // Check if user is signed in and has webhooks
      if (!authStore?.isSignedIn) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook before creating a configuration file.',
        );
        return;
      }

      // Fetch available webhooks for the user to choose from
      let webhooks: Array<{
        id: string;
        name: string;
        createdAt: Date | null;
      }> = [];
      let selectedWebhookId: string | undefined;

      try {
        webhooks = await authStore.api.webhooks.all.query();
        console.log('Available webhooks:', webhooks);
      } catch (error) {
        console.error('Failed to fetch webhooks:', error);
        vscode.window.showErrorMessage(
          'Failed to fetch your webhooks. Please try again or sign in again.',
        );
        return;
      }

      if (!webhooks || webhooks.length === 0) {
        // No webhooks available, offer to create one
        const createWebhook = await vscode.window.showInformationMessage(
          'No webhooks found in your account. Would you like to create one first?',
          'Yes, Create Webhook',
          'No, Use Default',
        );

        if (createWebhook === 'Yes, Create Webhook') {
          // Execute the create webhook command
          await vscode.commands.executeCommand('unhook.createWebhook');
          return; // Exit this command, let the create webhook command handle everything
        }

        // Use default webhook ID
        selectedWebhookId = 'wh_example';
      } else {
        // Let user choose from available webhooks
        const webhookOptions = [
          ...webhooks.map((webhook) => ({
            description: `ID: ${webhook.id} • Created: ${webhook.createdAt ? new Date(webhook.createdAt).toLocaleDateString() : 'Unknown'}`,
            isExisting: true,
            label: webhook.name || 'Unnamed Webhook',
            webhookId: webhook.id,
          })),
          {
            description: 'Create a new webhook for this workspace',
            isExisting: false,
            label: '➕ Create New Webhook',
            webhookId: 'create_new',
          },
        ];

        const webhookPick = await vscode.window.showQuickPick(webhookOptions, {
          placeHolder: 'Select a webhook to configure or create a new one',
          title: 'Choose Webhook for Configuration',
        });

        if (!webhookPick) {
          return; // User cancelled
        }

        if (webhookPick.isExisting) {
          // User selected an existing webhook
          selectedWebhookId = webhookPick.webhookId;
        } else {
          // User wants to create a new webhook
          console.log('User chose to create a new webhook');

          // Execute the create webhook command with autoCreateConfig flag
          await vscode.commands.executeCommand('unhook.createWebhook', true);
          return; // Exit this method, let the create webhook command handle everything
        }
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

      // Create the configuration content using the selected webhook ID
      const configContent =
        createConfigContentWithSpecificWebhookId(selectedWebhookId);

      try {
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(
          configUri,
          encoder.encode(configContent),
        );

        // Open the created file
        const document = await vscode.workspace.openTextDocument(configUri);
        await vscode.window.showTextDocument(document);

        // Track config file creation
        analyticsService?.track('config_file_created', {
          filename: filename,
          has_webhook_id: true,
          webhook_id: selectedWebhookId,
          workspace: targetFolder.name,
        });

        vscode.window.showInformationMessage(
          `Created ${filename} in ${targetFolder.name} with webhook ID: ${selectedWebhookId}`,
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

        // Track server URL configuration
        analyticsService?.track('server_urls_configured', {
          api_url: 'https://unhook.sh',
          dashboard_url: 'https://unhook.sh',
          type: 'cloud',
        });

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

        // Track server URL configuration
        analyticsService?.track('server_urls_configured', {
          api_url: apiUrl,
          dashboard_url: dashboardUrl || apiUrl,
          type: 'self_hosted',
        });

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

  const triggerFirstTimePromptsCommand = vscode.commands.registerCommand(
    'unhook.triggerFirstTimePrompts',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.forceShowFirstTimePrompts();
        vscode.window.showInformationMessage(
          'First-time prompts triggered successfully.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot trigger prompts.',
        );
      }
    },
  );

  const checkFirstTimeStatusCommand = vscode.commands.registerCommand(
    'unhook.checkFirstTimeStatus',
    async () => {
      if (firstTimeUserService) {
        const isFirstTime = await firstTimeUserService.isFirstTimeUser();
        const hasConfig = await firstTimeUserService.hasConfigurationFile();
        const shouldShow =
          await firstTimeUserService.shouldShowWorkspaceConfigPrompts();

        const message = `Workspace config status:
• Is first-time user: ${isFirstTime}
• Has configuration file: ${hasConfig}
• Should show workspace config prompts: ${shouldShow}`;

        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot check status.',
        );
      }
    },
  );

  const resetFirstTimeStateCommand = vscode.commands.registerCommand(
    'unhook.resetFirstTimeState',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.resetFirstTimeUserState();
        vscode.window.showInformationMessage(
          'First-time user state reset successfully.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot reset state.',
        );
      }
    },
  );

  const markAsExistingUserCommand = vscode.commands.registerCommand(
    'unhook.markAsExistingUser',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.markAsExistingUser();
        vscode.window.showInformationMessage(
          'User marked as existing user successfully.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot mark user.',
        );
      }
    },
  );

  const checkConfigFileCommand = vscode.commands.registerCommand(
    'unhook.checkConfigFile',
    async () => {
      if (firstTimeUserService) {
        const hasConfig = await firstTimeUserService.hasConfigurationFile();
        const message = hasConfig
          ? 'Configuration file found in workspace.'
          : 'No configuration file found in workspace.';

        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot check config file.',
        );
      }
    },
  );

  const autoMarkAsExistingUserCommand = vscode.commands.registerCommand(
    'unhook.autoMarkAsExistingUser',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.markAsExistingUserIfHasConfig();
        vscode.window.showInformationMessage(
          'Auto-marked user as existing user if configuration file exists.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot mark user.',
        );
      }
    },
  );

  const checkAndShowFirstTimePromptsCommand = vscode.commands.registerCommand(
    'unhook.checkAndShowFirstTimePrompts',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.checkAndShowWorkspaceConfigPromptsIfNeeded();
        vscode.window.showInformationMessage(
          'Checked and showed workspace config prompts if needed.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot check prompts.',
        );
      }
    },
  );

  const checkWorkspaceStatusCommand = vscode.commands.registerCommand(
    'unhook.checkWorkspaceStatus',
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showInformationMessage('No workspace folders open.');
        return;
      }

      let message = 'Workspace status:\n';
      for (const folder of workspaceFolders) {
        message += `• ${folder.name}: ${folder.uri.fsPath}\n`;
      }

      if (firstTimeUserService) {
        const hasConfig = await firstTimeUserService.hasConfigurationFile();
        message += `\nConfiguration file: ${hasConfig ? 'Found' : 'Not found'}`;
      }

      vscode.window.showInformationMessage(message);
    },
  );

  const shouldShowPromptsCommand = vscode.commands.registerCommand(
    'unhook.shouldShowPrompts',
    async () => {
      if (firstTimeUserService) {
        const shouldShow =
          await firstTimeUserService.shouldShowWorkspaceConfigPrompts();
        const message = shouldShow
          ? 'Workspace config prompts should be shown.'
          : 'Workspace config prompts should NOT be shown.';

        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot check prompt status.',
        );
      }
    },
  );

  const checkAnalyticsConsentCommand = vscode.commands.registerCommand(
    'unhook.checkAnalyticsConsent',
    async () => {
      if (firstTimeUserService) {
        const hasAsked =
          await firstTimeUserService.hasAskedForAnalyticsConsent();
        const message = hasAsked
          ? 'Analytics consent has been asked for.'
          : 'Analytics consent has NOT been asked for.';

        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot check analytics consent.',
        );
      }
    },
  );

  const checkWebhooksCommand = vscode.commands.registerCommand(
    'unhook.checkWebhooks',
    async () => {
      if (firstTimeUserService) {
        const hasWebhooks = await firstTimeUserService.hasWebhooks();
        const message = hasWebhooks
          ? 'User has webhooks available.'
          : 'User has no webhooks available.';

        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot check webhooks.',
        );
      }
    },
  );

  const checkOverallStatusCommand = vscode.commands.registerCommand(
    'unhook.checkOverallStatus',
    async () => {
      if (firstTimeUserService) {
        const isFirstTime = await firstTimeUserService.isFirstTimeUser();
        const hasConfig = await firstTimeUserService.hasConfigurationFile();
        const hasWebhooks = await firstTimeUserService.hasWebhooks();
        const shouldShow =
          await firstTimeUserService.shouldShowWorkspaceConfigPrompts();
        const doNotShowAgain =
          await firstTimeUserService.getDoNotShowWorkspaceConfigPromptsStatus();

        const message = `Overall status:
  • Is first-time user: ${isFirstTime}
  • Has configuration file: ${hasConfig}
  • Has webhooks: ${hasWebhooks}
  • Should show workspace config prompts: ${shouldShow}
  • Do not show again (workspace config): ${doNotShowAgain}`;

        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot check overall status.',
        );
      }
    },
  );

  const checkApiKeyStatusCommand = vscode.commands.registerCommand(
    'unhook.checkApiKeyStatus',
    async () => {
      if (!authStore?.isSignedIn) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook before checking API key status.',
        );
        return;
      }

      try {
        // Check if we can access API keys
        const apiKeys = await authStore.api.apiKeys.all.query();

        if (!apiKeys || apiKeys.length === 0) {
          vscode.window.showInformationMessage(
            'No API keys found. You need to create an API key to create webhooks.',
          );

          const createApiKey = await vscode.window.showInformationMessage(
            'Would you like to create an API key now?',
            'Yes, Create API Key',
            "No, I'll create one manually",
          );

          if (createApiKey === 'Yes, Create API Key') {
            try {
              const newApiKey = await authStore.api.apiKeys.create.mutate({
                isActive: true,
                name: 'VS Code Extension - Auto Generated',
              });

              if (newApiKey) {
                vscode.window.showInformationMessage(
                  `API key created successfully! ID: ${newApiKey.id}`,
                );
              } else {
                vscode.window.showErrorMessage(
                  'Failed to create API key. Please create one manually at https://unhook.sh/app/api-keys',
                );
              }
            } catch (error) {
              vscode.window.showErrorMessage(
                `Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}. Please create one manually at https://unhook.sh/app/api-keys`,
              );
            }
          }
        } else {
          const message = `Found ${apiKeys.length} API key(s):
${apiKeys.map((key, index) => `• ${index + 1}. ${key.name || 'Unnamed'} (${key.id}) - ${key.isActive ? 'Active' : 'Inactive'}`).join('\n')}`;

          vscode.window.showInformationMessage(message);
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to check API key status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  );

  const createApiKeyCommand = vscode.commands.registerCommand(
    'unhook.createApiKey',
    async () => {
      if (!authStore?.isSignedIn) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook before creating an API key.',
        );
        return;
      }

      try {
        // Prompt for API key name
        const apiKeyName = await vscode.window.showInputBox({
          placeHolder: 'Enter API key name (e.g., "VS Code Extension")',
          prompt: 'What would you like to name your API key?',
          value: 'VS Code Extension',
        });

        if (!apiKeyName) {
          return;
        }

        // Show progress indicator
        await vscode.window.withProgress(
          {
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
            title: 'Creating API key...',
          },
          async () => {
            const newApiKey = await authStore.api.apiKeys.create.mutate({
              isActive: true,
              name: apiKeyName,
            });

            if (newApiKey) {
              // Track successful API key creation
              analyticsService?.track('api_key_created', {
                api_key_id: newApiKey.id,
                api_key_name: apiKeyName,
              });

              vscode.window.showInformationMessage(
                `API key "${apiKeyName}" created successfully! ID: ${newApiKey.id}`,
              );
            } else {
              throw new Error('API key creation returned null/undefined');
            }
          },
        );
      } catch (error) {
        console.error('Failed to create API key:', error);

        // Track API key creation failure
        analyticsService?.track('api_key_creation_failed', {
          api_key_name: 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        vscode.window.showErrorMessage(
          `Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  );

  const testWebhookCreationCommand = vscode.commands.registerCommand(
    'unhook.testWebhookCreation',
    async () => {
      if (!authStore?.isSignedIn) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook before testing webhook creation.',
        );
        return;
      }

      try {
        // Show progress indicator
        await vscode.window.withProgress(
          {
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
            title: 'Testing webhook creation process...',
          },
          async () => {
            let step = 1;

            // Step 1: Check authentication
            vscode.window.showInformationMessage(
              `Step ${step++}: Checking authentication...`,
            );
            const authTest = await authStore.api.auth.verifySessionToken.query({
              sessionId: authStore.sessionId || '',
              sessionTemplate: 'cli',
            });
            console.log('Auth test result:', authTest);

            // Step 2: Fetch API keys
            vscode.window.showInformationMessage(
              `Step ${step++}: Fetching API keys...`,
            );
            const apiKeys = await authStore.api.apiKeys.all.query();
            console.log('API keys result:', apiKeys);

            if (!apiKeys || apiKeys.length === 0) {
              throw new Error('No API keys found');
            }

            const apiKey = apiKeys[0];
            if (!apiKey) {
              throw new Error('Failed to get first API key');
            }

            vscode.window.showInformationMessage(
              `Step ${step++}: Using API key ${apiKey.id}...`,
            );

            // Step 3: Verify API key exists
            vscode.window.showInformationMessage(
              `Step ${step++}: Verifying API key...`,
            );
            const apiKeyVerification = await authStore.api.apiKeys.byId.query({
              id: apiKey.id,
            });
            console.log('API key verification result:', apiKeyVerification);

            if (!apiKeyVerification) {
              throw new Error(
                `API key ${apiKey.id} not found during verification`,
              );
            }

            // Step 4: Test webhook creation payload
            vscode.window.showInformationMessage(
              `Step ${step++}: Testing webhook creation...`,
            );
            const testPayload = {
              apiKeyId: apiKey.id,
              config: {
                headers: {},
                requests: {},
                storage: {
                  maxRequestBodySize: 1024 * 1024,
                  maxResponseBodySize: 1024 * 1024,
                  storeHeaders: true,
                  storeRequestBody: true,
                  storeResponseBody: true,
                },
              },
              name: 'Test Webhook - VS Code Extension',
              status: 'active' as const,
            };

            console.log(
              'Test webhook creation payload:',
              JSON.stringify(testPayload, null, 2),
            );

            const webhook =
              await authStore.api.webhooks.create.mutate(testPayload);
            console.log('Webhook creation result:', webhook);

            if (webhook) {
              vscode.window.showInformationMessage(
                `✅ Webhook creation test successful! Created webhook: ${webhook.id}`,
              );

              // Clean up the test webhook
              try {
                await authStore.api.webhooks.delete.mutate({ id: webhook.id });
                vscode.window.showInformationMessage(
                  'Test webhook cleaned up successfully.',
                );
              } catch (cleanupError) {
                console.warn('Failed to cleanup test webhook:', cleanupError);
              }
            } else {
              throw new Error('Webhook creation returned null/undefined');
            }
          },
        );
      } catch (error) {
        console.error('Webhook creation test failed:', error);
        vscode.window.showErrorMessage(
          `Webhook creation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  );

  const debugApiKeyIssueCommand = vscode.commands.registerCommand(
    'unhook.debugApiKeyIssue',
    async () => {
      if (!authStore?.isSignedIn) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook before debugging API key issues.',
        );
        return;
      }

      try {
        // Show progress indicator
        await vscode.window.withProgress(
          {
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
            title: 'Debugging API key issue...',
          },
          async () => {
            console.log('=== API Key Debug Session ===');
            console.log('Auth store state:', {
              authToken: authStore.authToken,
              isSignedIn: authStore.isSignedIn,
              sessionId: authStore.sessionId,
            });

            let step = 1;

            // Step 1: Check authentication
            console.log('Step 1: Checking authentication...');
            const authTest = await authStore.api.auth.verifySessionToken.query({
              sessionId: authStore.sessionId || '',
              sessionTemplate: 'cli',
            });
            console.log('Auth test result:', authTest);

            // Step 2: Fetch API keys
            vscode.window.showInformationMessage(
              `Step ${step++}: Fetching API keys...`,
            );
            const apiKeys = await authStore.api.apiKeys.all.query();
            console.log('API keys result:', apiKeys);
            console.log('API keys count:', apiKeys?.length);
            console.log('First API key:', apiKeys?.[0]);

            if (!apiKeys || apiKeys.length === 0) {
              throw new Error('No API keys found');
            }

            const apiKey = apiKeys[0];
            if (!apiKey) {
              throw new Error('Failed to get first API key');
            }

            vscode.window.showInformationMessage(
              `Step ${step++}: Using API key ${apiKey.id}...`,
            );

            // Step 3: Verify API key exists
            vscode.window.showInformationMessage(
              `Step ${step++}: Verifying API key...`,
            );
            const apiKeyVerification = await authStore.api.apiKeys.byId.query({
              id: apiKey.id,
            });
            console.log('API key verification result:', apiKeyVerification);

            if (!apiKeyVerification) {
              throw new Error(
                `API key ${apiKey.id} not found during verification`,
              );
            }

            // Step 4: Test webhook creation with minimal payload
            vscode.window.showInformationMessage(
              `Step ${step++}: Testing webhook creation...`,
            );
            const minimalPayload = {
              apiKeyId: apiKey.id,
              name: 'Debug Test Webhook',
            };

            console.log(
              'Minimal webhook creation payload:',
              JSON.stringify(minimalPayload, null, 2),
            );

            const webhook =
              await authStore.api.webhooks.create.mutate(minimalPayload);
            console.log('Webhook creation result:', webhook);

            if (webhook) {
              vscode.window.showInformationMessage(
                `✅ Debug test successful! Created webhook: ${webhook.id}`,
              );

              // Clean up the test webhook
              try {
                await authStore.api.webhooks.delete.mutate({ id: webhook.id });
                console.log('Test webhook cleaned up successfully.');
              } catch (cleanupError) {
                console.warn('Failed to cleanup test webhook:', cleanupError);
              }
            } else {
              throw new Error('Webhook creation returned null/undefined');
            }

            console.log('=== Debug Session Complete ===');
          },
        );
      } catch (error) {
        console.error('API key debug failed:', error);
        vscode.window.showErrorMessage(
          `API key debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  );

  const testWebhookSelectionCommand = vscode.commands.registerCommand(
    'unhook.testWebhookSelection',
    async () => {
      if (!authStore?.isSignedIn) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook before testing webhook selection.',
        );
        return;
      }

      try {
        // Fetch available webhooks
        const webhooks = await authStore.api.webhooks.all.query();
        console.log('Available webhooks:', webhooks);

        if (!webhooks || webhooks.length === 0) {
          vscode.window.showInformationMessage(
            'No webhooks found. You can create one using "Unhook: Create New Webhook".',
          );
          return;
        }

        // Create webhook selection options with "Create New Webhook" option
        const webhookOptions = [
          ...webhooks.map((webhook) => ({
            description: `ID: ${webhook.id} • Created: ${webhook.createdAt ? new Date(webhook.createdAt).toLocaleDateString() : 'Unknown'}`,
            isExisting: true,
            label: webhook.name || 'Unnamed Webhook',
            webhookId: webhook.id,
          })),
          {
            description: 'Create a new webhook for this workspace',
            isExisting: false,
            label: '➕ Create New Webhook',
            webhookId: 'create_new',
          },
        ];

        const webhookPick = await vscode.window.showQuickPick(webhookOptions, {
          placeHolder: 'Select a webhook to configure or create a new one',
          title: 'Test Webhook Selection Interface',
        });

        if (!webhookPick) {
          vscode.window.showInformationMessage('Webhook selection cancelled.');
          return;
        }

        if (webhookPick.isExisting) {
          vscode.window.showInformationMessage(
            `Selected existing webhook: ${webhookPick.label} (${webhookPick.webhookId})`,
          );
        } else {
          vscode.window.showInformationMessage(
            'Selected to create new webhook. Opening webhook creation...',
          );

          // Execute the create webhook command
          await vscode.commands.executeCommand('unhook.createWebhook');
        }
      } catch (error) {
        console.error('Webhook selection test failed:', error);
        vscode.window.showErrorMessage(
          `Webhook selection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  );

  const doNotShowAgainCommand = vscode.commands.registerCommand(
    'unhook.doNotShowWorkspaceConfigPrompts',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.markDoNotShowWorkspaceConfigPrompts();
        vscode.window.showInformationMessage(
          'Workspace config prompts will no longer appear. You can reset this preference anytime.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot update preference.',
        );
      }
    },
  );

  const resetDoNotShowAgainCommand = vscode.commands.registerCommand(
    'unhook.resetDoNotShowWorkspaceConfigPrompts',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.resetDoNotShowWorkspaceConfigPrompts();
        vscode.window.showInformationMessage(
          'Workspace config prompts will now appear again when needed.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot reset preference.',
        );
      }
    },
  );

  const checkDoNotShowAgainStatusCommand = vscode.commands.registerCommand(
    'unhook.checkDoNotShowAgainStatus',
    async () => {
      if (firstTimeUserService) {
        const doNotShowAgain =
          await firstTimeUserService.getDoNotShowWorkspaceConfigPromptsStatus();
        const message = doNotShowAgain
          ? 'Workspace config prompts are currently disabled (user chose "do not show again").'
          : 'Workspace config prompts are enabled and will show when needed.';

        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot check preference status.',
        );
      }
    },
  );

  const resetPromptFlagsCommand = vscode.commands.registerCommand(
    'unhook.resetPromptFlags',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.resetPromptFlags();
        vscode.window.showInformationMessage(
          'Prompt flags reset. This may help with duplicate prompt issues.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot reset prompt flags.',
        );
      }
    },
  );

  const triggerFirstTimePromptsIfNeededCommand =
    vscode.commands.registerCommand(
      'unhook.triggerFirstTimePromptsIfNeeded',
      async () => {
        if (firstTimeUserService) {
          await firstTimeUserService.checkAndShowWorkspaceConfigPromptsIfNeeded();
          vscode.window.showInformationMessage(
            'Workspace config prompts checked and shown if needed.',
          );
        } else {
          vscode.window.showErrorMessage(
            'FirstTimeUserService not initialized. Cannot trigger prompts.',
          );
        }
      },
    );

  const askAnalyticsConsentCommand = vscode.commands.registerCommand(
    'unhook.askAnalyticsConsent',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.promptForAnalyticsConsent();
        vscode.window.showInformationMessage(
          'Analytics consent prompt completed.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot ask for analytics consent.',
        );
      }
    },
  );

  const askUnhookYmlCreationCommand = vscode.commands.registerCommand(
    'unhook.askUnhookYmlCreation',
    async () => {
      if (firstTimeUserService) {
        await firstTimeUserService.promptForWorkspaceConfigCreation();
        vscode.window.showInformationMessage(
          'Workspace config creation prompt completed.',
        );
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot ask for workspace config creation.',
        );
      }
    },
  );

  const checkPromptStateCommand = vscode.commands.registerCommand(
    'unhook.checkPromptState',
    async () => {
      if (firstTimeUserService) {
        const promptState = firstTimeUserService.getPromptState();
        const message = `Prompt state:
  • Is showing prompts: ${promptState.isShowingPrompts}
  • Has timeout: ${promptState.hasTimeout}`;

        vscode.window.showInformationMessage(message);
        console.log('Prompt state:', promptState);
      } else {
        vscode.window.showErrorMessage(
          'FirstTimeUserService not initialized. Cannot check prompt state.',
        );
      }
    },
  );

  context.subscriptions.push(
    createConfigCommand,
    createCursorMcpServerCommand,
    configureServerUrlsCommand,
    configureApiKeyCommand,
    triggerFirstTimePromptsCommand,
    checkFirstTimeStatusCommand,
    resetFirstTimeStateCommand,
    markAsExistingUserCommand,
    checkConfigFileCommand,
    autoMarkAsExistingUserCommand,
    checkAndShowFirstTimePromptsCommand,
    checkWorkspaceStatusCommand,
    shouldShowPromptsCommand,
    checkAnalyticsConsentCommand,
    checkWebhooksCommand,
    checkOverallStatusCommand,
    triggerFirstTimePromptsIfNeededCommand,
    askAnalyticsConsentCommand,
    askUnhookYmlCreationCommand,
    checkApiKeyStatusCommand,
    createApiKeyCommand,
    testWebhookCreationCommand,
    debugApiKeyIssueCommand,
    testWebhookSelectionCommand,
    doNotShowAgainCommand,
    resetDoNotShowAgainCommand,
    checkDoNotShowAgainStatusCommand,
    resetPromptFlagsCommand,
    checkPromptStateCommand,
  );
}
