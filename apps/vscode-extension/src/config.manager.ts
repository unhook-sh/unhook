import type { WebhookConfig } from '@unhook/client/config';
import { findUpConfig, loadConfig } from '@unhook/client/config';
import * as vscode from 'vscode';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: WebhookConfig | null = null;
  private apiUrl = 'https://api.unhook.sh';
  private dashboardUrl = 'https://unhook.sh';

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
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
    return this.apiUrl !== 'https://api.unhook.sh';
  }

  // Reload configuration when settings change
  async reload(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspacePath = workspaceFolders?.[0]?.uri.fsPath;
    await this.loadConfiguration(workspacePath);
  }
}
