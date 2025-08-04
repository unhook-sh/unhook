import * as vscode from 'vscode';
import type { SignInNotificationService } from '../services/sign-in-notification.service';

export function registerSignInNotificationCommands(
  context: vscode.ExtensionContext,
  signInNotificationService: SignInNotificationService,
) {
  // Command to reset all sign-in notification preferences
  const resetSignInNotificationCommand = vscode.commands.registerCommand(
    'unhook.resetSignInNotification',
    async () => {
      await signInNotificationService.resetDoNotAskAgain();
      vscode.window.showInformationMessage(
        'All sign-in notification preferences have been reset. You will be prompted to sign in again if needed.',
      );
    },
  );
  context.subscriptions.push(resetSignInNotificationCommand);

  // Command to reset workspace-specific sign-in notification preference
  const resetWorkspaceSignInNotificationCommand =
    vscode.commands.registerCommand(
      'unhook.resetWorkspaceSignInNotification',
      async () => {
        await signInNotificationService.resetWorkspaceDoNotAskAgain();
        vscode.window.showInformationMessage(
          'Workspace-specific sign-in notification preference has been reset. You will be prompted to sign in again in this workspace if needed.',
        );
      },
    );
  context.subscriptions.push(resetWorkspaceSignInNotificationCommand);

  // Command to reset global sign-in notification preference
  const resetGlobalSignInNotificationCommand = vscode.commands.registerCommand(
    'unhook.resetGlobalSignInNotification',
    async () => {
      await signInNotificationService.resetGlobalDoNotAskAgain();
      vscode.window.showInformationMessage(
        'Global sign-in notification preference has been reset. You will be prompted to sign in again across all workspaces if needed.',
      );
    },
  );
  context.subscriptions.push(resetGlobalSignInNotificationCommand);
}
