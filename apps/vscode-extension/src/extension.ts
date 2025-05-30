import * as vscode from 'vscode';
import { registerWebhookEventCommands } from './commands/webhook-events.commands';
import { RequestDetailsProvider } from './providers/request-details.provider';
import { SettingsProvider } from './providers/settings.provider';
import { WebhookEventsProvider } from './providers/webhook-events.provider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Unhook extension is activating...');
  const provider = new WebhookEventsProvider(context);
  vscode.window.registerTreeDataProvider('unhook.webhookEvents', provider);

  const settingsProvider = new SettingsProvider();
  vscode.window.registerTreeDataProvider('unhook.settings', settingsProvider);

  // Register the custom editor provider
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'unhook.requestDetails',
      new RequestDetailsProvider(context.extensionUri),
      {
        supportsMultipleEditorsPerDocument: false,
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      },
    ),
  );

  // Register the custom URI scheme handler
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('unhook', {
      provideTextDocumentContent: (uri: vscode.Uri): string => {
        return decodeURIComponent(uri.query);
      },
    }),
  );

  // Register webhook event commands
  registerWebhookEventCommands(context, provider);

  console.log('Unhook extension activation complete');
}

export function deactivate() {}
