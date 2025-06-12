import { debug, defaultLogger } from '@unhook/logger';
import { VSCodeOutputDestination } from '@unhook/logger/destinations/vscode-output';
import * as vscode from 'vscode';
import { registerAuthCommands } from './commands/auth.commands';
import { registerDeliveryCommands } from './commands/delivery.commands';
import { registerEventCommands } from './commands/events.commands';
import { registerOutputCommands } from './commands/output.commands';
import { registerQuickPickCommand } from './commands/quick-pick.commands';
import { registerSettingsCommands } from './commands/settings.commands';
import { EventsProvider } from './providers/events.provider';
import { EventQuickPick } from './quick-pick';
import { registerUriHandler } from './register-auth-uri-handler';
import { RequestDetailsWebviewProvider } from './request-details-webview/request-details.webview';
import { AuthStore } from './services/auth.service';
import { SettingsService } from './services/settings.service';
import type { EventItem } from './tree-items/event.item';
import type { RequestItem } from './tree-items/request.item';

defaultLogger.enableNamespace('*');
defaultLogger.enableNamespace('unhook:vscode');
defaultLogger.enableNamespace('unhook:vscode:*');
const log = debug('unhook:vscode');

let eventsTreeView: vscode.TreeView<EventItem | RequestItem> | undefined;
let requestDetailsWebviewProvider: RequestDetailsWebviewProvider;

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
  const eventsProvider = new EventsProvider(context);
  eventsProvider.setAuthStore(authStore);

  // Register webhook event commands
  registerEventCommands(context, eventsProvider);

  // Set up quick pick
  const quickPick = EventQuickPick.getInstance();
  quickPick.setAuthStore(authStore);

  // Register the custom URI scheme handler
  registerUriHandler(context, authStore, log);

  // Register commands
  registerOutputCommands(context, outputDestination);
  registerQuickPickCommand(context);
  registerSettingsCommands(context);
  registerDeliveryCommands(context);

  // Register the new command to show the Quick Pick from the status bar
  const showQuickPickCommand = vscode.commands.registerCommand(
    'unhook.showQuickPick',
    () => {
      EventQuickPick.getInstance().showQuickPick();
    },
  );
  context.subscriptions.push(showQuickPickCommand);

  // Register the webhook events provider
  eventsTreeView = vscode.window.createTreeView('unhook.events', {
    treeDataProvider: eventsProvider,
    showCollapseAll: true,
  });

  eventsTreeView.onDidChangeVisibility(() => {
    eventsProvider.refresh();
  });

  // Initialize the request details webview provider
  requestDetailsWebviewProvider = new RequestDetailsWebviewProvider(
    context.extensionUri,
  );
  context.subscriptions.push(requestDetailsWebviewProvider);

  context.subscriptions.push(eventsTreeView);

  log('Unhook extension activation complete');
}

export function deactivate() {}

export { eventsTreeView, requestDetailsWebviewProvider };
