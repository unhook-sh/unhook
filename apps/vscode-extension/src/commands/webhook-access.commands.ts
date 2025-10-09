import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';
import { env } from '../env';
import type { AnalyticsService } from '../services/analytics.service';
import type { AuthStore } from '../services/auth.service';

const log = debug('unhook:vscode:webhook-access-commands');

export function registerWebhookAccessCommands(
  context: vscode.ExtensionContext,
  _authStore: AuthStore,
  analyticsService?: AnalyticsService,
) {
  log('Registering webhook access commands');

  // Register request webhook access command
  const requestWebhookAccessCommand = vscode.commands.registerCommand(
    'unhook.requestWebhookAccess',
    async () => {
      log('Request webhook access command triggered');

      // Get webhook URL from config
      const configManager = ConfigManager.getInstance();
      const webhookUrl = configManager.getConfig()?.webhookUrl;

      if (!webhookUrl) {
        vscode.window.showErrorMessage(
          'No webhook URL found in configuration. Please set up a webhook first.',
        );
        return;
      }

      log('Redirecting to auth-code page to switch organization', {
        webhookUrl,
      });

      try {
        // Build auth URL with webhook URL parameter
        const authUrl = new URL('/app/auth-code', configManager.getApiUrl());

        // Get editor scheme for redirect
        const appName = vscode.env.appName.toLowerCase();
        let editorScheme = 'vscode';
        if (appName.includes('cursor')) {
          editorScheme = 'cursor';
        } else if (appName.includes('insiders')) {
          editorScheme = 'vscode-insiders';
        } else if (appName.includes('windsurf')) {
          editorScheme = 'windsurf';
        }

        const redirectUri = `${editorScheme}://${env.NEXT_PUBLIC_VSCODE_EXTENSION_ID}`;

        authUrl.searchParams.set('redirectTo', redirectUri);
        authUrl.searchParams.set('source', 'extension');
        authUrl.searchParams.set('webhookUrl', webhookUrl);

        // Track webhook access redirect
        analyticsService?.track('webhook_access_org_switch_started', {
          has_webhook_url: !!webhookUrl,
        });

        log('Opening browser for organization switch', {
          authUrl: authUrl.toString(),
        });

        // Open browser
        await vscode.env.openExternal(vscode.Uri.parse(authUrl.toString()));

        vscode.window.showInformationMessage(
          'Select an organization with access to this webhook in your browser.',
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        log('Failed to redirect for org switch', { error: errorMessage });
        vscode.window.showErrorMessage(
          `Failed to open browser: ${errorMessage}`,
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
