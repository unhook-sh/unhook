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

// Add webhook authorization state
let _webhookUnauthorized = false;
let unauthorizedWebhookId: string | null = null;
let _hasPendingAccessRequest = false;

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

  // Register command to request webhook access
  const requestWebhookAccessCommand = vscode.commands.registerCommand(
    'unhook.requestWebhookAccess',
    async () => {
      if (!authStore.isSignedIn) {
        vscode.window.showErrorMessage('Please sign in to Unhook first');
        return;
      }

      if (!unauthorizedWebhookId) {
        vscode.window.showErrorMessage('No webhook ID found');
        return;
      }

      const message = await vscode.window.showInputBox({
        placeHolder: 'e.g., I need to test webhook integration for project X',
        prompt: 'Why do you need access to this webhook? (Optional)',
      });

      try {
        await authStore.api.webhookAccessRequests.create.mutate({
          requesterMessage: message,
          webhookId: unauthorizedWebhookId,
        });

        vscode.window.showInformationMessage(
          'Access request sent successfully! You will be notified when your request is reviewed.',
        );

        // Update state to show pending request
        _hasPendingAccessRequest = true;
        statusBarService.update();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.indexOf('already have a pending request') !== -1) {
          vscode.window.showInformationMessage(
            'You already have a pending access request for this webhook.',
          );
          _hasPendingAccessRequest = true;
          statusBarService.update();
        } else if (errorMessage.indexOf('already have access') !== -1) {
          // User already has access, refresh the provider
          _webhookUnauthorized = false;
          unauthorizedWebhookId = null;
          _hasPendingAccessRequest = false;
          statusBarService.update();
          eventsProvider.refresh();
        } else {
          vscode.window.showErrorMessage(
            `Failed to request access: ${errorMessage}`,
          );
        }
      }
    },
  );
  context.subscriptions.push(requestWebhookAccessCommand);

  log('Unhook extension activation complete');
}

export { eventsTreeView, requestDetailsWebviewProvider };
