import { debug } from '@unhook/logger';
import * as vscode from 'vscode';

const API_KEY_KEY = 'unhook.api.key';

// Create debug logger for API key store
const log = debug('unhook:vscode:api-key');

export class ApiKeyStore implements vscode.Disposable {
  private _onDidChangeApiKey = new vscode.EventEmitter<void>();
  readonly onDidChangeApiKey = this._onDidChangeApiKey.event;

  private _apiKey: string | null = null;

  constructor(private readonly context: vscode.ExtensionContext) {}

  get apiKey() {
    return this._apiKey;
  }

  get hasApiKey() {
    return !!this._apiKey;
  }

  async setApiKey({ apiKey }: { apiKey: string | null }) {
    log('Setting API key', { hasApiKey: !!apiKey });
    if (apiKey) {
      await this.context.secrets.store(API_KEY_KEY, apiKey);
    } else {
      await this.context.secrets.delete(API_KEY_KEY);
    }

    this._apiKey = apiKey;
    this._onDidChangeApiKey.fire();
    log('API key updated', { hasApiKey: !!this._apiKey });
  }

  async clearApiKey() {
    log('Clearing API key');
    await this.setApiKey({ apiKey: null });
    log('API key cleared');
  }

  async initialize() {
    log('Initializing API key store');
    const apiKey = await this.context.secrets.get(API_KEY_KEY);

    log('Retrieved stored API key', {
      hasApiKey: !!apiKey,
    });

    if (apiKey) {
      await this.setApiKey({ apiKey });
    }
    log('API key store initialization complete');
  }

  dispose() {
    log('Disposing API key store');
    this._onDidChangeApiKey.dispose();
  }
}
