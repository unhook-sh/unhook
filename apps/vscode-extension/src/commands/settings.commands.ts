import * as vscode from 'vscode';
import { env } from '../env';

export function registerSettingsCommands(context: vscode.ExtensionContext) {
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
}
