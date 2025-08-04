// Test setup file to mock VS Code API
import { mock } from 'bun:test';

// Interface for mock disposables
interface MockDisposable {
  dispose(): void;
}

// Mock the vscode module
mock.module('vscode', () => {
  const EventEmitter = class {
    private listeners: unknown[] = [];

    fire(data: unknown) {
      this.listeners.forEach((listener) =>
        (listener as (data: unknown) => void)(data),
      );
    }

    event = {
      subscribe: (listener: unknown) => {
        this.listeners.push(listener);
        return {
          dispose: () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
          },
        };
      },
    };

    dispose() {
      this.listeners = [];
    }
  };

  return {
    authentication: {
      getSession: mock(() => Promise.resolve(undefined)),
      registerAuthenticationProvider: mock(() => ({ dispose: mock() })),
    },
    commands: {
      executeCommand: mock(() => Promise.resolve(undefined)),
      getCommands: mock(() => Promise.resolve([])),
      registerCommand: mock(() => ({ dispose: mock() })),
    },
    Disposable: class MockDisposableClass {
      constructor(private disposeFn: () => void) {}

      dispose() {
        this.disposeFn();
      }

      static from(...disposables: unknown[]) {
        return new MockDisposableClass(() =>
          disposables.forEach((d) => (d as MockDisposable).dispose()),
        );
      }
    },
    EventEmitter,
    ExtensionContext: class {
      subscriptions: unknown[] = [];
      secrets = {
        delete: mock(() => Promise.resolve()),
        get: mock(() => Promise.resolve(undefined)),
        store: mock(() => Promise.resolve()),
      };
      globalState = {
        get: mock(() => undefined),
        update: mock(() => Promise.resolve()),
      };
      workspaceState = {
        get: mock(() => undefined),
        update: mock(() => Promise.resolve()),
      };

      subscribe(disposable: unknown) {
        this.subscriptions.push(disposable);
      }
    },
    env: {
      appName: 'Code',
      openExternal: mock(() => Promise.resolve(true)),
    },
    languages: {
      registerCompletionItemProvider: mock(() => ({ dispose: mock() })),
      registerHoverProvider: mock(() => ({ dispose: mock() })),
    },
    StatusBarAlignment: {
      Left: 1,
      Right: 2,
    },
    Uri: {
      file: mock((path: string) => ({
        authority: '',
        fragment: '',
        path,
        query: '',
        scheme: 'file',
      })),
      parse: mock((uri: string) => ({
        authority: '',
        fragment: '',
        path: uri,
        query: '',
        scheme: 'vscode',
      })),
    },
    window: {
      createOutputChannel: mock(() => ({
        appendLine: mock(),
        dispose: mock(),
        show: mock(),
      })),
      createStatusBarItem: mock(() => ({
        command: '',
        dispose: mock(),
        hide: mock(),
        show: mock(),
        text: '',
        tooltip: '',
      })),
      showErrorMessage: mock(() => Promise.resolve('OK')),
      showInformationMessage: mock(() => Promise.resolve('OK')),
      showInputBox: mock(() => Promise.resolve(undefined)),
      showQuickPick: mock(() => Promise.resolve(undefined)),
      showWarningMessage: mock(() => Promise.resolve('OK')),
    },
    workspace: {
      getConfiguration: mock(() => ({
        get: mock(() => undefined),
        update: mock(() => Promise.resolve()),
      })),
      onDidChangeConfiguration: new EventEmitter().event,
    },
  };
});
