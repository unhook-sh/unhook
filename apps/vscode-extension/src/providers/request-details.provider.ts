import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as vscode from 'vscode';

export class RequestDetailsDocument implements vscode.CustomDocument {
  constructor(
    public readonly uri: vscode.Uri,
    public readonly content: string,
  ) {}

  dispose(): void {}
}

export class RequestDetailsProvider
  implements vscode.CustomReadonlyEditorProvider<RequestDetailsDocument>
{
  private _disposables: vscode.Disposable[] = [];
  private _lastHtml?: string;
  private _devServerUrl?: string;

  constructor(private readonly _extensionUri: vscode.Uri) {
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
          // The webview will be updated when it's next shown
          this._lastHtml = undefined;
        }),
      );
    }
  }

  async openCustomDocument(uri: vscode.Uri): Promise<RequestDetailsDocument> {
    const content = decodeURIComponent(uri.query);
    return new RequestDetailsDocument(uri, content);
  }

  async resolveCustomEditor(
    document: RequestDetailsDocument,
    webviewPanel: vscode.WebviewPanel,
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview'),
        vscode.Uri.parse('http://localhost:5173'),
      ],
    };

    // Store the initial HTML
    this._lastHtml = this.getHtmlForWebview(webviewPanel.webview);
    webviewPanel.webview.html = this._lastHtml;

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case 'ready':
            // Send the request data to the webview
            webviewPanel.webview.postMessage({
              type: 'requestData',
              data: JSON.parse(document.content),
            });
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
