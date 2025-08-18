import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
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

  setupWorkspaceChangeListener(): void {
    // Listen for workspace folder changes
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      log(
        'Workspace folders changed, checking if user should be marked as existing',
      );
      await this.markAsExistingUserIfHasConfig();
    });

    // Listen for file creation in workspace
    const fileWatcher = vscode.workspace.createFileSystemWatcher(
      '**/unhook.{yml,yaml,json,js,cjs,ts}',
    );

    fileWatcher.onDidCreate(async (uri) => {
      log('Configuration file created', { uri: uri.fsPath });
      await this.markAsExistingUserIfHasConfig();
    });

    // Also watch for config files with config prefix
    const configFileWatcher = vscode.workspace.createFileSystemWatcher(
      '**/unhook.config.{yml,yaml,json,js,cjs,ts}',
    );

    configFileWatcher.onDidCreate(async (uri) => {
      log('Configuration file created', { uri: uri.fsPath });
      await this.markAsExistingUserIfHasConfig();
    });
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

  async hasConfigurationFile(): Promise<boolean> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return false;
      }

      // Check for common configuration file names
      const configFiles = [
        'unhook.yml',
        'unhook.yaml',
        'unhook.json',
        'unhook.js',
        'unhook.cjs',
        'unhook.ts',
        'unhook.config.yml',
        'unhook.config.yaml',
        'unhook.config.json',
        'unhook.config.js',
        'unhook.config.cjs',
        'unhook.config.ts',
      ];

      for (const folder of workspaceFolders) {
        for (const configFile of configFiles) {
          const configUri = vscode.Uri.joinPath(folder.uri, configFile);
          try {
            await vscode.workspace.fs.stat(configUri);
            log('Configuration file found', {
              configFile,
              folder: folder.uri.fsPath,
            });
            return true;
          } catch {
            // File doesn't exist, continue checking
          }
        }
      }

      log('No configuration file found in workspace');
      return false;
    } catch (error) {
      log('Error checking for configuration files', error);
      return false;
    }
  }

  async hasWebhooks(): Promise<boolean> {
    if (!this.authStore?.isSignedIn) {
      return false;
    }

    try {
      const webhooks = await this.authStore.api.webhooks.all.query();
      const hasWebhooks = webhooks && webhooks.length > 0;
      log('Checking if user has webhooks', {
        count: webhooks?.length,
        hasWebhooks,
      });
      return hasWebhooks;
    } catch (error) {
      log('Error checking for webhooks', error);
      return false;
    }
  }

  async shouldShowWorkspaceConfigPrompts(): Promise<boolean> {
    // Check if user has chosen "do not show again"
    const doNotShowAgain = this.context.globalState.get(
      'doNotShowWorkspaceConfigPrompts',
      false,
    );
    if (doNotShowAgain) {
      log(
        'Not showing workspace config prompts - user chose "do not show again"',
      );
      return false;
    }

    // Always show prompts if there's no config file in the workspace
    // This is about workspace configuration, not user onboarding
    const hasConfig = await this.hasConfigurationFile();

    const shouldShow = !hasConfig;

    log('Checking if should show workspace config prompts', {
      doNotShowAgain,
      hasConfig,
      reason: 'No configuration file found in workspace',
      shouldShow,
    });

    return shouldShow;
  }

  private isShowingPrompts = false;
  private promptTimeout: NodeJS.Timeout | null = null;

  async checkAndShowWorkspaceConfigPromptsIfNeeded(): Promise<void> {
    // Prevent duplicate prompts
    if (this.isShowingPrompts) {
      log('Already showing workspace config prompts, skipping duplicate call');
      return;
    }

    const shouldShow = await this.shouldShowWorkspaceConfigPrompts();
    if (!shouldShow) {
      log(
        'Not showing workspace config prompts - config file already exists or user chose "do not show again"',
      );
      return;
    }

    // Set flag to prevent duplicates
    this.isShowingPrompts = true;

    log('Showing workspace config prompts for new workspace');

    // Clear any existing timeout
    if (this.promptTimeout) {
      clearTimeout(this.promptTimeout);
    }

    // Show analytics consent prompt first (only if not asked before), then config creation prompt
    this.promptTimeout = setTimeout(async () => {
      try {
        // Check if we've already asked for analytics consent
        const hasAskedForConsent = await this.hasAskedForAnalyticsConsent();
        log('Analytics consent check', { hasAskedForConsent });
        if (!hasAskedForConsent) {
          log('Showing analytics consent prompt');
          await this.promptForAnalyticsConsent();
        }

        // Show config creation prompt after a short delay
        setTimeout(() => {
          log('Showing workspace config creation prompt');
          this.promptForWorkspaceConfigCreation();
        }, 500);
      } finally {
        // Reset flag after prompts are shown
        this.isShowingPrompts = false;
      }
    }, 1000);
  }

  async forceShowFirstTimePrompts(): Promise<void> {
    log('Force showing first-time prompts for user');

    // Clear any existing timeout
    if (this.promptTimeout) {
      clearTimeout(this.promptTimeout);
    }

    // Set flag to prevent duplicates
    this.isShowingPrompts = true;

    // Show analytics consent prompt first, then config creation prompt
    this.promptTimeout = setTimeout(async () => {
      try {
        // Check if we've already asked for analytics consent
        const hasAskedForConsent = await this.hasAskedForAnalyticsConsent();
        log('Analytics consent check (forced)', { hasAskedForConsent });
        if (!hasAskedForConsent) {
          log('Showing analytics consent prompt (forced)');
          await this.promptForAnalyticsConsent();
        }

        // Show config creation prompt after a short delay
        setTimeout(() => {
          log('Showing workspace config creation prompt (forced)');
          this.promptForWorkspaceConfigCreation();
        }, 500);
      } finally {
        // Reset flag after prompts are shown
        this.isShowingPrompts = false;
      }
    }, 1000);
  }

  async resetPromptFlags(): Promise<void> {
    this.isShowingPrompts = false;
    if (this.promptTimeout) {
      clearTimeout(this.promptTimeout);
      this.promptTimeout = null;
    }
    log('Reset prompt flags and cleared timeout');
  }

  getPromptState(): { isShowingPrompts: boolean; hasTimeout: boolean } {
    return {
      hasTimeout: this.promptTimeout !== null,
      isShowingPrompts: this.isShowingPrompts,
    };
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

  async markAsExistingUserIfHasConfig(): Promise<void> {
    const hasConfig = await this.hasConfigurationFile();
    if (hasConfig) {
      await this.markAsExistingUser();
      log('Marked user as existing user because configuration file exists');
    }
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

  async promptForWorkspaceConfigCreation(): Promise<void> {
    // Check if there's already a configuration file
    const hasConfig = await this.hasConfigurationFile();
    if (hasConfig) {
      log(
        'Configuration file already exists, skipping workspace config creation prompt',
      );
      return;
    }

    const result = await vscode.window.showInformationMessage(
      "This workspace doesn't have an Unhook configuration file. Would you like to create one to get started?",
      'Yes',
      'No',
      'Do not show again',
    );

    switch (result) {
      case 'Yes':
        await this.createWorkspaceConfig();
        break;
      case 'Do not show again':
        await this.markDoNotShowWorkspaceConfigPrompts();
        vscode.window.showInformationMessage(
          "You won't see this notification again. You can always create a config file manually or reset this preference in the command palette.",
        );
        break;
      default:
        // User chose "No" or dismissed the notification
        break;
    }
  }

  private async createWorkspaceConfig(): Promise<void> {
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

      // Check if user is signed in and has webhooks
      if (!this.authStore?.isSignedIn) {
        vscode.window.showErrorMessage(
          'Please sign in to Unhook before creating a configuration file.',
        );
        return;
      }

      // Fetch available webhooks for the user to choose from
      let webhooks: Array<{
        id: string;
        name: string;
        createdAt: Date | null;
      }> = [];
      let selectedWebhookId: string | undefined;

      try {
        webhooks = await this.authStore.api.webhooks.all.query();
        log('Available webhooks:', webhooks);
      } catch (error) {
        log('Failed to fetch webhooks:', error);
        vscode.window.showErrorMessage(
          'Failed to fetch your webhooks. Please try again or sign in again.',
        );
        return;
      }

      if (!webhooks || webhooks.length === 0) {
        // No webhooks available, offer to create one
        const createWebhook = await vscode.window.showInformationMessage(
          'No webhooks found in your account. Would you like to create one first?',
          'Yes, Create Webhook',
          'No, Use Default',
        );

        if (createWebhook === 'Yes, Create Webhook') {
          // Execute the create webhook command
          await vscode.commands.executeCommand('unhook.createWebhook');
          return; // Exit this method, let the create webhook command handle everything
        }

        // Use default webhook ID
        selectedWebhookId = 'wh_example';
      } else {
        // Let user choose from available webhooks or create a new one
        const webhookOptions = [
          ...webhooks.map((webhook) => ({
            description: `ID: ${webhook.id} • Created: ${webhook.createdAt ? new Date(webhook.createdAt).toLocaleDateString() : 'Unknown'}`,
            isExisting: true,
            label: webhook.name || 'Unnamed Webhook',
            webhookId: webhook.id,
          })),
          {
            description: 'Create a new webhook for this workspace',
            isExisting: false,
            label: '➕ Create New Webhook',
            webhookId: 'create_new',
          },
        ];

        const webhookPick = await vscode.window.showQuickPick(webhookOptions, {
          placeHolder: 'Select a webhook to configure or create a new one',
          title: 'Choose Webhook for Configuration',
        });

        if (!webhookPick) {
          return; // User cancelled
        }

        if (webhookPick.isExisting) {
          // User selected an existing webhook
          selectedWebhookId = webhookPick.webhookId;
        } else {
          // User wants to create a new webhook
          log('User chose to create a new webhook');

          // Execute the create webhook command with autoCreateConfig flag
          await vscode.commands.executeCommand('unhook.createWebhook', true);
          return; // Exit this method, let the create webhook command handle everything
        }
      }

      // Create the configuration content with the selected webhook ID
      const { createConfigContentWithSpecificWebhookId } = await import(
        '../utils/config-templates'
      );
      const configContent =
        createConfigContentWithSpecificWebhookId(selectedWebhookId);

      // Write the template file
      const encoder = new TextEncoder();
      await vscode.workspace.fs.writeFile(
        configUri,
        encoder.encode(configContent),
      );

      // Open the file in the editor
      const document = await vscode.workspace.openTextDocument(configUri);
      const editor = await vscode.window.showTextDocument(document);

      // Find and select the webhook ID text
      const text = document.getText();
      const webhookIdIndex = text.indexOf(selectedWebhookId);
      if (webhookIdIndex !== -1) {
        const position = document.positionAt(webhookIdIndex);
        const endPosition = document.positionAt(
          webhookIdIndex + selectedWebhookId.length,
        );
        editor.selection = new vscode.Selection(position, endPosition);
        editor.revealRange(new vscode.Range(position, endPosition));
      }

      vscode.window.showInformationMessage(
        `Created unhook.yml with webhook ID: ${selectedWebhookId}`,
      );

      log('Created unhook.yml configuration file');

      // Trigger configuration reload and events fetch after creating the file
      await this.triggerConfigurationReload();
    } catch (error) {
      log('Failed to create unhook.yml', error);
      vscode.window.showErrorMessage(
        `Failed to create unhook.yml: ${(error as Error).message}`,
      );
    }
  }

  private async triggerConfigurationReload(): Promise<void> {
    try {
      log('Triggering configuration reload after unhook.yml creation');

      // Get the workspace folder path
      const workspaceFolders = vscode.workspace.workspaceFolders;
      const workspacePath = workspaceFolders?.[0]?.uri.fsPath;

      if (!workspacePath) {
        log('No workspace path found for configuration reload');
        return;
      }

      // Add a small delay to ensure the file system has settled
      await new Promise((resolve) => setTimeout(resolve, 300));

      log('About to trigger events refresh command');

      // Force the EventsConfigManager to reload configuration
      // This will clear the cache and trigger a reload of the new file
      log('About to trigger events refresh command');
      vscode.commands.executeCommand('unhook.events.refresh');

      log('Events refresh command triggered');

      log('Configuration reload triggered successfully');
    } catch (error) {
      log('Failed to trigger configuration reload', error);
    }
  }

  async markDoNotShowWorkspaceConfigPrompts(): Promise<void> {
    await this.context.globalState.update(
      'doNotShowWorkspaceConfigPrompts',
      true,
    );
    log('User chose "do not show again" for workspace config prompts');
  }

  async resetDoNotShowWorkspaceConfigPrompts(): Promise<void> {
    await this.context.globalState.update(
      'doNotShowWorkspaceConfigPrompts',
      false,
    );
    log('Reset "do not show again" preference for workspace config prompts');
  }

  async getDoNotShowWorkspaceConfigPromptsStatus(): Promise<boolean> {
    return this.context.globalState.get(
      'doNotShowWorkspaceConfigPrompts',
      false,
    );
  }
}
