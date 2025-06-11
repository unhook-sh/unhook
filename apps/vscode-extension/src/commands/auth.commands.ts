import * as vscode from 'vscode';
import { UnhookAuthProvider } from '../providers/auth.provider';
import type { AuthStore } from '../services/auth.service';

export function registerAuthCommands(
  context: vscode.ExtensionContext,
  authStore: AuthStore,
) {
  // Register auth provider
  const provider = new UnhookAuthProvider(context, authStore);
  const authProvider = UnhookAuthProvider.register(context, authStore);

  // Register sign in command
  const signInCommand = vscode.commands.registerCommand(
    'unhook.signIn',
    async () => {
      try {
        const session = await vscode.authentication.getSession(
          'unhook',
          ['openid', 'email', 'profile'],
          {
            createIfNone: true,
          },
        );
        if (session) {
          vscode.window.showInformationMessage(
            'Successfully signed in to Unhook',
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to sign in to Unhook: ${(error as Error).message}`,
        );
      }
    },
  );

  // Register sign out command
  const signOutCommand = vscode.commands.registerCommand(
    'unhook.signOut',
    async () => {
      try {
        const session = await vscode.authentication.getSession(
          'unhook',
          ['openid', 'email', 'profile'],
          {
            createIfNone: false,
          },
        );
        if (session) {
          await provider.removeSession(session.id);
          vscode.window.showInformationMessage(
            'Successfully signed out of Unhook',
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to sign out of Unhook: ${(error as Error).message}`,
        );
      }
    },
  );

  // Add commands to extension context
  context.subscriptions.push(signInCommand, signOutCommand);

  return {
    authProvider,
    signInCommand,
    signOutCommand,
  };
}
