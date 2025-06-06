import { EventEmitter } from 'node:events';
import * as vscode from 'vscode';

export interface UnhookSettings {
  output: {
    autoShow: boolean;
    maxLines: number;
  };
  webhookEvents: {
    maxHistory: number;
    autoClear: boolean;
  };
  requestDetails: {
    defaultView: 'raw' | 'formatted';
  };
}

export class SettingsService {
  private static instance: SettingsService;
  private disposables: vscode.Disposable[] = [];
  private settingsChanged = new EventEmitter();

  private constructor() {
    // Listen for configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('unhook')) {
          this.onSettingsChanged();
        }
      }),
    );
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  public getSettings(): UnhookSettings {
    const config = vscode.workspace.getConfiguration('unhook');
    return {
      output: {
        autoShow: config.get('output.autoShow') ?? true,
        maxLines: config.get('output.maxLines') ?? 1000,
      },
      webhookEvents: {
        maxHistory: config.get('webhookEvents.maxHistory') ?? 100,
        autoClear: config.get('webhookEvents.autoClear') ?? false,
      },
      requestDetails: {
        defaultView: config.get('requestDetails.defaultView') ?? 'formatted',
      },
    };
  }

  private onSettingsChanged() {
    this.settingsChanged.emit('change', this.getSettings());
  }

  public onSettingsChange(callback: (settings: UnhookSettings) => void): void {
    this.settingsChanged.on('change', callback);
  }

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.settingsChanged.removeAllListeners();
  }
}
