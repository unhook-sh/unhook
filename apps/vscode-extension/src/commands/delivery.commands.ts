import { debug } from '@unhook/logger';
import * as vscode from 'vscode';

const log = debug('unhook:vscode:delivery-commands');

let isDeliveryEnabled = true;

export function registerDeliveryCommands(context: vscode.ExtensionContext) {
  // Register toggle delivery command
  const toggleDeliveryCommand = vscode.commands.registerCommand(
    'unhook.toggleDelivery',
    async () => {
      isDeliveryEnabled = !isDeliveryEnabled;
      const status = isDeliveryEnabled ? 'enabled' : 'disabled';

      log('Event delivery %s', status);

      vscode.window.showInformationMessage(`Event delivery ${status}`);
    },
  );
  context.subscriptions.push(toggleDeliveryCommand);
}

export function isDeliveryPaused(): boolean {
  return !isDeliveryEnabled;
}
