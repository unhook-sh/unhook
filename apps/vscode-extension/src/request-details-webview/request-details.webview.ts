import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface RequestData {
  id: string;
  [key: string]: unknown;
}

export class RequestDetailsWebviewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = 'unhook.requestDetails';
  private _view?: vscode.WebviewView;
  private _disposables: vscode.Disposable[] = [];
  private _lastHtml?: string;
  private _devServerUrl?: string;
  private _currentRequestData: RequestData | null = null;

  constructor(private readonly _extensionUri: vscode.Uri) {
    // Add some mock events

    // In development mode, set up file watching
    if (process.env.NODE_ENV === 'development') {
      this._devServerUrl = 'http://localhost:5173';

      // Set up file watcher for the webview directory
      const webviewPath = vscode.Uri.joinPath(
        this._extensionUri,
        'src',
        'request-details-webview',
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
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(
          this._extensionUri,
          'dist',
          'request-details-webview',
        ),
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
            // If we have request data, send it to the webview
            if (this._currentRequestData) {
              webviewView.webview.postMessage({
                type: 'requestData',
                data: this._currentRequestData,
              });
            }
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
      'request-details-webview',
      'index.html',
    );
    let html = readFileSync(htmlPath, 'utf8');

    const baseUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        'dist',
        'request-details-webview',
      ),
    );

    html = html.replace(
      /(src|href)="(\.\/)?assets\//g,
      `$1="${baseUri.toString()}/assets/`,
    );

    return html;
  }

  // Add method to set request data
  public setRequestData(data: RequestData) {
    this._currentRequestData = data;
    if (this._view) {
      this._view.webview.postMessage({
        type: 'requestData',
        data: this._currentRequestData,
      });
    }
  }

  dispose() {
    for (const disposable of this._disposables) {
      disposable.dispose();
    }
  }
}
