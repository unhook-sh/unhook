import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import type { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';
import { WebhookAuthorizationService } from '../services/webhook-authorization.service';

const log = debug('unhook:vscode:webhook-access-commands');

export function registerWebhookAccessCommands(
  context: vscode.ExtensionContext,
  authStore: AuthStore,
  analyticsService?: AnalyticsService,
) {
  log('Registering webhook access commands');

  const authorizationService = WebhookAuthorizationService.getInstance();

  // Register request webhook access command
  const requestWebhookAccessCommand = vscode.commands.registerCommand(
    'unhook.requestWebhookAccess',
    async () => {
      log('Request webhook access command triggered');

      const message = await vscode.window.showInputBox({
        placeHolder: 'e.g., I need to test webhook integration for project X',
        prompt: 'Why do you need access to this webhook? (Optional)',
      });

      log('User provided message for access request', {
        hasMessage: !!message,
        messageLength: message?.length,
      });

      try {
        log('Calling authorization service to request access');

        // Track webhook access request
        analyticsService?.track('webhook_access_requested', {
          has_message: !!message,
          message_length: message?.length || 0,
        });

        await authorizationService.requestAccess(authStore, message);
        log('Access request completed successfully');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        log('Failed to request access', { error: errorMessage });
        vscode.window.showErrorMessage(
          `Failed to request access: ${errorMessage}`,
        );
      }
    },
  );

  context.subscriptions.push(requestWebhookAccessCommand);
  log('Webhook access commands registered successfully');

  return {
    requestWebhookAccessCommand,
  };
}
