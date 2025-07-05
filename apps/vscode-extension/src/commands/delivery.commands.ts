import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { SettingsService } from '../services/settings.service';

const log = debug('unhook:vscode:delivery-commands');

/**
 * Commands and utilities for managing event delivery settings.
 *
 * Event delivery controls whether new webhook events are automatically
 * forwarded to their configured destinations. When disabled, events will
 * still be received and displayed in the extension, but they won't be
 * forwarded to local endpoints until manually replayed or delivery is re-enabled.
 */

export function registerDeliveryCommands(context: vscode.ExtensionContext) {
  const _settingsService = SettingsService.getInstance();

  // Register toggle delivery command
  const toggleDeliveryCommand = vscode.commands.registerCommand(
    'unhook.toggleDelivery',
    async () => {
      const config = vscode.workspace.getConfiguration('unhook');
      const currentState = config.get<boolean>('delivery.enabled', true);
      const newState = !currentState;

      await config.update(
        'delivery.enabled',
        newState,
        vscode.ConfigurationTarget.Global,
      );

      const status = newState ? 'enabled' : 'disabled';
      log('Event delivery %s', status);
      vscode.window.showInformationMessage(`Event delivery ${status}`);
    },
  );

  context.subscriptions.push(toggleDeliveryCommand);
}

export function isDeliveryPaused(): boolean {
  const config = vscode.workspace.getConfiguration('unhook');
  const isEnabled = config.get<boolean>('delivery.enabled', true);
  return !isEnabled;
}

export function isDeliveryEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('unhook');
  return config.get<boolean>('delivery.enabled', true);
}
