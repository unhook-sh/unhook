import { debug, defaultLogger } from '@unhook/logger';
import { VSCodeOutputDestination } from '@unhook/logger/destinations/vscode-output';
import * as vscode from 'vscode';
import { registerAuthCommands } from './auth/commands';
import { registerUriHandler } from './auth/register-uri-handler';
import { registerOutputCommands } from './commands/output.commands';
import { registerQuickPickCommand } from './commands/quick-pick.commands';
import { registerSettingsCommands } from './commands/settings.commands';
import { registerWebhookEventCommands } from './commands/webhook-events.commands';
import { SettingsProvider } from './providers/settings.provider';
import { WebhookEventsProvider } from './providers/webhook-events.provider';
import { WebhookEventQuickPick } from './quickPick';
import { RequestDetailsWebviewProvider } from './request-details-webview/request-details.webview';
import { SettingsService } from './services/settings.service';
import { AuthStore } from './stores/auth-store';

defaultLogger.enableNamespace('*');
defaultLogger.enableNamespace('unhook:vscode');
defaultLogger.enableNamespace('unhook:vscode:*');
const log = debug('unhook:vscode');

export async function activate(context: vscode.ExtensionContext) {
  log('Unhook extension is activating...');

  // Initialize auth store
  const authStore = new AuthStore(context);
  await authStore.initialize();

  // Register auth commands and provider
  const { authProvider, signInCommand, signOutCommand } = registerAuthCommands(
    context,
    authStore,
  );

  // Initialize settings service
  const settingsService = SettingsService.getInstance();
  context.subscriptions.push(settingsService);

  // Add VS Code output destination to default logger
  const outputDestination = new VSCodeOutputDestination({
    name: 'Unhook',
    vscode,
    autoShow: settingsService.getSettings().output.autoShow,
  });
  defaultLogger.addDestination(outputDestination);

  // Listen for settings changes
  settingsService.onSettingsChange((settings) => {
    outputDestination.autoShow = settings.output.autoShow;
  });

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );

  // Update status bar based on auth state
  function updateStatusBar() {
    if (authStore.isValidatingSession) {
      statusBarItem.text = '$(sync~spin) Validating Unhook Session...';
      statusBarItem.tooltip = 'Validating your Unhook session...';
      statusBarItem.command = undefined;
    } else if (authStore.isSignedIn) {
      statusBarItem.text = '$(check) Unhook';
      statusBarItem.tooltip = 'Click to open Unhook Quick Actions';
      statusBarItem.command = 'unhook.showQuickPick';
    } else {
      statusBarItem.text = '$(sign-in) Sign in to Unhook';
      statusBarItem.tooltip = 'Click to sign in to Unhook';
      statusBarItem.command = 'unhook.signIn';
    }
    statusBarItem.show();
  }

  // Listen for auth state changes
  authStore.onDidChangeAuth(() => updateStatusBar());
  updateStatusBar();

  // Add status bar item to subscriptions
  context.subscriptions.push(
    authStore,
    authProvider,
    signInCommand,
    signOutCommand,
    statusBarItem,
  );

  // Initialize webhook events provider
  const webhookEventsProvider = new WebhookEventsProvider(context);
  webhookEventsProvider.setAuthStore(authStore);

  // Initialize webview provider
  const webviewProvider = new RequestDetailsWebviewProvider(
    context.extensionUri,
  );

  // Register webhook event commands
  registerWebhookEventCommands(context, webhookEventsProvider, webviewProvider);

  // Set up quick pick
  const quickPick = WebhookEventQuickPick.getInstance();
  quickPick.setAuthStore(authStore);

  const settingsProvider = new SettingsProvider();
  vscode.window.registerTreeDataProvider('unhook.settings', settingsProvider);

  // Register the custom URI scheme handler
  registerUriHandler(context, authStore, log);

  // Create the webview provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      RequestDetailsWebviewProvider.viewType,
      webviewProvider,
    ),
  );

  // Register commands
  registerOutputCommands(context, outputDestination);
  registerQuickPickCommand(context);

  registerSettingsCommands(context);

  // Register the new command to show the Quick Pick from the status bar
  const showQuickPickCommand = vscode.commands.registerCommand(
    'unhook.showQuickPick',
    () => {
      WebhookEventQuickPick.getInstance().showQuickPick();
    },
  );
  context.subscriptions.push(showQuickPickCommand);

  // Register the webhook events provider
  const treeView = vscode.window.createTreeView('unhook.webhookEvents', {
    treeDataProvider: webhookEventsProvider,
    showCollapseAll: true,
  });

  treeView.onDidChangeVisibility(() => {
    webhookEventsProvider.refresh();
  });

  context.subscriptions.push(treeView);

  log('Unhook extension activation complete');
}

export function deactivate() {}
