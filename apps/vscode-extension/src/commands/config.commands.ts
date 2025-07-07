import * as vscode from 'vscode';
import { FirstTimeUserService } from '../services/first-time-user.service';

export function registerConfigCommands(
  context: vscode.ExtensionContext,
  firstTimeUserService: FirstTimeUserService,
) {
  // Register create config command
  const createConfigCommand = vscode.commands.registerCommand(
    'unhook.createConfig',
    () => {
      firstTimeUserService.promptForUnhookYmlCreation();
    },
  );

  // Add commands to extension context
  context.subscriptions.push(createConfigCommand);

  return {
    createConfigCommand,
  };
}