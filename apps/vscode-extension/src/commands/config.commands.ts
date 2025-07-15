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

      // Choose filename
      const filename = await vscode.window.showQuickPick(
        ['unhook.yml', 'unhook.yaml'],
        {
          placeHolder: 'Select filename',
          title: 'Choose Configuration Filename',
        },
      );

      if (!filename) {
        return;
      }

      if (!targetFolder) {
        return;
      }

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

  const createMcpConfigCommand = vscode.commands.registerCommand(
    'unhook.createMcpConfig',
    async () => {
      // Check if user is signed in
      if (!authStore?.isSignedIn || !authStore.authToken) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook first to create MCP configuration.',
        );
        return;
      }

      // Get the workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
          'Please open a workspace folder before creating MCP configuration.',
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
      const { ConfigManager } = await import('../config.manager');
      const configManager = ConfigManager.getInstance();
      const apiUrl = configManager.getApiUrl();
      const isSelfHosted = configManager.isSelfHosted();

      // Create MCP configuration content
      const mcpConfigContent = `{
  "mcpServers": {
    "unhook": {
      "url": "${apiUrl}/api/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer ${authStore.authToken}"
      }
    }
  }
}`;

      // Create the configuration file
      const configUri = vscode.Uri.joinPath(
        targetFolder.uri,
        '.cursor-mcp.json',
      );

      // Check if file already exists
      try {
        await vscode.workspace.fs.stat(configUri);
        const overwrite = await vscode.window.showWarningMessage(
          '.cursor-mcp.json already exists. Do you want to overwrite it?',
          'Yes',
          'No',
        );

        if (overwrite !== 'Yes') {
          return;
        }
      } catch {
        // File doesn't exist, which is what we want
      }

      try {
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(
          configUri,
          encoder.encode(mcpConfigContent),
        );

        // Open the created file
        const document = await vscode.workspace.openTextDocument(configUri);
        await vscode.window.showTextDocument(document);

        const serverType = isSelfHosted ? 'self-hosted' : 'cloud';
        vscode.window.showInformationMessage(
          `Created .cursor-mcp.json in ${targetFolder.name} for ${serverType} Unhook instance`,
        );

        // Show additional instructions
        const showInstructions = await vscode.window.showInformationMessage(
          'MCP configuration created! Would you like to see setup instructions?',
          'Yes',
          'No',
        );

        if (showInstructions === 'Yes') {
          const instructions = `## Cursor MCP Setup Instructions

1. **Restart Cursor**: Close and reopen Cursor to load the new MCP configuration.

2. **Verify Connection**: The MCP server should automatically connect to your Unhook instance.

3. **Test the Connection**: Try asking Cursor about your webhooks:
   - "Show me recent webhook events"
   - "Analyze failed requests for webhook wh_123"
   - "Help me debug issues with my Stripe webhook"

4. **Available Resources**:
   - \`webhook://events/recent\` - Recent webhook events
   - \`webhook://requests/recent\` - Recent webhook requests
   - \`webhook://webhooks/list\` - Configured webhooks

5. **Available Tools**:
   - \`search_events\` - Search events by criteria
   - \`search_requests\` - Search requests by criteria
   - \`analyze_event\` - Analyze specific events
   - \`analyze_request\` - Analyze specific requests
   - \`get_webhook_stats\` - Get webhook statistics
   - \`create_test_event\` - Create test events

6. **Available Prompts**:
   - \`debug_webhook_issue\` - Debug webhook issues
   - \`analyze_failures\` - Analyze failures
   - \`performance_report\` - Generate performance reports

**Note**: Your authentication token is included in the configuration. Keep this file secure and don't commit it to version control if it contains sensitive tokens.`;

          // Create a new document with instructions
          const instructionsDoc = await vscode.workspace.openTextDocument({
            content: instructions,
            language: 'markdown',
          });
          await vscode.window.showTextDocument(instructionsDoc);
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to create MCP configuration file: ${error}`,
        );
      }
    },
  );

  context.subscriptions.push(createConfigCommand, createMcpConfigCommand);
}
