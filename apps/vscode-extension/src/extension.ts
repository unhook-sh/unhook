import { debug, defaultLogger } from '@unhook/logger';
import { VSCodeOutputDestination } from '@unhook/logger/destinations/vscode-output';
import * as vscode from 'vscode';
import { registerAuthCommands } from './commands/auth.commands';
import { registerConfigCommands } from './commands/config.commands';
import { registerConfigPanelCommands } from './commands/config-panel.commands';
import { registerDeliveryCommands } from './commands/delivery.commands';
import { registerEventCommands } from './commands/events.commands';
import { registerOutputCommands } from './commands/output.commands';
import { registerPollingCommands } from './commands/polling.commands';
import { registerQuickPickCommand } from './commands/quick-pick.commands';
import { registerSettingsCommands } from './commands/settings.commands';
import { registerSignInNotificationCommands } from './commands/sign-in-notification.commands';
import { registerWebhookCommands } from './commands/webhook.commands';
import { registerWebhookAccessCommands } from './commands/webhook-access.commands';
import { ConfigManager } from './config.manager';
import { setupFirstTimeUserHandler } from './handlers/first-time-user.handler';
import { AnalyticsProvider } from './providers/analytics.provider';
import { ConfigProvider } from './providers/config.provider';
import { EventsProvider } from './providers/events.provider';
import { EventQuickPick } from './quick-pick';
import { registerUriHandler } from './register-auth-uri-handler';
import { RequestDetailsWebviewProvider } from './request-details-webview/request-details.webview';
import { AuthStore } from './services/auth.service';
import { DevInfoService } from './services/dev-info.service';
import { FirstTimeUserService } from './services/first-time-user.service';
import { SettingsService } from './services/settings.service';
import { SignInNotificationService } from './services/sign-in-notification.service';
import { StatusBarService } from './services/status-bar.service';
import { WebhookAuthorizationService } from './services/webhook-authorization.service';
import type { EventItem } from './tree-items/event.item';
import type { LoadingItem } from './tree-items/loading.item';
import type { RequestItem } from './tree-items/request.item';

defaultLogger.enableNamespace('*');
defaultLogger.enableNamespace('unhook:vscode');
defaultLogger.enableNamespace('unhook:vscode:*');
const log = debug('unhook:vscode');

