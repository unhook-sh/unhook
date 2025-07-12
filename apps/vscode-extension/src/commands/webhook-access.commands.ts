import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import type { AuthStore } from '../services/auth.service';
import { WebhookAuthorizationService } from '../services/webhook-authorization.service';

const _log = debug('unhook:vscode:webhook-access-commands');

export function registerWebhookAccessCommands(
  context: vscode.ExtensionContext,
  authStore: AuthStore,
) {
  const authorizationService = WebhookAuthorizationService.getInstance();

  // Register request webhook access command
  const requestWebhookAccessCommand = vscode.commands.registerCommand(
    'unhook.requestWebhookAccess',
    async () => {
      try {
        const message = await vscode.window.showInputBox({
          placeHolder: 'e.g., I need to test webhook integration for project X',
          prompt: 'Why do you need access to this webhook? (Optional)',
        });

        await authorizationService.requestAccess(authStore, message);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(
          `Failed to request access: ${errorMessage}`,
        );
      }
    },
  );

  context.subscriptions.push(requestWebhookAccessCommand);

  return {
    requestWebhookAccessCommand,
  };
}
