import type { VSCodeOutputDestination } from '@unhook/logger/destinations/vscode-output';
import * as vscode from 'vscode';
import type { AnalyticsService } from '../services/analytics.service';

export function registerOutputCommands(
  context: vscode.ExtensionContext,
  outputDestination: VSCodeOutputDestination,
  analyticsService?: AnalyticsService,
) {
  // Register Focus Output command
  const focusOutputCommand = vscode.commands.registerCommand(
    'unhook.focusOutput',
    () => {
      // Track output focus
      analyticsService?.track('output_focused');
      outputDestination.show();
    },
  );
  context.subscriptions.push(focusOutputCommand);

  // Register Clear Output command
  const clearOutputCommand = vscode.commands.registerCommand(
    'unhook.clearOutput',
    () => {
      // Track output clear
      analyticsService?.track('output_cleared');
      outputDestination.clear();
    },
  );
  context.subscriptions.push(clearOutputCommand);

  // Register Toggle Output command
  const toggleOutputCommand = vscode.commands.registerCommand(
    'unhook.toggleOutput',
    () => {
      // Track output toggle
      analyticsService?.track('output_toggled');

      // Since we can't directly check if the output is visible,
      // we'll just toggle it by showing/hiding
      outputDestination.show();
      setTimeout(() => outputDestination.hide(), 100);
    },
  );
  context.subscriptions.push(toggleOutputCommand);
}
