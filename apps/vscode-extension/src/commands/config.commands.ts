import * as vscode from 'vscode';

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

export function registerConfigCommands(context: vscode.ExtensionContext) {
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

  context.subscriptions.push(createConfigCommand);
}
