import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { createConfigContentWithWebhookId } from '../utils/config-templates';
import type { AuthStore } from './auth.service';

const log = debug('unhook:vscode:first-time-user');

const FIRST_TIME_USER_KEY = 'unhook.firstTimeUser';
const ANALYTICS_CONSENT_KEY = 'unhook.analytics.consentAsked';

export class FirstTimeUserService {
  private authStore?: AuthStore;

  constructor(private readonly context: vscode.ExtensionContext) {}

  setAuthStore(authStore: AuthStore): void {
    this.authStore = authStore;
  }

  async isFirstTimeUser(): Promise<boolean> {
    const isFirstTime =
      this.context.globalState.get<boolean>(FIRST_TIME_USER_KEY);
    // If the key doesn't exist, it's a first-time user
    const result = isFirstTime === undefined || isFirstTime === true;
    log('Checking if first-time user', {
      isFirstTime: result,
      key: FIRST_TIME_USER_KEY,
      storedValue: isFirstTime,
    });
    return result;
  }

  async hasAskedForAnalyticsConsent(): Promise<boolean> {
    return (
      this.context.globalState.get<boolean>(ANALYTICS_CONSENT_KEY) === true
    );
  }

  async markAnalyticsConsentAsked(): Promise<void> {
    await this.context.globalState.update(ANALYTICS_CONSENT_KEY, true);
    log('Marked analytics consent as asked');
  }

  async markAsExistingUser(): Promise<void> {
    await this.context.globalState.update(FIRST_TIME_USER_KEY, false);
    log('Marked user as existing user');
  }

  // Method for testing - reset first-time user state
  async resetFirstTimeUserState(): Promise<void> {
    await this.context.globalState.update(FIRST_TIME_USER_KEY, undefined);
    await this.context.globalState.update(ANALYTICS_CONSENT_KEY, undefined);
    log('Reset first-time user state for testing');
  }

  async promptForAnalyticsConsent(): Promise<boolean> {
    // Check if VS Code telemetry is disabled - if so, don't ask for consent
    if (!vscode.env.isTelemetryEnabled) {
      log('VS Code telemetry is disabled, skipping analytics consent prompt');
      await this.markAnalyticsConsentAsked();
      return false;
    }

    const result = await vscode.window.showInformationMessage(
      'Help improve Unhook by sharing anonymous usage data? This helps us understand how developers use webhooks and improve the extension. No personal information is collected.',
      'Yes',
      'No',
      'Learn More',
    );

    let enabled = false;

    switch (result) {
      case 'Yes':
        enabled = true;
        break;
      case 'Learn More':
        await vscode.env.openExternal(
          vscode.Uri.parse('https://docs.unhook.sh'),
        );
        // Ask again after they learn more
        return this.promptForAnalyticsConsent();
      default:
        // User chose "No, Thanks" or dismissed the notification
        enabled = false;
        break;
    }

    // Update the analytics setting
    const config = vscode.workspace.getConfiguration('unhook');
    await config.update('analytics.enabled', enabled, true);

    // Mark that we've asked for consent
    await this.markAnalyticsConsentAsked();

    if (enabled) {
      vscode.window.showInformationMessage(
        'Analytics enabled. You can change this setting anytime in the Unhook extension settings.',
      );
    }

    return enabled;
  }

  async promptForUnhookYmlCreation(): Promise<void> {
    const result = await vscode.window.showInformationMessage(
      'Welcome to Unhook! Would you like to create an unhook.yml configuration file to get started?',
      'Yes',
      'No',
      'Learn More',
    );

    switch (result) {
      case 'Yes':
        await this.createUnhookYml();
        break;
      case 'Learn More':
        await vscode.env.openExternal(
          vscode.Uri.parse('https://unhook.sh/docs/configuration'),
        );
        break;
      default:
        // User chose "No, Thanks" or dismissed the notification
        break;
    }

    // Mark user as existing user after showing the prompt
    await this.markAsExistingUser();
  }

  private async createUnhookYml(): Promise<void> {
    try {
      // Get the workspace folder
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage(
          'No workspace folder found. Please open a folder first.',
        );
        return;
      }

      const workspaceRoot = workspaceFolders[0]?.uri;
      if (!workspaceRoot) {
        log('No workspace folder found');
        return;
      }

      const configUri = vscode.Uri.joinPath(workspaceRoot, 'unhook.yml');

      // Check if file already exists
      try {
        await vscode.workspace.fs.stat(configUri);
        const overwrite = await vscode.window.showWarningMessage(
          'unhook.yml already exists. Do you want to overwrite it?',
          'Yes',
          'No',
        );
        if (overwrite !== 'Yes') {
          return;
        }
      } catch {
        // File doesn't exist, which is what we want
      }

      // Create the configuration content with the webhook ID fetched from the user's account
      const configContent = await createConfigContentWithWebhookId(
        this.authStore,
      );

      // Write the template file
      const encoder = new TextEncoder();
      await vscode.workspace.fs.writeFile(
        configUri,
        encoder.encode(configContent),
      );

      // Open the file in the editor
      const document = await vscode.workspace.openTextDocument(configUri);
      const editor = await vscode.window.showTextDocument(document);

      // Find and select the "YOUR_WEBHOOK_ID" text
      const text = document.getText();
      const webhookIdIndex = text.indexOf('YOUR_WEBHOOK_ID');
      if (webhookIdIndex !== -1) {
        const position = document.positionAt(webhookIdIndex);
        const endPosition = document.positionAt(
          webhookIdIndex + 'YOUR_WEBHOOK_ID'.length,
        );
        editor.selection = new vscode.Selection(position, endPosition);
        editor.revealRange(new vscode.Range(position, endPosition));
      }

      vscode.window.showInformationMessage('Created unhook.yml.');

      log('Created unhook.yml configuration file');
    } catch (error) {
      log('Failed to create unhook.yml', error);
      vscode.window.showErrorMessage(
        `Failed to create unhook.yml: ${(error as Error).message}`,
      );
    }
  }
}
