import { EventEmitter } from 'node:events';
import { debug } from '@unhook/logger';
import * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';

const log = debug('unhook:vscode:settings');

export interface PollingSettings {
  interval: number;
  autoPauseTimeout: number;
  autoPauseEnabled: boolean;
}

export interface StatusBarSettings {
  showPollingStatus: boolean;
  showLastEventTime: boolean;
  showPollingInterval: boolean;
}

export interface UnhookSettings {
  output: {
    autoShow: boolean;
    maxLines: number;
  };
  events: {
    maxHistory: number;
    autoClear: boolean;
  };
  notifications: {
    showForNewEvents: boolean;
  };
  delivery: {
    enabled: boolean;
  };
  configFilePath: string;
  polling: PollingSettings;
  statusBar: StatusBarSettings;
}

export class SettingsService extends EventEmitter implements vscode.Disposable {
  private static instance: SettingsService;
  private _settings: UnhookSettings;
  private disposables: vscode.Disposable[] = [];

  private constructor() {
    super();
    this._settings = this.loadSettings();

    // Listen for configuration changes
    const configDisposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('unhook')) {
        const newSettings = this.loadSettings();
        this._settings = newSettings;
        super.emit('settingsChanged', this._settings);
      }
    });
    this.disposables.push(configDisposable);
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public getSettings(): UnhookSettings {
    return this._settings;
  }

  private loadSettings(): UnhookSettings {
    const config = vscode.workspace.getConfiguration('unhook');
    const configManager = ConfigManager.getInstance();
    const isProduction = !configManager.isDevelopment();

    // In production, always disable auto-show output regardless of user settings
    const autoShowSetting = isProduction
      ? false
      : Boolean(config.get('output.autoShow'));

    return {
      configFilePath: config.get('configFilePath') ?? '',
      delivery: {
        enabled: config.get('delivery.enabled') ?? true,
      },
      events: {
        autoClear: config.get('events.autoClear') ?? false,
        maxHistory: config.get('events.maxHistory') ?? 100,
      },
      notifications: {
        showForNewEvents: config.get('notifications.showForNewEvents') ?? true,
      },
      output: {
        autoShow: autoShowSetting,
        maxLines: config.get('output.maxLines') ?? 1000,
      },
      polling: {
        autoPauseEnabled: config.get('polling.autoPauseEnabled', true),
        autoPauseTimeout: config.get('polling.autoPauseTimeout', 600000),
        interval: config.get('polling.interval', 5000),
      },
      statusBar: {
        showLastEventTime: config.get('statusBar.showLastEventTime', true),
        showPollingInterval: config.get('statusBar.showPollingInterval', true),
        showPollingStatus: config.get('statusBar.showPollingStatus', true),
      },
    };
  }

  public onSettingsChange(callback: (settings: UnhookSettings) => void): void {
    this.on('settingsChanged', callback);
  }

  public updateSettings(settings: Partial<UnhookSettings>): void {
    this._settings = { ...this._settings, ...settings };
    super.emit('settingsChanged', this._settings);
  }

  /**
   * Get polling settings
   */
  public getPollingSettings(): PollingSettings {
    return this._settings.polling;
  }

  /**
   * Get status bar settings
   */
  public getStatusBarSettings(): StatusBarSettings {
    return this._settings.statusBar;
  }

  /**
   * Update polling interval setting
   */
  public async setPollingInterval(interval: number): Promise<void> {
    const config = vscode.workspace.getConfiguration('unhook');
    await config.update(
      'polling.interval',
      interval,
      vscode.ConfigurationTarget.Global,
    );
    log('Polling interval updated', { interval });
  }

  /**
   * Update auto-pause timeout setting
   */
  public async setAutoPauseTimeout(timeout: number): Promise<void> {
    const config = vscode.workspace.getConfiguration('unhook');
    await config.update(
      'polling.autoPauseTimeout',
      timeout,
      vscode.ConfigurationTarget.Global,
    );
    log('Auto-pause timeout updated', { timeout });
  }

  /**
   * Update auto-pause enabled setting
   */
  public async setAutoPauseEnabled(enabled: boolean): Promise<void> {
    const config = vscode.workspace.getConfiguration('unhook');
    await config.update(
      'polling.autoPauseEnabled',
      enabled,
      vscode.ConfigurationTarget.Global,
    );
    log('Auto-pause enabled updated', { enabled });
  }

  /**
   * Update status bar settings
   */
  public async setStatusBarSettings(
    settings: Partial<StatusBarSettings>,
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('unhook');

    if (settings.showPollingStatus !== undefined) {
      await config.update(
        'statusBar.showPollingStatus',
        settings.showPollingStatus,
        vscode.ConfigurationTarget.Global,
      );
    }

    if (settings.showLastEventTime !== undefined) {
      await config.update(
        'statusBar.showLastEventTime',
        settings.showLastEventTime,
        vscode.ConfigurationTarget.Global,
      );
    }

    if (settings.showPollingInterval !== undefined) {
      await config.update(
        'statusBar.showPollingInterval',
        settings.showPollingInterval,
        vscode.ConfigurationTarget.Global,
      );
    }

    log('Status bar settings updated', { settings });
  }

  /**
   * Subscribe to configuration changes
   */
  public onConfigurationChange(callback?: () => void): void {
    if (callback) {
      // Store callback for later use if needed
      this.onConfigurationChange = callback;
    }
  }

  /**
   * Validate polling interval
   */
  public validatePollingInterval(interval: number): boolean {
    return interval >= 2000 && interval <= 30000;
  }

  /**
   * Validate auto-pause timeout
   */
  public validateAutoPauseTimeout(timeout: number): boolean {
    return timeout >= 300000 && timeout <= 3600000;
  }

  /**
   * Get formatted polling interval for display
   */
  public getFormattedPollingInterval(): string {
    const interval = this.getPollingSettings().interval;
    const seconds = Math.round(interval / 1000);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  /**
   * Get formatted auto-pause timeout for display
   */
  public getFormattedAutoPauseTimeout(): string {
    const timeout = this.getPollingSettings().autoPauseTimeout;
    const minutes = Math.round(timeout / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  public dispose(): void {
    log('Disposing SettingsService');
    this.removeAllListeners();
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
