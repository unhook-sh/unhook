import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { UnhookAuthProvider } from '../providers/auth.provider';
import type { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';

const log = debug('unhook:vscode:auth-commands');

export function registerAuthCommands(
  context: vscode.ExtensionContext,
  authStore: AuthStore,
  analyticsService?: AnalyticsService,
) {
  // Register auth provider
  const { provider, disposable: authProviderDisposable } =
    UnhookAuthProvider.register(context, authStore);

  // Register sign in command
  const signInCommand = vscode.commands.registerCommand(
    'unhook.signIn',
    async () => {
      log('unhook.signIn command triggered');

      // Check if user is already signed in
      if (authStore.isSignedIn) {
        vscode.window.showInformationMessage(
          'You are already signed in to Unhook',
        );
        return;
      }

      // Check if authentication is already in progress
      if (provider.isAuthPending()) {
        vscode.window.showInformationMessage(
          'Authentication is already in progress. Please complete the sign-in process in your browser or wait for it to complete.',
        );
        return;
      }

      try {
        // Cancel any existing pending authentication before starting a new one
        provider.cancelPendingAuth();

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

          // Track successful sign-in
          analyticsService?.track('auth_sign_in_success', {
            method: 'vscode_authentication',
          });

          vscode.window.showInformationMessage(
            'Successfully signed in to Unhook',
          );
        } else {
          log('No session returned from authentication');

          // Track failed sign-in
          analyticsService?.track('auth_sign_in_failed', {
            reason: 'no_session_returned',
          });
        }
      } catch (error) {
        log('Sign-in command failed:', error);
        // Don't show error message for user cancellation
        if (
          (error as Error).message !== 'Authentication was canceled by user'
        ) {
          vscode.window.showErrorMessage(
            `Failed to sign in to Unhook: ${(error as Error).message}`,
          );
        }
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

        // Track sign out action
        analyticsService?.track('auth_sign_out_success');

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

  // Register cancel auth command (for debugging/manual cancellation)
  const cancelAuthCommand = vscode.commands.registerCommand(
    'unhook.cancelAuth',
    () => {
      log('unhook.cancelAuth command triggered');

      // Track auth cancellation
      analyticsService?.track('auth_sign_in_cancelled');

      provider.cancelPendingAuth();
      vscode.window.showInformationMessage('Authentication canceled');
    },
  );

  // Register retry auth command (for recovery from auth issues)
  const retryAuthCommand = vscode.commands.registerCommand(
    'unhook.retryAuth',
    async () => {
      log('unhook.retryAuth command triggered');

      try {
        // Cancel any existing auth and start fresh
        provider.cancelPendingAuth();

        // Wait a moment before starting new auth
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Start new authentication
        const session = await vscode.authentication.getSession(
          'unhook',
          ['openid', 'email', 'profile'],
          {
            createIfNone: true,
          },
        );

        if (session) {
          vscode.window.showInformationMessage(
            'Authentication retry successful',
          );
          analyticsService?.track('auth_retry_success');
        } else {
          vscode.window.showWarningMessage(
            'Authentication retry failed. Please try again.',
          );
          analyticsService?.track('auth_retry_failed');
        }
      } catch (error) {
        log('Auth retry command failed:', error);
        vscode.window.showErrorMessage(
          `Failed to retry authentication: ${(error as Error).message}`,
        );
        analyticsService?.track('auth_retry_error', {
          error: (error as Error).message,
        });
      }
    },
  );

  // Add commands to extension context
  context.subscriptions.push(
    signInCommand,
    signOutCommand,
    cancelAuthCommand,
    retryAuthCommand,
    authProviderDisposable,
  );

  return {
    authProvider: provider,
    cancelAuthCommand,
    retryAuthCommand,
    signInCommand,
    signOutCommand,
  };
}
