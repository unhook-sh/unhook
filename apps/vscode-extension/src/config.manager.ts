import type { WebhookConfig } from '@unhook/client/config';
import { findUpConfig, loadConfig } from '@unhook/client/config';
import * as vscode from 'vscode';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: WebhookConfig | null = null;
  private apiUrl = 'https://unhook.sh';
  private dashboardUrl = 'https://unhook.sh';
  private context: vscode.ExtensionContext | undefined;

  private constructor() {
    // Default to production URLs
    // These will only be overridden in actual development scenarios
  }

  static getInstance(context?: vscode.ExtensionContext): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    // Store context if provided
    if (context) {
      ConfigManager.instance.context = context;
      // Only override URLs if we're truly in development mode
      // Check for Extension Development Host which is the most reliable indicator
      if (
        ConfigManager.instance.context.extensionMode ===
          vscode.ExtensionMode.Development ||
        vscode.env.appName.includes('Extension Development Host')
      ) {
        ConfigManager.instance.apiUrl = 'http://localhost:3000';
        ConfigManager.instance.dashboardUrl = 'http://localhost:3000';
      }
    }
    return ConfigManager.instance;
  }

  private isDevelopment(): boolean {
    // Only consider it development mode if we have explicit indicators
    // Priority 1: Extension context mode (most reliable)
    if (
      this.context &&
      this.context.extensionMode === vscode.ExtensionMode.Development
    ) {
      return true;
    }

    // Priority 2: Extension Development Host (VS Code's development environment)
    if (vscode.env.appName.includes('Extension Development Host')) {
      return true;
    }

    // Don't rely on NODE_ENV or other environment variables as they may not be
    // available in the packaged extension running on user's machines
    return false;
  }

  async loadConfiguration(workspacePath?: string): Promise<void> {
    try {
      // First check VS Code settings for server URLs
      const vscodeConfig = vscode.workspace.getConfiguration('unhook');
      const settingsApiUrl = vscodeConfig.get<string>('server.apiUrl');
      const settingsDashboardUrl = vscodeConfig.get<string>(
        'server.dashboardUrl',
      );

      if (settingsApiUrl) {
        this.apiUrl = settingsApiUrl;
        this.dashboardUrl = settingsDashboardUrl || settingsApiUrl;
        console.log('Using server URLs from VS Code settings');
        return;
      }

      // Then check for config file
      const configPath = await this.findConfigPath(workspacePath);
      if (configPath) {
        this.config = await loadConfig(configPath);

        // Update URLs from config
        if (this.config.server?.apiUrl) {
          this.apiUrl = this.config.server.apiUrl;
        }
        if (this.config.server?.dashboardUrl) {
          this.dashboardUrl = this.config.server.dashboardUrl;
        } else if (this.config.server?.apiUrl) {
          // Default dashboard URL to API URL if not specified
          this.dashboardUrl = this.config.server.apiUrl;
        }
      }

      // Log current configuration
      console.log('Unhook Config Manager:', {
        apiUrl: this.apiUrl,
        configFound: !!configPath,
        dashboardUrl: this.dashboardUrl,
        isDevelopment: this.isDevelopment(),
      });
    } catch (error) {
      console.error('Failed to load Unhook configuration:', error);
    }
  }

  private async findConfigPath(workspacePath?: string): Promise<string | null> {
    // First check VS Code settings
    const configPath = vscode.workspace
      .getConfiguration('unhook')
      .get<string>('configFilePath');

    if (configPath) {
      return configPath;
    }

    // Then look for config file in workspace
    if (workspacePath) {
      return await findUpConfig({ cwd: workspacePath });
    }

    // Finally check all workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      for (const folder of workspaceFolders) {
        const found = await findUpConfig({ cwd: folder.uri.fsPath });
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  getDashboardUrl(): string {
    return this.dashboardUrl;
  }

  getConfig(): WebhookConfig | null {
    return this.config;
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  isSelfHosted(): boolean {
    return this.apiUrl !== 'https://unhook.sh';
  }

  // Reload configuration when settings change
  async reload(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspacePath = workspaceFolders?.[0]?.uri.fsPath;
    await this.loadConfiguration(workspacePath);
  }
}
