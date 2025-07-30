import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  findUpConfig,
  loadConfig,
  type WebhookConfig,
} from '@unhook/client/config';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { SettingsService } from '../services/settings.service';
import type { ConfigProvider } from './config.provider';

const log = debug('unhook:vscode:events-config-manager');

export class EventsConfigManager {
  private config: WebhookConfig | null = null;
  private configPath: string | null = null;
  private configWatcher: vscode.FileSystemWatcher | null = null;
  private configProvider: ConfigProvider | null = null;
  private onConfigChanged: (() => void) | null = null;

  constructor(onConfigChanged?: () => void) {
    this.onConfigChanged = onConfigChanged || null;
  }

  public setConfigProvider(configProvider: ConfigProvider) {
    this.configProvider = configProvider;
  }

  public async getConfig(): Promise<WebhookConfig | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workspaceFolder = workspaceFolders?.[0]?.uri.fsPath;
    const settings = SettingsService.getInstance().getSettings();
    const configFilePath = settings.configFilePath;

    // Return cached config if available
    if (this.config) {
      return this.config;
    }

    let configPath: string | null = null;

    // First check if we have a cached config path
    if (this.configPath && existsSync(this.configPath)) {
      configPath = this.configPath;
    } else if (configFilePath && configFilePath.trim() !== '') {
      configPath = configFilePath;
    } else {
      if (!workspaceFolder) {
        return null;
      }

      // Try to find config in the first workspace folder
      configPath = await findUpConfig({ cwd: workspaceFolder });

      // If not found in first folder, try all workspace folders
      if (!configPath && workspaceFolders && workspaceFolders.length > 1) {
        for (const folder of workspaceFolders) {
          const foundPath = await findUpConfig({ cwd: folder.uri.fsPath });
          if (foundPath) {
            configPath = foundPath;
            break;
          }
        }
      }

      // If still not found, try direct file check in workspace root
      if (!configPath && workspaceFolder) {
        const possibleConfigFiles = [
          'unhook.yml',
          'unhook.yaml',
          'unhook.json',
          'unhook.config.yml',
          'unhook.config.yaml',
          'unhook.config.json',
        ];

        for (const configFile of possibleConfigFiles) {
          const fullPath = join(workspaceFolder, configFile);
          if (existsSync(fullPath)) {
            configPath = fullPath;
            break;
          }
        }
      }
    }

    if (!configPath) {
      return null;
    }

    // Cache the config path for future use
    this.configPath = configPath;

    // Set up file watcher if not already set
    this.setupConfigWatcher(configPath);
    this.config = await loadConfig(configPath);
    log('Config loaded successfully', {
      configPath,
      webhookId: this.config.webhookId,
    });

    // Update config provider if available
    if (this.configProvider && this.configPath) {
      this.configProvider.setConfig(this.config, this.configPath);
    }

    return this.config;
  }

  private setupConfigWatcher(configPath: string) {
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }
    if (!configPath) return;
    this.configWatcher = vscode.workspace.createFileSystemWatcher(configPath);
    this.configWatcher.onDidChange(() => this.onConfigFileChanged());
    this.configWatcher.onDidCreate(() => this.onConfigFileChanged());
    this.configWatcher.onDidDelete(() => this.onConfigFileChanged());
  }

  private onConfigFileChanged() {
    log('Config file changed, reloading config and events');
    this.config = null;
    this.configPath = null; // Clear cached config path
    // Clear the config watcher so it gets recreated with the new path
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }

    // Clear config provider
    if (this.configProvider) {
      this.configProvider.setConfig(null, '');
    }

    // Notify that config has changed
    if (this.onConfigChanged) {
      this.onConfigChanged();
    }
  }

  public dispose() {
    // Dispose config watcher
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }
  }
}
