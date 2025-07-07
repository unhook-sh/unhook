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
import { ConfigManager } from './config.manager';
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

// Add webhook authorization state
let webhookUnauthorized = false;
let unauthorizedWebhookId: string | null = null;
let hasPendingAccessRequest = false;

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
      // Check if webhook is unauthorized
      if (webhookUnauthorized) {
        if (hasPendingAccessRequest) {
          statusBarItem.text = '$(clock) Unhook: Access pending';
          statusBarItem.tooltip =
            'Your webhook access request is pending approval';
          statusBarItem.command = undefined;
        } else {
          statusBarItem.text = '$(error) Unhook: No webhook access';
          statusBarItem.tooltip =
            'You do not have access to this webhook\nClick to request access';
          statusBarItem.command = 'unhook.requestWebhookAccess';
        }
      } else {
        statusBarItem.text = `$(check) Unhook ${deliveryIcon}`;
        statusBarItem.tooltip = `Unhook connected • Event forwarding ${deliveryStatus}\nClick to open Quick Actions`;
        statusBarItem.command = 'unhook.showQuickPick';
      }
    } else {
      statusBarItem.text = '$(sign-in) Sign in to Unhook';
      statusBarItem.tooltip = 'Click to sign in to Unhook';
      statusBarItem.command = 'unhook.signIn';
    }
    statusBarItem.show();
  }

  // Listen for auth state changes
  authStore.onDidChangeAuth(() => updateStatusBar());

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

  // Listen for webhook authorization errors
  eventsProvider.onWebhookAuthorizationError(
    async (error: { webhookId: string }) => {
      webhookUnauthorized = true;
      unauthorizedWebhookId = error.webhookId;

      // Check if there's already a pending request
      if (authStore.isSignedIn && error.webhookId) {
        try {
          const pendingRequest =
            await authStore.api.webhookAccessRequests.checkPendingRequest.query(
              {
                webhookId: error.webhookId,
              },
            );
          hasPendingAccessRequest = !!pendingRequest;
        } catch (err) {
          hasPendingAccessRequest = false;
        }
      }

      updateStatusBar();
    },
  );

  // Listen for successful webhook access
  eventsProvider.onWebhookAuthorized(() => {
    webhookUnauthorized = false;
    unauthorizedWebhookId = null;
    updateStatusBar();
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
        prompt: 'Why do you need access to this webhook? (Optional)',
        placeHolder: 'e.g., I need to test webhook integration for project X',
      });

      try {
        await authStore.api.webhookAccessRequests.create.mutate({
          webhookId: unauthorizedWebhookId,
          requesterMessage: message,
        });

        vscode.window.showInformationMessage(
          'Access request sent successfully! You will be notified when your request is reviewed.',
        );

        // Update state to show pending request
        hasPendingAccessRequest = true;
        updateStatusBar();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.indexOf('already have a pending request') !== -1) {
          vscode.window.showInformationMessage(
            'You already have a pending access request for this webhook.',
          );
          hasPendingAccessRequest = true;
          updateStatusBar();
        } else if (errorMessage.indexOf('already have access') !== -1) {
          // User already has access, refresh the provider
          webhookUnauthorized = false;
          unauthorizedWebhookId = null;
          hasPendingAccessRequest = false;
          updateStatusBar();
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

export function deactivate() {}

export { eventsTreeView, requestDetailsWebviewProvider };
