import * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';

export function registerWebhookUrlCommands(
  context: vscode.ExtensionContext,
): void {
  // Command to copy webhook URL to clipboard
  const copyWebhookUrlCommand = vscode.commands.registerCommand(
    'unhook.copyWebhookUrl',
    async () => {
      try {
        const configManager = ConfigManager.getInstance();
        const config = configManager.getConfig();

        if (!config || !config.webhookId) {
          vscode.window.showErrorMessage(
            'No webhook ID found in configuration. Please ensure your unhook.yaml file is properly configured.',
          );
          return;
        }

        // Construct the webhook URL
        const apiUrl = configManager.getApiUrl();
        const webhookUrl = `${apiUrl}/${config.webhookId}`;

        // Copy to clipboard
        await vscode.env.clipboard.writeText(webhookUrl);

        // Show success message with the URL
        vscode.window.showInformationMessage(
          `Webhook URL copied to clipboard: ${webhookUrl}`,
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to copy webhook URL: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  );

  context.subscriptions.push(copyWebhookUrlCommand);
}
