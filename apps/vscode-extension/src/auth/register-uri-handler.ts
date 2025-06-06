import * as vscode from 'vscode';
import { env } from '../env';
import type { AuthStore } from '../stores/auth-store';

/**
 * Registers the VS Code URI handler for Unhook authentication.
 * @param context The extension context
 * @param authStore The authentication store
 * @param log Logger function
 */
export function registerUriHandler(
  context: vscode.ExtensionContext,
  authStore: AuthStore,
  log: (...args: unknown[]) => void,
) {
  const disposable = vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri) {
      log('Handling URI:', uri.toString());
      // Handle any of our supported editor schemes
      if (uri.authority === env.NEXT_PUBLIC_VSCODE_EXTENSION_ID) {
        const code = uri.query.split('=')[1];
        if (code) {
          await authStore.exchangeAuthCode({ code });
          vscode.window.showInformationMessage(
            'Successfully signed into Unhook',
          );
          // The auth provider will handle the code exchange
          vscode.authentication.getSession(
            'unhook',
            ['openid', 'email', 'profile'],
            {
              createIfNone: true,
            },
          );
        }
      }
    },
  });
  context.subscriptions.push(disposable);
  return disposable;
}
