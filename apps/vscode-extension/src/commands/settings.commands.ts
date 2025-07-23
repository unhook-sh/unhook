import * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';
import { env } from '../env';
import type { AuthStore } from '../services/auth.service';
import { FirstTimeUserService } from '../services/first-time-user.service';

export function registerSettingsCommands(
  context: vscode.ExtensionContext,
  _authStore?: AuthStore,
) {
  // Command to open settings
  const openSettingsCommand = vscode.commands.registerCommand(
    'unhook.openSettings',
    () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        `@ext:${env.NEXT_PUBLIC_VSCODE_EXTENSION_ID}`,
      );
    },
  );
  context.subscriptions.push(openSettingsCommand);

  // Command to prompt for analytics consent
  const promptAnalyticsConsentCommand = vscode.commands.registerCommand(
    'unhook.promptAnalyticsConsent',
    async () => {
      const firstTimeUserService = new FirstTimeUserService(context);
      if (_authStore) {
        firstTimeUserService.setAuthStore(_authStore);
      }
      await firstTimeUserService.promptForAnalyticsConsent();
    },
  );
  context.subscriptions.push(promptAnalyticsConsentCommand);

  // Command to set config file path
  const setConfigFilePathCommand = vscode.commands.registerCommand(
    'unhook.setConfigFilePath',
    async () => {
      const config = vscode.workspace.getConfiguration(
        env.NEXT_PUBLIC_VSCODE_EXTENSION_ID,
      );
      const currentPath = config.get('configFilePath');
      const newPath = await vscode.window.showInputBox({
        placeHolder: 'e.g., .unhook/config.json',
        prompt: 'Enter the path to your Unhook config file',
        value: currentPath as string,
      });

      if (newPath !== undefined) {
        await config.update('configFilePath', newPath, true);
        vscode.window.showInformationMessage(
          `Config file path set to ${newPath}`,
        );
      }
    },
  );
  context.subscriptions.push(setConfigFilePathCommand);

  // Command to toggle auto-show output
  const toggleAutoShowOutputCommand = vscode.commands.registerCommand(
    'unhook.toggleAutoShowOutput',
    async () => {
      const configManager = ConfigManager.getInstance();
      const isProduction = !configManager.isDevelopment();

      if (isProduction) {
        vscode.window.showInformationMessage(
          'Auto-show output is disabled in production mode and cannot be enabled.',
        );
        return;
      }

      const config = vscode.workspace.getConfiguration(
        env.NEXT_PUBLIC_VSCODE_EXTENSION_ID,
      );
      const currentValue = config.get('output.autoShow');
      await config.update('output.autoShow', !currentValue, true);

      vscode.window.showInformationMessage(
        `Auto-show output ${!currentValue ? 'enabled' : 'disabled'}`,
      );
    },
  );
  context.subscriptions.push(toggleAutoShowOutputCommand);

  // Command to toggle auto-clear webhook events
  const toggleAutoClearEventsCommand = vscode.commands.registerCommand(
    'unhook.toggleAutoClearEvents',
    async () => {
      const config = vscode.workspace.getConfiguration(
        env.NEXT_PUBLIC_VSCODE_EXTENSION_ID,
      );
      const currentValue = config.get('events.autoClear');
      await config.update('events.autoClear', !currentValue, true);

      vscode.window.showInformationMessage(
        `Auto-clear webhook events ${!currentValue ? 'enabled' : 'disabled'}`,
      );
    },
  );
  context.subscriptions.push(toggleAutoClearEventsCommand);

  // Command to toggle event notifications
  const toggleNotificationsCommand = vscode.commands.registerCommand(
    'unhook.toggleNotifications',
    async () => {
      const config = vscode.workspace.getConfiguration(
        env.NEXT_PUBLIC_VSCODE_EXTENSION_ID,
      );
      const currentValue = config.get('notifications.showForNewEvents');
      await config.update(
        'notifications.showForNewEvents',
        !currentValue,
        true,
      );

      vscode.window.showInformationMessage(
        `Event notifications ${!currentValue ? 'enabled' : 'disabled'}`,
      );
    },
  );
  context.subscriptions.push(toggleNotificationsCommand);

  const configManager = ConfigManager.getInstance();
  // Register test command for first-time user (development only)
  if (configManager.isDevelopment()) {
    const testFirstTimeUserCommand = vscode.commands.registerCommand(
      'unhook.testFirstTimeUser',
      async () => {
        const firstTimeUserService = new FirstTimeUserService(context);
        if (_authStore) {
          firstTimeUserService.setAuthStore(_authStore);
        }
        await firstTimeUserService.resetFirstTimeUserState();
        vscode.window.showInformationMessage(
          'First-time user state reset. Sign out and sign back in to test.',
        );
      },
    );
    context.subscriptions.push(testFirstTimeUserCommand);
  }
}
