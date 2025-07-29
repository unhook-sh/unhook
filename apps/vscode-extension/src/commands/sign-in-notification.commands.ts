import * as vscode from 'vscode';
import type { SignInNotificationService } from '../services/sign-in-notification.service';

export function registerSignInNotificationCommands(
  context: vscode.ExtensionContext,
  signInNotificationService: SignInNotificationService,
) {
  // Command to reset sign-in notification preference
  const resetSignInNotificationCommand = vscode.commands.registerCommand(
    'unhook.resetSignInNotification',
    async () => {
      await signInNotificationService.resetDoNotAskAgain();
      vscode.window.showInformationMessage(
        'Sign-in notification preference has been reset. You will be prompted to sign in again if needed.',
      );
    },
  );
  context.subscriptions.push(resetSignInNotificationCommand);
}
