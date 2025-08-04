import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { UnhookAuthProvider } from '../providers/auth.provider';
import type { AuthStore } from '../services/auth.service';

const log = debug('unhook:vscode:auth-commands');

export function registerAuthCommands(
  context: vscode.ExtensionContext,
  authStore: AuthStore,
) {
  // Register auth provider
  const { provider, disposable: authProviderDisposable } =
    UnhookAuthProvider.register(context, authStore);

  // Register sign in command
  const signInCommand = vscode.commands.registerCommand(
    'unhook.signIn',
    async () => {
      log('unhook.signIn command triggered');
      try {
        log('Requesting authentication session...');
        const session = await vscode.authentication.getSession(
          'unhook',
          ['openid', 'email', 'profile'],
          {
            createIfNone: true,
          },
        );
        log('Authentication session result:', { hasSession: !!session });
        if (session) {
          log('Sign-in successful from command');
          vscode.window.showInformationMessage(
            'Successfully signed in to Unhook',
          );
        } else {
          log('No session returned from authentication');
        }
      } catch (error) {
        log('Sign-in command failed:', error);
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
      log('unhook.signOut command triggered');
      try {
        // Always try to sign out, regardless of session state
        await provider.removeSession('current');
        vscode.window.showInformationMessage(
          'Successfully signed out of Unhook',
        );
      } catch (error) {
        log('Sign out command failed:', error);
        vscode.window.showErrorMessage(
          `Failed to sign out of Unhook: ${(error as Error).message}`,
        );
      }
    },
  );

  // Add commands to extension context
  context.subscriptions.push(
    signInCommand,
    signOutCommand,
    authProviderDisposable,
  );

  return {
    authProvider: provider,
    signInCommand,
    signOutCommand,
  };
}
