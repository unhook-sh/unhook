import { debug } from '@unhook/logger';
import * as vscode from 'vscode';

const log = debug('unhook:vscode:first-time-user');

const FIRST_TIME_USER_KEY = 'unhook.firstTimeUser';
const UNHOOK_YML_TEMPLATE = `# Unhook Configuration
# Documentation: https://unhook.sh/docs/configuration

# Your webhook ID (required)
webhookId: "YOUR_WEBHOOK_ID"

# Client ID to identify this environment (optional)
# clientId: "development"

# Debug mode (optional)
# debug: false

# Webhook destinations
destination:
  - name: local
    url: http://localhost:3000
    # Optional: Ping endpoint to check if service is running
    # ping: http://localhost:3000/health

# Delivery rules
delivery:
  - destination: local

# Optional: Self-hosted server configuration
# server:
#   apiUrl: https://your-unhook-server.com
#   dashboardUrl: https://your-unhook-dashboard.com
`;

export class FirstTimeUserService {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async isFirstTimeUser(): Promise<boolean> {
    const isFirstTime =
      this.context.globalState.get<boolean>(FIRST_TIME_USER_KEY);
    // If the key doesn't exist, it's a first-time user
    return isFirstTime === undefined || isFirstTime === true;
  }

  async markAsExistingUser(): Promise<void> {
    await this.context.globalState.update(FIRST_TIME_USER_KEY, false);
    log('Marked user as existing user');
  }

  async promptForUnhookYmlCreation(): Promise<void> {
    const result = await vscode.window.showInformationMessage(
      'Welcome to Unhook! Would you like to create an unhook.yml configuration file to get started?',
      'Yes, Create File',
      'No, Thanks',
      'Learn More',
    );

    switch (result) {
      case 'Yes, Create File':
        await this.createUnhookYml();
        break;
      case 'Learn More':
        await vscode.env.openExternal(
          vscode.Uri.parse('https://unhook.sh/docs/configuration'),
        );
        break;
      default:
        // User chose "No, Thanks" or dismissed the notification
        break;
    }

    // Mark user as existing user after showing the prompt
    await this.markAsExistingUser();
  }

  private async createUnhookYml(): Promise<void> {
    try {
      // Get the workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
          'No workspace folder found. Please open a folder first.',
        );
        return;
      }

      const workspaceRoot = workspaceFolders[0]?.uri;
      if (!workspaceRoot) {
        log('No workspace folder found');
        return;
      }

      const configUri = vscode.Uri.joinPath(workspaceRoot, 'unhook.yml');

      // Check if file already exists
      try {
        await vscode.workspace.fs.stat(configUri);
        const overwrite = await vscode.window.showWarningMessage(
          'unhook.yml already exists. Do you want to overwrite it?',
          'Yes',
          'No',
        );
        if (overwrite !== 'Yes') {
          return;
        }
      } catch {
        // File doesn't exist, which is what we want
      }

      // Write the template file
      const encoder = new TextEncoder();
      await vscode.workspace.fs.writeFile(
        configUri,
        encoder.encode(UNHOOK_YML_TEMPLATE),
      );

      // Open the file in the editor
      const document = await vscode.workspace.openTextDocument(configUri);
      const editor = await vscode.window.showTextDocument(document);

      // Find and select the "YOUR_WEBHOOK_ID" text
      const text = document.getText();
      const webhookIdIndex = text.indexOf('YOUR_WEBHOOK_ID');
      if (webhookIdIndex !== -1) {
        const position = document.positionAt(webhookIdIndex);
        const endPosition = document.positionAt(
          webhookIdIndex + 'YOUR_WEBHOOK_ID'.length,
        );
        editor.selection = new vscode.Selection(position, endPosition);
        editor.revealRange(new vscode.Range(position, endPosition));
      }

      vscode.window.showInformationMessage(
        'Created unhook.yml. Please replace YOUR_WEBHOOK_ID with your actual webhook ID from the Unhook dashboard.',
      );

      log('Created unhook.yml configuration file');
    } catch (error) {
      log('Failed to create unhook.yml', error);
      vscode.window.showErrorMessage(
        `Failed to create unhook.yml: ${(error as Error).message}`,
      );
    }
  }
}
