import * as vscode from 'vscode';
import { EventQuickPick } from '../quick-pick';

export function registerQuickPickCommand(context: vscode.ExtensionContext) {
  const quickPickCommand = vscode.commands.registerCommand(
    'unhook.quickPick',
    () => {
      EventQuickPick.getInstance().showQuickPick();
    },
  );
  context.subscriptions.push(quickPickCommand);
}
