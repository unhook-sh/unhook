import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { env } from './env';
import type { UnhookAuthProvider } from './providers/auth.provider';
import type { AuthStore } from './services/auth.service';

const log = debug('unhook:vscode:uri-handler');

/**
 * Registers the VS Code URI handler for Unhook authentication.
 * @param context The extension context
 * @param authStore The authentication store
 * @param log Logger function
 * @param authProvider Optional auth provider for handling auth completion
 */
export function registerUriHandler(
  context: vscode.ExtensionContext,
  _authStore: AuthStore,
  _log: (...args: unknown[]) => void,
  authProvider?: UnhookAuthProvider,
) {
  const disposable = vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri) {
      log('Handling URI:', uri.toString());
      log('URI authority:', uri.authority);
      log('Expected authority:', env.NEXT_PUBLIC_VSCODE_EXTENSION_ID);

      // Handle any of our supported editor schemes
      if (uri.authority === env.NEXT_PUBLIC_VSCODE_EXTENSION_ID) {
        log('Authority matches, processing auth callback');

        // Decode the query string first to handle URL-encoded parameters
        const decodedQuery = decodeURIComponent(uri.query);
        log('Decoded query:', decodedQuery);

        const params = new URLSearchParams(decodedQuery);
        const code = params.get('code');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        log('Auth callback params:', {
          error,
          errorDescription,
          hasAuthProvider: !!authProvider,
          hasCode: !!code,
        });

        if (error) {
          const errorMessage =
            errorDescription || error || 'Authentication failed';
          log('Auth callback error:', errorMessage);
          vscode.window.showErrorMessage(
            `Authentication failed: ${errorMessage}`,
          );
          return;
        }

        if (code && authProvider) {
          try {
            log('Attempting to complete auth with code');
            // Complete the auth flow in the provider
            await authProvider.completeAuth(code);
            log('Auth completion successful');
          } catch (error) {
            log('Error completing auth:', error);
            vscode.window.showErrorMessage(
              `Failed to complete authentication: ${(error as Error).message}`,
            );
          }
        } else if (!authProvider) {
          log('No auth provider available for completing authentication');
          vscode.window.showErrorMessage(
            'Authentication provider not available. Please try reloading the extension.',
          );
        } else if (!code) {
          log('No authorization code received in callback');
          vscode.window.showErrorMessage(
            'No authorization code received. Please try signing in again.',
          );
        }
      } else {
        log('URI authority does not match expected extension ID, ignoring');
      }
    },
  });
  context.subscriptions.push(disposable);
  return disposable;
}
