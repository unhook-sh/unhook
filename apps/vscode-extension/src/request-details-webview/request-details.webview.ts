import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RequestType } from '@unhook/db/schema';
import { debug } from '@unhook/logger';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';

const log = debug('unhook:vscode:request-details-webview');

function sanitizeHeaders(headers: Record<string, unknown>): unknown {
  return Object.fromEntries(
    Object.entries(headers || {}).filter(([, v]) => typeof v === 'string'),
  );
}

export class RequestDetailsWebviewProvider {
  private _panel?: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _lastHtml?: string;
  private _devServerUrl?: string;
  private _currentRequestData: RequestType | null = null;

  constructor(private readonly _extensionUri: vscode.Uri) {
    // In development mode, set up file watching
    if (ConfigManager.getInstance().isDevelopment()) {
      this._devServerUrl = 'http://localhost:5173';
    }
  }

  public async show(requestData: RequestType) {
    log('Showing request details', { requestId: requestData.id });

    // Sanitize headers in request and response if present
    if (
      requestData?.request?.headers &&
      typeof requestData.request.headers === 'object'
    ) {
      requestData.request.headers = sanitizeHeaders(
        requestData.request.headers as Record<string, unknown>,
      ) as Record<string, string>;
    }
    if (
      requestData?.response?.headers &&
      typeof requestData.response.headers === 'object'
    ) {
      requestData.response.headers = sanitizeHeaders(
        requestData.response.headers as Record<string, unknown>,
      ) as Record<string, string>;
    }
    this._currentRequestData = requestData;

    // If we already have a panel, show it
    if (this._panel) {
      log('Revealing existing panel');
      this._panel.reveal(vscode.ViewColumn.One);
      this._panel.webview.postMessage({
        data: this._currentRequestData,
        type: 'requestData',
      });
      return;
    }

    // Otherwise, create a new panel
    log('Creating new panel');
    this._panel = vscode.window.createWebviewPanel(
      'unhookRequestDetails',
      'Request Details',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          this._extensionUri,
          vscode.Uri.joinPath(
            this._extensionUri,
            'dist',
            'request-details-webview',
          ),
        ],
        retainContextWhenHidden: true,
      },
    );

    this._panel.webview.html = this.getHtmlForWebview(this._panel.webview);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        log('Received message from webview', { message });
        switch (message.type) {
          case 'ready':
            log('Webview is ready, sending request data');
            // If we have request data, send it to the webview
            if (this._currentRequestData) {
              this._panel?.webview.postMessage({
                data: this._currentRequestData,
                type: 'requestData',
              });
            }
            break;
          default:
            log('Unknown message type from webview', { type: message.type });
        }
      },
      null,
      this._disposables,
    );

    // Reset when the panel is disposed
    this._panel.onDidDispose(
      () => {
        log('Panel disposed');
        this._panel = undefined;
      },
      null,
      this._disposables,
    );
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    log('Getting HTML for webview');

    // In development mode, load from Vite dev server
    if (ConfigManager.getInstance().isDevelopment() && this._devServerUrl) {
      log('Using development mode with Vite dev server');

      // Create a simple HTML that loads from the Vite dev server
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none';
    img-src ${webview.cspSource} https: http://localhost:5173;
    script-src 'unsafe-inline' 'unsafe-eval' ${webview.cspSource} http://localhost:5173;
    style-src 'unsafe-inline' ${webview.cspSource} http://localhost:5173;
    connect-src ${webview.cspSource} http://localhost:5173 ws://localhost:5173;
    font-src ${webview.cspSource} http://localhost:5173;">
  <title>Unhook</title>
  <base href="/">
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import RefreshRuntime from 'http://localhost:5173/@react-refresh'
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
  <script type="module" src="http://localhost:5173/@vite/client"></script>
  <script type="module" src="http://localhost:5173/main.tsx"></script>
</body>
</html>`;

      return html;
    }

    // In production, use the built files
    const htmlPath = join(
      this._extensionUri.path,
      'dist',
      'request-details-webview',
      'index.html',
    );
    let html = readFileSync(htmlPath, 'utf8');

    // Extract the script and style filenames from the HTML
    const scriptMatch = html.match(
      /<script[^>]*src="\.\/assets\/([^"]+)"[^>]*>/,
    );
    const styleMatch = html.match(/<link[^>]*href="\.\/assets\/([^"]+)"[^>]*>/);

    if (scriptMatch && styleMatch) {
      const scriptFilename = scriptMatch[1] as string;
      const styleFilename = styleMatch[1] as string;

      // Create URIs for the assets using the extension's URI path
      const scriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this._extensionUri,
          'dist',
          'request-details-webview',
          'assets',
          scriptFilename,
        ),
      );
      const styleUri = webview.asWebviewUri(
        vscode.Uri.joinPath(
          this._extensionUri,
          'dist',
          'request-details-webview',
          'assets',
          styleFilename,
        ),
      );

      // Replace the script and style tags with the correct URIs
      html = html.replace(
        /<script[^>]*src="\.\/assets\/[^"]+"[^>]*>/,
        `<script type="module" crossorigin="" src="${scriptUri}"></script>`,
      );
      html = html.replace(
        /<link[^>]*href="\.\/assets\/[^"]+"[^>]*>/,
        `<link rel="stylesheet" crossorigin="" href="${styleUri}">`,
      );
    }

    // Add CSP meta tag to allow loading of local resources
    const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'unsafe-inline' 'unsafe-eval' ${webview.cspSource}; style-src 'unsafe-inline' ${webview.cspSource}; connect-src ${webview.cspSource};">`;
    html = html.replace('</head>', `${cspMeta}</head>`);

    log('HTML content prepared');
    return html;
  }

  dispose() {
    for (const disposable of this._disposables) {
      disposable.dispose();
    }
    this._panel?.dispose();
  }
}
