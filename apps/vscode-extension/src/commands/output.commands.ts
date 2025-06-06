import type { VSCodeOutputDestination } from '@unhook/logger/destinations/vscode-output';
import * as vscode from 'vscode';

export function registerOutputCommands(
  context: vscode.ExtensionContext,
  outputDestination: VSCodeOutputDestination,
) {
  // Register Focus Output command
  const focusOutputCommand = vscode.commands.registerCommand(
    'unhook.focusOutput',
    () => {
      outputDestination.show();
    },
  );
  context.subscriptions.push(focusOutputCommand);

  // Register Clear Output command
  const clearOutputCommand = vscode.commands.registerCommand(
    'unhook.clearOutput',
    () => {
      outputDestination.clear();
    },
  );
  context.subscriptions.push(clearOutputCommand);

  // Register Toggle Output command
  const toggleOutputCommand = vscode.commands.registerCommand(
    'unhook.toggleOutput',
    () => {
      // Since we can't directly check if the output is visible,
      // we'll just toggle it by showing/hiding
      outputDestination.show();
      setTimeout(() => outputDestination.hide(), 100);
    },
  );
  context.subscriptions.push(toggleOutputCommand);
}
