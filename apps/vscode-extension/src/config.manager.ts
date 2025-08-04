import type { WebhookConfig } from '@unhook/client/config';
import { findUpConfig, loadConfig } from '@unhook/client/config';
import * as vscode from 'vscode';
import { env } from './env';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: WebhookConfig | null = null;
  private apiUrl: string;
  private dashboardUrl: string;
  context: vscode.ExtensionContext | undefined;

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
    console.log('ConfigManager.getInstance', ConfigManager.instance);
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

    // Check if running in Extension Development Host (most reliable for VS Code extensions)
    // if (vscode.env.appName.includes('Extension Development Host')) {
    //   return true;
    // }

    // Check environment variables
    // if (
    //   process.env.NODE_ENV === 'development' ||
    //   process.env.VSCODE_DEV === 'true'
    // ) {
    //   return true;
    // }

    // Check if the extension is not installed from marketplace (development scenario)
    // if (env.NEXT_PUBLIC_VSCODE_EXTENSION_ID) {
    //   const extension = vscode.extensions.getExtension(
    //     env.NEXT_PUBLIC_VSCODE_EXTENSION_ID,
    //   );
    //   if (
    //     extension &&
    //     extension.extensionPath.includes('.vscode/extensions') === false
    //   ) {
    //     return true;
    //   }
    // }

    return false;
  }

  async loadConfiguration(workspacePath?: string): Promise<void> {
    try {
      // First check for config file
      const configPath = await this.findConfigPath(workspacePath);
      let configApiUrl: string | undefined;
      let configDashboardUrl: string | undefined;
      if (configPath) {
        this.config = await loadConfig(configPath);
        if (this.config.server?.apiUrl && this.isDevelopment()) {
          console.log(
            'Using dev server apiUrl from config file',
            this.config.server.apiUrl,
          );
          configApiUrl = this.config.server.apiUrl;
        }
        if (this.config.server?.dashboardUrl && this.isDevelopment()) {
          console.log(
            'Using dev server dashboardUrl from config file',
            this.config.server.dashboardUrl,
          );
          configDashboardUrl = this.config.server.dashboardUrl;
        } else if (this.config.server?.apiUrl && this.isDevelopment()) {
          console.log(
            'Using dev server apiUrl for dashboardUrl from config file',
            this.config.server.apiUrl,
          );
          // Default dashboard URL to API URL if not specified
          configDashboardUrl = this.config.server.apiUrl;
        }
      }

      // In development mode, skip VS Code settings and use localhost
      if (this.isDevelopment()) {
        // Use config file values if available, otherwise use localhost defaults
        this.apiUrl = configApiUrl || 'http://localhost:3000';
        this.dashboardUrl = configDashboardUrl || 'http://localhost:3000';
      } else {
        // In production, check VS Code settings for server URLs
        const vscodeConfig = vscode.workspace.getConfiguration('unhook');
        const settingsApiUrl = vscodeConfig.get<string>('apiUrl');
        const settingsDashboardUrl = vscodeConfig.get<string>('dashboardUrl');

        // Precedence: config file > VS Code settings > defaults
        this.apiUrl = configApiUrl || settingsApiUrl || this.apiUrl;
        this.dashboardUrl =
          configDashboardUrl || settingsDashboardUrl || this.apiUrl;
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

  hasConfigFile(): boolean {
    return this.config !== null;
  }

  isAnalyticsEnabled(): boolean {
    // Check VS Code settings for analytics configuration
    const vscodeConfig = vscode.workspace.getConfiguration('unhook');
    return vscodeConfig.get<boolean>('analytics.enabled', false);
  }

  getApiKey(): string | null {
    // Check VS Code settings for API key
    const vscodeConfig = vscode.workspace.getConfiguration('unhook');
    const apiKey = vscodeConfig.get<string>('apiKey', '');
    return apiKey || null;
  }

  hasApiKey(): boolean {
    return !!this.getApiKey();
  }
}
