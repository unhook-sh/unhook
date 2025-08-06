import { describe, expect, it, mock } from 'bun:test';
import * as vscode from 'vscode';
import { LoadingItem } from '../../tree-items/loading.item';

// Mock vscode.ExtensionContext
const mockContext = {
  asAbsolutePath: mock((path: string) => `/mock/extension/path/${path}`),
  environmentVariableCollection: {} as vscode.EnvironmentVariableCollection,
  extension: {} as vscode.Extension<unknown>,
  extensionMode: 1,
  extensionPath: '/mock/extension/path',
  extensionUri: { fsPath: '/mock/extension/path' },
  globalState: {
    get: mock(() => undefined),
    update: mock(() => Promise.resolve()),
  },
  globalStoragePath: '/mock/global/storage/path',
  globalStorageUri: undefined,
  languageModelAccessInformation: {} as vscode.LanguageModelAccessInformation,
  logPath: '/mock/log/path',
  logUri: undefined,
  secrets: {
    get: mock(() => Promise.resolve(undefined)),
    store: mock(() => Promise.resolve()),
  },
  storagePath: '/mock/storage/path',
  storageUri: undefined,
  subscriptions: [],
  workspaceState: {
    get: mock(() => undefined),
    update: mock(() => Promise.resolve()),
  },
} as unknown as vscode.ExtensionContext;

describe('LoadingItem', () => {
  it('should create a loading item with correct properties', () => {
    const loadingItem = new LoadingItem(mockContext);

    expect(loadingItem.label).toBe('Loading events...');
    expect(loadingItem.collapsibleState).toBe(
      vscode.TreeItemCollapsibleState.None,
    );
    expect(loadingItem.contextValue).toBe('unhook.loading');
    expect(loadingItem.resourceUri?.toString()).toBe('[object Object]');
    expect((loadingItem.tooltip as vscode.MarkdownString)?.value).toBe(
      'Loading events from the server...',
    );
  });

  it('should have correct icon paths', () => {
    const loadingItem = new LoadingItem(mockContext);

    expect(loadingItem.iconPath).toEqual({
      dark: vscode.Uri.file('/mock/extension/path/src/media/loading.svg'),
      light: vscode.Uri.file('/mock/extension/path/src/media/loading.svg'),
    });
  });

  it('should have trusted tooltip', () => {
    const loadingItem = new LoadingItem(mockContext);

    expect((loadingItem.tooltip as vscode.MarkdownString)?.isTrusted).toBe(
      true,
    );
  });
});
