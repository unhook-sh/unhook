import * as vscode from 'vscode';
import { env } from './env';
import type { UnhookAuthProvider } from './providers/auth.provider';
import type { AuthStore } from './services/auth.service';

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
  log: (...args: unknown[]) => void,
  authProvider?: UnhookAuthProvider,
) {
  const disposable = vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri) {
      log('Handling URI:', uri.toString());
      // Handle any of our supported editor schemes
      if (uri.authority === env.NEXT_PUBLIC_VSCODE_EXTENSION_ID) {
        const code = uri.query.split('=')[1];
        if (code && authProvider) {
          try {
            // Complete the auth flow in the provider
            await authProvider.completeAuth(code);
          } catch (error) {
            log('Error completing auth:', error);
            vscode.window.showErrorMessage(
              `Failed to complete authentication: ${(error as Error).message}`,
            );
          }
        }
      }
    },
  });
  context.subscriptions.push(disposable);
  return disposable;
}
