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
  };
  configFilePath: string;
}

export class SettingsService extends EventEmitter implements vscode.Disposable {
  private static instance: SettingsService;
  private _settings: UnhookSettings;

  private constructor() {
    super();
    this._settings = this.loadSettings();
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
      output: {
        autoShow: config.get('output.autoShow') ?? true,
        maxLines: config.get('output.maxLines') ?? 1000,
      },
      events: {
        maxHistory: config.get('events.maxHistory') ?? 100,
        autoClear: config.get('events.autoClear') ?? false,
      },
      configFilePath: config.get('configFilePath') ?? '',
    };
  }

  public onSettingsChange(callback: (settings: UnhookSettings) => void): void {
    this.on('settingsChanged', callback);
  }

  public updateSettings(settings: Partial<UnhookSettings>): void {
    this._settings = { ...this._settings, ...settings };
    this.emit('settingsChanged', this._settings);
  }

  public dispose(): void {
    this.removeAllListeners();
  }
}
