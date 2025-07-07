import { debug, defaultLogger } from '@unhook/logger';
import { VSCodeOutputDestination } from '@unhook/logger/destinations/vscode-output';
import * as vscode from 'vscode';
import { registerAuthCommands } from './commands/auth.commands';
import {
  isDeliveryEnabled,
  registerDeliveryCommands,
} from './commands/delivery.commands';
import { registerEventCommands } from './commands/events.commands';
import { registerOutputCommands } from './commands/output.commands';
import { registerQuickPickCommand } from './commands/quick-pick.commands';
import { registerSettingsCommands } from './commands/settings.commands';
import { registerWebhookAccessCommands } from './commands/webhook-access.commands';
import { ConfigManager } from './config.manager';
import { EventsProvider } from './providers/events.provider';
import { EventQuickPick } from './quick-pick';
import { registerUriHandler } from './register-auth-uri-handler';
import { RequestDetailsWebviewProvider } from './request-details-webview/request-details.webview';
import { AuthStore } from './services/auth.service';
import { SettingsService } from './services/settings.service';
import { StatusBarService } from './services/status-bar.service';
import { WebhookAuthorizationService } from './services/webhook-authorization.service';
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

  // Initialize ConfigManager and load configuration
  const configManager = ConfigManager.getInstance(context);
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  await configManager.loadConfiguration(workspaceFolder);

  if (configManager.isSelfHosted()) {
    log('Using self-hosted configuration:', configManager.getApiUrl());
  }

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

  // Initialize webhook authorization service
  const authorizationService = WebhookAuthorizationService.getInstance();
  context.subscriptions.push(authorizationService);

  // Initialize status bar service
  const statusBarService = new StatusBarService();
  context.subscriptions.push(statusBarService);

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

  // Set auth store on status bar service
  statusBarService.setAuthStore(authStore);

  // Add auth-related disposables to subscriptions
  context.subscriptions.push(
    authStore,
    signInCommand,
    signOutCommand,
  );

  // Initialize webhook events provider
  const eventsProvider = new EventsProvider(context);
  eventsProvider.setAuthStore(authStore);

  // Listen for when user already has access and needs to refresh
  authorizationService.onAccessAlreadyGranted(() => {
    eventsProvider.refreshAndFetchEvents();
  });

  // Register webhook event commands
  registerEventCommands(context, eventsProvider);

  // Set up quick pick
  const quickPick = EventQuickPick.getInstance();
  quickPick.setAuthStore(authStore);

  // Register the custom URI scheme handler
  registerUriHandler(context, authStore, log, authProvider);

  // Register commands
  registerOutputCommands(context, outputDestination);
  registerQuickPickCommand(context);
  registerSettingsCommands(context);
  registerDeliveryCommands(context);
  registerWebhookAccessCommands(context, authStore);

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
