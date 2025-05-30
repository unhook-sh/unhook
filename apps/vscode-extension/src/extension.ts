import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface ApiEvent {
  timestamp: number;
  method: string;
  path: string;
  status?: number;
  duration?: number;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('Unhook extension is activating...');

  // Register the webview view provider
  const apiEventsWebviewProvider = new ApiEventsWebviewProvider(
    context.extensionUri,
  );
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ApiEventsWebviewProvider.viewType,
      apiEventsWebviewProvider,
    ),
  );

  console.log('Unhook extension activation complete');
}

// This method is called when your extension is deactivated
export function deactivate() {}

class ApiEventsWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'unhook.apiEventsWebview';
  private _view?: vscode.WebviewView;
  private _events: ApiEvent[] = [];
  private _disposables: vscode.Disposable[] = [];
  private _lastHtml?: string;
  private _devServerUrl?: string;

  constructor(private readonly _extensionUri: vscode.Uri) {
    // Add some mock events
    this._events = [
      {
        timestamp: Date.now() - 5000,
        method: 'GET',
        path: '/api/users',
        status: 200,
        duration: 150,
      },
      {
        timestamp: Date.now() - 10000,
        method: 'POST',
        path: '/api/auth/login',
        status: 401,
        duration: 200,
      },
      {
        timestamp: Date.now() - 15000,
        method: 'PUT',
        path: '/api/settings',
        status: 200,
        duration: 180,
      },
      {
        timestamp: Date.now() - 20000,
        method: 'DELETE',
        path: '/api/posts/123',
        status: 404,
        duration: 120,
      },
    ];

    // In development mode, set up file watching
    if (process.env.NODE_ENV === 'development') {
      this._devServerUrl = 'http://localhost:5173';

      // Set up file watcher for the webview directory
      const webviewPath = vscode.Uri.joinPath(
        this._extensionUri,
        'src',
        'webview',
      );

      const watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(webviewPath, '**/*'),
        false,
        false,
        false,
      );

      this._disposables.push(
        watcher.onDidChange(() => {
          if (this._view) {
            // Update the HTML content
            const newHtml = this.getHtmlForWebview(this._view.webview);
            if (newHtml !== this._lastHtml) {
              this._lastHtml = newHtml;
              this._view.webview.html = newHtml;
            }
          }
        }),
      );
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview'),
        vscode.Uri.parse('http://localhost:5173'),
      ],
    };

    // Store the initial HTML
    this._lastHtml = this.getHtmlForWebview(webviewView.webview);
    webviewView.webview.html = this._lastHtml;

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'ready':
            // Webview is ready
            break;
        }
      },
      null,
      this._disposables,
    );
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    // In both development and production, use the built files
    const htmlPath = join(
      this._extensionUri.fsPath,
      'dist',
      'webview',
      'index.html',
    );
    let html = readFileSync(htmlPath, 'utf8');

    const baseUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview'),
    );

    html = html.replace(
      /(src|href)="(\.\/)?assets\//g,
      `$1="${baseUri.toString()}/assets/`,
    );

    return html;
  }

  dispose() {
    for (const disposable of this._disposables) {
      disposable.dispose();
    }
  }
}
