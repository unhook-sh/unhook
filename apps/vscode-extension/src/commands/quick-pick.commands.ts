import * as vscode from 'vscode';
import { EventQuickPick } from '../quick-pick';

export function registerQuickPickCommand(context: vscode.ExtensionContext) {
  const quickPickCommand = vscode.commands.registerCommand(
    'unhook.quickPick',
    () => {
      // Track quick pick usage
      // Note: We can't access analytics service here directly, but the analytics provider
      // already tracks command executions automatically
      EventQuickPick.getInstance().showQuickPick();
    },
  );
  context.subscriptions.push(quickPickCommand);
}
