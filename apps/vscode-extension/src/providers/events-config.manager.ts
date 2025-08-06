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
  private workspaceWatcher: vscode.FileSystemWatcher | null = null;
  private configProvider: ConfigProvider | null = null;

  private _onDidChangeConfig = new vscode.EventEmitter<void>();
  readonly onDidChangeConfig = this._onDidChangeConfig.event;

  constructor() {
    this.setupWorkspaceWatcher();
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

    // If config was cleared (e.g., due to file change), try to reload it
    if (this.configPath && this.config === null) {
      log('Config was cleared, attempting to reload from cached path', {
        configPath: this.configPath,
      });
      try {
        this.config = await loadConfig(this.configPath);
        if (this.config) {
          log('Successfully reloaded config from cached path', {
            configPath: this.configPath,
            webhookId: this.config.webhookId,
          });

          // Update config provider if available
          if (this.configProvider && this.configPath) {
            log('Updating config provider with reloaded config');
            this.configProvider.setConfig(this.config, this.configPath);
          }

          return this.config;
        }
      } catch (error) {
        log('Failed to reload config from cached path', {
          configPath: this.configPath,
          error,
        });
        // Clear the cached path if it's no longer valid
        this.configPath = null;
      }
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

  private async onConfigFileChanged() {
    log('Config file changed, reloading config and events');
    this.config = null;
    // Don't clear configPath immediately - let getConfig() try to reload from the cached path first
    // Clear the config watcher so it gets recreated with the new path
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }

    // Reload the config and update the config provider
    try {
      const newConfig = await this.getConfig();
      if (this.configProvider && this.configPath) {
        log('Updating config provider with new config');
        this.configProvider.setConfig(newConfig, this.configPath);
      }
    } catch (error) {
      log('Error reloading config after file change:', error);
      // Clear config provider on error
      if (this.configProvider) {
        log('Clearing config provider due to error');
        this.configProvider.setConfig(null, '');
      }
    }

    // Fire the config change event for all listeners
    log('Firing config change event');
    this._onDidChangeConfig.fire();
  }

  private async onConfigFileDeleted() {
    log('Config file deleted, clearing config and events');
    this.config = null;
    this.configPath = null; // Clear cached config path since file was deleted
    // Clear the config watcher so it gets recreated with the new path
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }

    // Try to find another config file or clear if none found
    try {
      const newConfig = await this.getConfig();
      if (this.configProvider && this.configPath) {
        log('Found alternative config file, updating config provider');
        this.configProvider.setConfig(newConfig, this.configPath);
      } else {
        // No config file found, clear the provider
        if (this.configProvider) {
          log('No config file found, clearing config provider');
          this.configProvider.setConfig(null, '');
        }
      }
    } catch (error) {
      log('Error searching for alternative config after deletion:', error);
      // Clear config provider on error
      if (this.configProvider) {
        log('Clearing config provider due to error');
        this.configProvider.setConfig(null, '');
      }
    }

    // Fire the config change event for all listeners
    log('Firing config change event (file deleted)');
    this._onDidChangeConfig.fire();
  }

  private setupWorkspaceWatcher() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    // Watch for config files in the first workspace folder
    const workspaceFolder = workspaceFolders[0];
    if (!workspaceFolder) {
      return;
    }

    const configPattern = new vscode.RelativePattern(
      workspaceFolder,
      'unhook.{yml,yaml,json,config.yml,config.yaml,config.json}',
    );

    log('Setting up workspace watcher for config files', {
      pattern: configPattern.pattern,
      workspaceFolder: workspaceFolder.uri.fsPath,
    });

    this.workspaceWatcher =
      vscode.workspace.createFileSystemWatcher(configPattern);
    this.workspaceWatcher.onDidCreate((uri) => {
      log('Workspace watcher detected file creation', { uri: uri.fsPath });
      this.onConfigFileChanged();
    });
    this.workspaceWatcher.onDidChange((uri) => {
      log('Workspace watcher detected file change', { uri: uri.fsPath });
      this.onConfigFileChanged();
    });
    this.workspaceWatcher.onDidDelete((uri) => {
      log('Workspace watcher detected file deletion', { uri: uri.fsPath });
      this.onConfigFileDeleted();
    });
  }

  public async forceReload(): Promise<void> {
    log('Force reloading configuration');
    this.config = null;
    this.configPath = null;

    // Reload the config and update the config provider
    try {
      const newConfig = await this.getConfig();
      if (this.configProvider && this.configPath) {
        log('Updating config provider with reloaded config');
        this.configProvider.setConfig(newConfig, this.configPath);
      } else {
        // No config file found, clear the provider
        if (this.configProvider) {
          log(
            'No config file found during force reload, clearing config provider',
          );
          this.configProvider.setConfig(null, '');
        }
      }
    } catch (error) {
      log('Error reloading config during force reload:', error);
      // Clear config provider on error
      if (this.configProvider) {
        log('Clearing config provider due to error during force reload');
        this.configProvider.setConfig(null, '');
      }
    }

    // Fire the config change event for all listeners
    log('Firing config change event (force reload)');
    this._onDidChangeConfig.fire();
  }

  public dispose() {
    // Dispose config watcher
    if (this.configWatcher) {
      this.configWatcher.dispose();
      this.configWatcher = null;
    }

    // Dispose workspace watcher
    if (this.workspaceWatcher) {
      this.workspaceWatcher.dispose();
      this.workspaceWatcher = null;
    }

    // Dispose event emitter
    this._onDidChangeConfig.dispose();
  }
}
