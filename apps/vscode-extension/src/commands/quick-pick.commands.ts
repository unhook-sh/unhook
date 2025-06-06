import * as vscode from 'vscode';
import { WebhookEventQuickPick } from '../quickPick';

export function registerQuickPickCommand(context: vscode.ExtensionContext) {
  const quickPickCommand = vscode.commands.registerCommand(
    'unhook.quickPick',
    () => {
      WebhookEventQuickPick.getInstance().showQuickPick();
    },
  );
  context.subscriptions.push(quickPickCommand);
}
