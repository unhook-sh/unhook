import { debug, defaultLogger } from '@unhook/logger';
import { VSCodeOutputDestination } from '@unhook/logger/destinations/vscode-output';
import * as vscode from 'vscode';
import { registerAuthCommands } from './commands/auth.commands';
import { registerConfigCommands } from './commands/config.commands';
import { registerDeliveryCommands } from './commands/delivery.commands';
import { registerEventCommands } from './commands/events.commands';
import { registerOutputCommands } from './commands/output.commands';
import { registerQuickPickCommand } from './commands/quick-pick.commands';
import { registerSettingsCommands } from './commands/settings.commands';
import { registerWebhookAccessCommands } from './commands/webhook-access.commands';
import { ConfigManager } from './config.manager';
import { setupFirstTimeUserHandler } from './handlers/first-time-user.handler';
import { AnalyticsProvider } from './providers/analytics.provider';
import { EventsProvider } from './providers/events.provider';
import { EventQuickPick } from './quick-pick';
import { registerUriHandler } from './register-auth-uri-handler';
import { RequestDetailsWebviewProvider } from './request-details-webview/request-details.webview';
import { AuthStore } from './services/auth.service';
import { FirstTimeUserService } from './services/first-time-user.service';
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
let analyticsProvider: AnalyticsProvider | undefined;

export async function activate(context: vscode.ExtensionContext) {
  log('Unhook extension is activating...');
  const activationStartTime = Date.now();

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

  // Register analytics provider
  const { provider: _analyticsProvider, disposable: analyticsDisposable } =
    AnalyticsProvider.register(context, authStore);
  analyticsProvider = _analyticsProvider;
  context.subscriptions.push(analyticsDisposable);

  // Track extension activation
  analyticsProvider
    .getAnalyticsService()
    .trackActivation(Date.now() - activationStartTime);

  // Initialize settings service
  const settingsService = SettingsService.getInstance();
  context.subscriptions.push(settingsService);

  // Initialize webhook authorization service
  const authorizationService = WebhookAuthorizationService.getInstance();
  context.subscriptions.push(authorizationService);

  // Initialize status bar service
  const statusBarService = StatusBarService.getInstance();
  context.subscriptions.push(statusBarService);

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
    statusBarService.update(); // Update status bar when delivery settings change
  });

  // Set auth store on status bar service
  statusBarService.setAuthStore(authStore);
  setupFirstTimeUserHandler(authStore, firstTimeUserService);

  // Listen for delivery setting changes
  const _configChangeListener = vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration('unhook.delivery.enabled')) {
        statusBarService.update();
      }
    },
  );

  statusBarService.update();

  context.subscriptions.push(authStore, signInCommand, signOutCommand);

  // Initialize webhook events provider
  const eventsProvider = new EventsProvider(context);
  eventsProvider.setAuthStore(authStore);
  eventsProvider.setAnalyticsService(analyticsProvider.getAnalyticsService());

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
  registerConfigCommands(context, authStore);

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

export function deactivate() {
  // Track extension deactivation
  if (analyticsProvider) {
    analyticsProvider.getAnalyticsService().trackDeactivation();
  }

  log('Unhook extension deactivated');
}

export { eventsTreeView, requestDetailsWebviewProvider };
