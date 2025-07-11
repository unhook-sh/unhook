import { debug, defaultLogger } from '@unhook/logger';
import { VSCodeOutputDestination } from '@unhook/logger/destinations/vscode-output';
import * as vscode from 'vscode';
import { registerAuthCommands } from './commands/auth.commands';
import { registerConfigCommands } from './commands/config.commands';
import {
  isDeliveryEnabled,
  registerDeliveryCommands,
} from './commands/delivery.commands';
import { registerEventCommands } from './commands/events.commands';
import { registerOutputCommands } from './commands/output.commands';
import { registerQuickPickCommand } from './commands/quick-pick.commands';
import { registerSettingsCommands } from './commands/settings.commands';
import { ConfigManager } from './config.manager';
import { setupFirstTimeUserHandler } from './handlers/first-time-user.handler';
import { EventsProvider } from './providers/events.provider';
import { EventQuickPick } from './quick-pick';
import { registerUriHandler } from './register-auth-uri-handler';
import { RequestDetailsWebviewProvider } from './request-details-webview/request-details.webview';
import { AuthStore } from './services/auth.service';
import { FirstTimeUserService } from './services/first-time-user.service';
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

  // Initialize first-time user service
  const firstTimeUserService = new FirstTimeUserService(context);

  // Register auth commands and provider
  const { authProvider, signInCommand, signOutCommand } = registerAuthCommands(
    context,
    authStore,
  );

  // Initialize settings service
  const settingsService = SettingsService.getInstance();
  context.subscriptions.push(settingsService);

  // Add VS Code output destination to default logger
  // In production, always disable auto-show output regardless of user settings
  const isProduction = !configManager.isDevelopment();
  const autoShowSetting = isProduction
    ? false
    : settingsService.getSettings().output.autoShow;

  const outputDestination = new VSCodeOutputDestination({
    autoShow: autoShowSetting,
    name: 'Unhook',
    vscode,
  });
  defaultLogger.addDestination(outputDestination);

  // Listen for settings changes
  settingsService.onSettingsChange((settings) => {
    // In production, always keep auto-show disabled
    outputDestination.autoShow = isProduction
      ? false
      : settings.output.autoShow;
    updateStatusBar(); // Update status bar when delivery settings change
  });

  // Create status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );

  // Update status bar based on auth state and delivery status
  function updateStatusBar() {
    const deliveryEnabled = isDeliveryEnabled();
    const deliveryIcon = deliveryEnabled ? '$(play)' : '$(debug-pause)';
    const deliveryStatus = deliveryEnabled ? 'enabled' : 'paused';

    if (authStore.isValidatingSession) {
      statusBarItem.text = '$(sync~spin) Validating Unhook Session...';
      statusBarItem.tooltip = 'Validating your Unhook session...';
      statusBarItem.command = undefined;
    } else if (authStore.isSignedIn) {
      statusBarItem.text = `$(check) Unhook ${deliveryIcon}`;
      statusBarItem.tooltip = `Unhook connected • Event forwarding ${deliveryStatus}\nClick to open Quick Actions`;
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

  // Set up first-time user handler
  setupFirstTimeUserHandler(authStore, firstTimeUserService);

  // Listen for delivery setting changes
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration('unhook.delivery.enabled')) {
        updateStatusBar();
      }
    },
  );

  updateStatusBar();

  // Add status bar item to subscriptions
  context.subscriptions.push(
    authStore,
    signInCommand,
    signOutCommand,
    statusBarItem,
    configChangeListener,
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
  registerUriHandler(context, authStore, log, authProvider);

  // Register commands
  registerOutputCommands(context, outputDestination);
  registerQuickPickCommand(context);
  registerSettingsCommands(context);
  registerDeliveryCommands(context);
  registerConfigCommands(context, firstTimeUserService);

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
    showCollapseAll: true,
    treeDataProvider: eventsProvider,
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
