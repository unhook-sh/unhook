import { EventEmitter } from 'node:events';
import * as vscode from 'vscode';

export interface UnhookSettings {
  output: {
    autoShow: boolean;
    maxLines: number;
  };
  events: {
    maxHistory: number;
    autoClear: boolean;
    pollIntervalMs: number;
  };
  notifications: {
    showForNewEvents: boolean;
  };
  delivery: {
    enabled: boolean;
  };
  configFilePath: string;
}

export class SettingsService extends EventEmitter implements vscode.Disposable {
  private static instance: SettingsService;
  private _settings: UnhookSettings;

  private constructor() {
    super();
    this._settings = this.loadSettings();

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('unhook')) {
        const newSettings = this.loadSettings();
        this._settings = newSettings;
        super.emit('settingsChanged', this._settings);
      }
    });
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
    return {
      configFilePath: config.get('configFilePath') ?? '',
      delivery: {
        enabled: config.get('delivery.enabled') ?? true,
      },
      events: {
        autoClear: config.get('events.autoClear') ?? false,
        maxHistory: config.get('events.maxHistory') ?? 100,
        pollIntervalMs: config.get('events.pollIntervalMs') ?? 2000,
      },
      notifications: {
        showForNewEvents: config.get('notifications.showForNewEvents') ?? true,
      },
      output: {
        autoShow: config.get('output.autoShow') ?? false,
        maxLines: config.get('output.maxLines') ?? 1000,
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

  public dispose(): void {
    this.removeAllListeners();
  }
}