let eventsTreeView:
  | vscode.TreeView<EventItem | RequestItem | LoadingItem>
  | undefined;
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
  firstTimeUserService.setAuthStore(authStore);
  firstTimeUserService.setupWorkspaceChangeListener();

  // Check if we should show first-time prompts in the current workspace
  if (authStore.isSignedIn) {
    // Add a small delay to ensure everything is initialized
    log('Setting up initial workspace config prompt check with 2 second delay');
    setTimeout(async () => {
      log('Executing initial workspace config prompt check');
      await firstTimeUserService.checkAndShowWorkspaceConfigPromptsIfNeeded();
    }, 2000);
  }

  setupFirstTimeUserHandler(authStore, firstTimeUserService);

  // Register analytics provider first
  const { provider: analyticsProvider, disposable: analyticsDisposable } =
    AnalyticsProvider.register(context, authStore);
  context.subscriptions.push(analyticsDisposable);

  // Register auth commands and provider
  const { authProvider, signInCommand, signOutCommand, cancelAuthCommand } =
    registerAuthCommands(
      context,
      authStore,
      analyticsProvider.getAnalyticsService(),
    );

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

  // Initialize sign-in notification service
  const signInNotificationService =
    SignInNotificationService.getInstance(context);
  signInNotificationService.setAuthStore(authStore);
  context.subscriptions.push(signInNotificationService);

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

  // Set auth store and provider on status bar service
  statusBarService.setAuthStore(authStore);
  statusBarService.setAuthProvider(authProvider);

  // Listen for delivery setting changes
  const _configChangeListener = vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration('unhook.delivery.enabled')) {
        statusBarService.update();
      }
    },
  );

  // Listen for workspace folder changes to check first-time user status
  const _workspaceChangeListener = vscode.workspace.onDidChangeWorkspaceFolders(
    async () => {
      // Check if we should show first-time prompts in the new workspace
      if (authStore.isSignedIn) {
        log(
          'Workspace folders changed, checking if should show workspace config prompts',
        );
        await firstTimeUserService.checkAndShowWorkspaceConfigPromptsIfNeeded();
      }
    },
  );

  statusBarService.update();

  context.subscriptions.push(
    authStore,
    authProvider,
    signInCommand,
    signOutCommand,
    cancelAuthCommand,
    _workspaceChangeListener,
  );

  // Initialize webhook events provider
  const eventsProvider = new EventsProvider(context);
  eventsProvider.setAuthStore(authStore);
  eventsProvider.setAnalyticsService(analyticsProvider.getAnalyticsService());

  // Initialize config provider
  const configProvider = new ConfigProvider(context);
  eventsProvider.setConfigProvider(configProvider);

  // Initialize dev info service
  const devInfoService = new DevInfoService();
  devInfoService.setConfigProvider(configProvider);
  devInfoService.setAuthStore(authStore);

  // Connect polling service to dev info service
  const connectPollingToDevInfo = () => {
    const pollingService = eventsProvider.getPollingService();
    if (pollingService) {
      devInfoService.setPollingService(pollingService);
    }
  };

  // Set up callback for polling state changes
  eventsProvider.setOnPollingStateChange(() => {
    if (ConfigManager.getInstance().isDevelopment()) {
      devInfoService.fetchDevInfo();
    }
  });

  // Listen for when user already has access and needs to refresh
  authorizationService.onAccessAlreadyGranted(() => {
    log('Access already granted event received, refreshing events');
    eventsProvider.refreshAndFetchEvents();
    // Try to connect polling service after events are refreshed
    setTimeout(connectPollingToDevInfo, 1000);
  });

  // Register webhook event commands
  registerEventCommands(context, eventsProvider);

  // Register polling commands
  const { disposables: pollingDisposables } = registerPollingCommands(
    context,
    eventsProvider,
  );
  context.subscriptions.push(...pollingDisposables);

  // Register config panel commands
  registerConfigPanelCommands(
    context,
    configProvider,
    analyticsProvider.getAnalyticsService(),
  );

  // Set up quick pick
  const quickPick = EventQuickPick.getInstance();
  quickPick.setAuthStore(authStore);
  quickPick.setAnalyticsService(analyticsProvider.getAnalyticsService());

  // Register the custom URI scheme handler
  registerUriHandler(context, authStore, log, authProvider);

  // Register commands
  registerOutputCommands(
    context,
    outputDestination,
    analyticsProvider.getAnalyticsService(),
  );
  registerQuickPickCommand(context);
  registerSettingsCommands(
    context,
    authStore,
    analyticsProvider.getAnalyticsService(),
  );
  registerDeliveryCommands(context);
  registerWebhookAccessCommands(
    context,
    authStore,
    analyticsProvider.getAnalyticsService(),
  );
  registerWebhookCommands(
    context,
    authStore,
    analyticsProvider.getAnalyticsService(),
  );
  registerConfigCommands(
    context,
    authStore,
    analyticsProvider.getAnalyticsService(),
    firstTimeUserService,
  );
  registerSignInNotificationCommands(
    context,
    signInNotificationService,
    analyticsProvider.getAnalyticsService(),
  );

  // Register the new command to show the Quick Pick from the status bar
  const showQuickPickCommand = vscode.commands.registerCommand(
    'unhook.showQuickPick',
    () => {
      // Track quick pick show from status bar
      analyticsProvider
        .getAnalyticsService()
        .track('quick_pick_show_from_status_bar');
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

  // Set up loading state callback for the tree view
  // Use VS Code's progress API to show the blue progress bar
  let progressResolve: (() => void) | undefined;
  eventsProvider.setOnLoadingStateChange((isLoading: boolean) => {
    if (isLoading) {
      // Show progress indicator
      vscode.window.withProgress(
        {
          cancellable: false,
          location: vscode.ProgressLocation.Window,
          title: 'Loading events...',
        },
        async () => {
          // Keep the progress indicator active while loading
          return new Promise<void>((resolve) => {
            progressResolve = resolve;
          });
        },
      );
    } else {
      // Hide progress indicator
      if (progressResolve) {
        progressResolve();
        progressResolve = undefined;
      }
    }
  });

  // Register the config provider
  const configTreeView = vscode.window.createTreeView('unhook.config', {
    showCollapseAll: true,
    treeDataProvider: configProvider,
  });

  configTreeView.onDidChangeVisibility(() => {
    configProvider.refresh();
  });

  // Initialize the request details webview provider
  requestDetailsWebviewProvider = new RequestDetailsWebviewProvider(
    context.extensionUri,
  );
  requestDetailsWebviewProvider.setAnalyticsService(
    analyticsProvider.getAnalyticsService(),
  );
  context.subscriptions.push(requestDetailsWebviewProvider);

  context.subscriptions.push(
    eventsTreeView,
    configTreeView,
    configProvider,
    eventsProvider,
  );

  // Fetch development information
  devInfoService.fetchDevInfo();
  // orgMembers will now be included in dev info for development mode

  // Try to connect polling service initially
  setTimeout(connectPollingToDevInfo, 2000);

  // Set up periodic refresh for development info
  if (configManager.isDevelopment()) {
    const refreshInterval = setInterval(() => {
      devInfoService.refresh();
    }, 30000); // Refresh every 30 seconds

    context.subscriptions.push({
      dispose: () => clearInterval(refreshInterval),
    });
  }

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
