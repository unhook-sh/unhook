import type { WebhookConfig } from '@unhook/client/config';
import { findUpConfig, loadConfig } from '@unhook/client/config';
import * as vscode from 'vscode';
import { env } from './env';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: WebhookConfig | null = null;
  private apiUrl = 'https://unhook.sh';
  private dashboardUrl = 'https://unhook.sh';
  private context: vscode.ExtensionContext | undefined;

  private constructor() {
    // Set default URLs based on development mode and environment variables
    if (this.isDevelopment()) {
      this.apiUrl = 'http://localhost:3000';
      this.dashboardUrl = 'http://localhost:3000';
    } else {
      // Use environment variable if available, otherwise default to production
      this.apiUrl = env.NEXT_PUBLIC_API_URL || 'https://unhook.sh';
      this.dashboardUrl = env.NEXT_PUBLIC_API_URL || 'https://unhook.sh';
    }
  }

  static getInstance(context?: vscode.ExtensionContext): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    // Store context if provided
    if (context) {
      ConfigManager.instance.context = context;
      // Re-check development mode with the context
      if (ConfigManager.instance.isDevelopment()) {
        ConfigManager.instance.apiUrl = 'http://localhost:3000';
        ConfigManager.instance.dashboardUrl = 'http://localhost:3000';
      } else {
        // Use environment variable if available, otherwise default to production
        ConfigManager.instance.apiUrl =
          env.NEXT_PUBLIC_API_URL || 'https://unhook.sh';
        ConfigManager.instance.dashboardUrl =
          env.NEXT_PUBLIC_API_URL || 'https://unhook.sh';
      }
    }
    return ConfigManager.instance;
  }

  public isDevelopment(): boolean {
    // Check ExtensionMode from context if available
    // if (
    //   this.context &&
    //   this.context.extensionMode === vscode.ExtensionMode.Development
    // ) {
    //   return true;
    // }

    // // Check if running in Extension Development Host (most reliable for VS Code extensions)
    // if (vscode.env.appName.includes('Extension Development Host')) {
    //   return true;
    // }

    // Check environment variables
    if (
      // process.env.NODE_ENV === 'development' ||
      process.env.VSCODE_DEV === 'true'
    ) {
      return true;
    }

    // // Check if the extension is not installed from marketplace (development scenario)
    // const extension = vscode.extensions.getExtension(
    //   env.NEXT_PUBLIC_VSCODE_EXTENSION_ID,
    // );
    // if (
    //   extension &&
    //   extension.extensionPath.includes('.vscode/extensions') === false
    // ) {
    //   return true;
    // }

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

        // Update URLs from config (but don't override environment variable in production)
        if (this.config.server?.apiUrl && this.isDevelopment()) {
          this.apiUrl = this.config.server.apiUrl;
        }
        if (this.config.server?.dashboardUrl && this.isDevelopment()) {
          this.dashboardUrl = this.config.server.dashboardUrl;
        } else if (this.config.server?.apiUrl && this.isDevelopment()) {
          // Default dashboard URL to API URL if not specified
          this.dashboardUrl = this.config.server.apiUrl;
        }
      }

      // Log current configuration
      console.log('Unhook Config Manager:', {
        apiUrl: this.apiUrl,
        configFound: !!configPath,
        dashboardUrl: this.dashboardUrl,
        envApiUrl: env.NEXT_PUBLIC_API_URL,
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
