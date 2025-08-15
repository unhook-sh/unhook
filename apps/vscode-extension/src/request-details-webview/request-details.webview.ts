import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  EventType,
  EventTypeWithRequest,
  RequestType,
} from '@unhook/db/schema';
import { debug } from '@unhook/logger';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ConfigManager } from '../config.manager';
import type { AnalyticsService } from '../services/analytics.service';

const log = debug('unhook:vscode:request-details-webview');

function sanitizeHeaders(headers: Record<string, unknown>): unknown {
  return Object.fromEntries(
    Object.entries(headers || {}).filter(([, v]) => typeof v === 'string'),
  );
}

export class RequestDetailsWebviewProvider {
  private _panel?: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _devServerUrl?: string;
  private _currentRequestData: RequestType | null = null;
  private _currentEventData: EventTypeWithRequest | null = null;
  private _analyticsService?: AnalyticsService;

  constructor(private readonly _extensionUri: vscode.Uri) {
    // In development mode, set up file watching
    if (ConfigManager.getInstance().isDevelopment()) {
      this._devServerUrl = 'http://localhost:5173';
    }
  }

  public setAnalyticsService(analyticsService: AnalyticsService) {
    this._analyticsService = analyticsService;
  }

  public getCurrentEvent(): EventTypeWithRequest | null {
    return this._currentEventData;
  }

  public async show({
    request,
    event,
  }: {
    request: RequestType;
    event: EventType;
  }) {
    log('Showing request details', { requestId: request.id });

    // Track request details view
    this._analyticsService?.track('webview_request_details_viewed', {
      event_id: event.id,
      event_name: event.originRequest?.body ? 'has_body' : 'no_body',
      request_id: request.id,
      source: event.source || 'unknown',
    });

    // Sanitize headers in request and response if present
    if (
      event?.originRequest?.headers &&
      typeof event.originRequest.headers === 'object'
    ) {
      event.originRequest.headers = sanitizeHeaders(
        event.originRequest.headers as Record<string, unknown>,
      ) as Record<string, string>;
    }
    if (
      request?.response?.headers &&
      typeof request.response.headers === 'object'
    ) {
      request.response.headers = sanitizeHeaders(
        request.response.headers as Record<string, unknown>,
      ) as Record<string, string>;
    }
    this._currentRequestData = request;
    this._currentEventData = null;

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
            log('Webview is ready, sending current data');
            // Send whatever data we currently have (request or event)
            if (this._currentRequestData) {
              log('Sending current request data to ready webview');
              this._panel?.webview.postMessage({
                data: this._currentRequestData,
                type: 'requestData',
              });
            } else if (this._currentEventData) {
              log('Sending current event data to ready webview');
              this._panel?.webview.postMessage({
                data: this._currentEventData,
                type: 'eventData',
              });
            } else {
              log('No current data to send to ready webview');
            }
            break;
          case 'setupMcpServer':
            // Trigger MCP server setup via existing command
            vscode.commands.executeCommand('unhook.configureApiKey');
            break;
          case 'replayEvent':
            // Handle event replay from webview
            log('Received replay event request from webview', {
              eventId: message.data?.event?.id,
            });
            if (message.data?.event) {
              // Execute the replay event command
              vscode.commands.executeCommand('unhook.replayEvent', {
                event: message.data.event,
              });
            }
            break;
          case 'webview_interaction':
            // Track webview interactions from React components
            this._analyticsService?.track('webview_interaction', {
              action: message.action,
              component: message.component,
              ...message.properties,
            });
            break;
          case 'zustand:patch':
            // Handle Zustand state persistence from webview
            log('Received Zustand patch from webview', {
              payload: message.payload,
            });
            Object.entries(message.payload as Record<string, unknown>).forEach(
              ([key, value]) => {
                // Store in extension context for persistence
                // Note: We need access to the extension context here
                // For now, we'll log the state changes
                log('Zustand state change', { key, value });
              },
            );
            break;
          case 'zustand:request_state':
            // Send current persisted state back to webview
            log('Sending persisted state to webview');
            // Note: We need access to the extension context here
            // For now, we'll send default values
            this._panel?.webview.postMessage({
              payload: {
                eventDetails: {
                  activeTab: 'payload',
                  showAiPrompt: false,
                },
                payloadFormat: 'json', // Default value
                sidebarCollapsed: false, // Default value
                theme: 'system', // Default value
              },
              type: 'zustand:hydrate',
            });
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

        // Track panel disposal
        this._analyticsService?.track('webview_panel_disposed', {
          panel_type: 'request_details',
        });

        this._panel = undefined;
      },
      null,
      this._disposables,
    );
  }

  public async showEvent(event: EventTypeWithRequest) {
    log('Showing event details', { eventId: event.id });

    // Track event details view
    this._analyticsService?.track('webview_event_details_viewed', {
      event_id: event.id,
      event_name: event.originRequest?.body ? 'has_body' : 'no_body',
      request_count: event.requests?.length || 0,
      source: event.source || 'unknown',
      status: event.status,
    });

    // Sanitize headers in event if present
    if (
      event?.originRequest?.headers &&
      typeof event.originRequest.headers === 'object'
    ) {
      event.originRequest.headers = sanitizeHeaders(
        event.originRequest.headers as Record<string, unknown>,
      ) as Record<string, string>;
    }
    this._currentEventData = event;
    this._currentRequestData = null;

    // If we already have a panel, show it
    if (this._panel) {
      log('Revealing existing panel');
      this._panel.reveal(vscode.ViewColumn.One);

      // Add a small delay to ensure the webview is ready, then send the data
      setTimeout(() => {
        log('Sending event data to existing panel after delay');
        this._panel?.webview.postMessage({
          data: this._currentEventData,
          type: 'eventData',
        });
      }, 100);

      return;
    }

    // Otherwise, create a new panel
    log('Creating new panel');
    this._panel = vscode.window.createWebviewPanel(
      'unhookRequestDetails',
      'Event Details',
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
            log('Webview is ready, sending event data');
            // If we have event data, send it to the webview
            if (this._currentEventData) {
              log('Sending current event data to ready webview', {
                eventId: this._currentEventData.id,
              });
              this._panel?.webview.postMessage({
                data: this._currentEventData,
                type: 'eventData',
              });
            } else {
              log('No current event data to send to ready webview');
            }
            break;
          case 'setupMcpServer':
            // Trigger MCP server setup via existing command
            vscode.commands.executeCommand('unhook.configureApiKey');
            break;
          case 'replayEvent':
            // Handle event replay from webview
            log('Received replay event request from webview', {
              eventId: message.data?.event?.id,
            });
            if (message.data?.event) {
              // Execute the replay event command
              vscode.commands.executeCommand('unhook.replayEvent', {
                event: message.data.event,
              });
            }
            break;
          case 'replayEventFromEvent':
            // Handle event replay from event header (uses current event data)
            log('Received replay event from event header', {
              eventId: this._currentEventData?.id,
            });
            if (this._currentEventData) {
              // Execute the replay event command with current event data
              vscode.commands.executeCommand('unhook.replayEvent', {
                event: this._currentEventData,
              });
            }
            break;
          case 'refreshEventData':
            // Handle event data refresh request from webview
            log('Received refresh event data request from webview', {
              eventId: this._currentEventData?.id,
            });
            if (this._currentEventData) {
              // Trigger a refresh of the events data
              // This will update the tree view and potentially the webview
              vscode.commands.executeCommand('unhook.events.refresh');
            }
            break;
          case 'webview_interaction':
            // Track webview interactions from React components
            this._analyticsService?.track('webview_interaction', {
              action: message.action,
              component: message.component,
              ...message.properties,
            });
            break;
          case 'openRequestDetails':
            log('Opening request details from event details webview', {
              data: message.data,
            });
            // Extract request and event data from the message
            {
              const { request, event } = message.data;
              if (request && event) {
                // Show the request details
                this.showRequestFromEvent(request, event);
              } else {
                log('Invalid request details data received', {
                  data: message.data,
                });
              }
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

        // Track panel disposal
        this._analyticsService?.track('webview_panel_disposed', {
          panel_type: 'event_details',
        });

        this._panel = undefined;
      },
      null,
      this._disposables,
    );
  }

  public async showRequestFromEvent(request: RequestType, event: EventType) {
    log('Showing request details from event', {
      eventId: event.id,
      requestId: request.id,
    });

    // Track request details view from event
    this._analyticsService?.track('webview_request_details_viewed_from_event', {
      event_id: event.id,
      request_id: request.id,
      source: event.source || 'unknown',
    });

    // Sanitize headers in request and response if present
    if (
      event?.originRequest?.headers &&
      typeof event.originRequest.headers === 'object'
    ) {
      event.originRequest.headers = sanitizeHeaders(
        event.originRequest.headers as Record<string, unknown>,
      ) as Record<string, string>;
    }
    if (
      request?.response?.headers &&
      typeof request.response.headers === 'object'
    ) {
      request.response.headers = sanitizeHeaders(
        request.response.headers as Record<string, unknown>,
      ) as Record<string, string>;
    }

    this._currentRequestData = request;
    this._currentEventData = null;

    // If we already have a panel, show it
    if (this._panel) {
      log('Revealing existing panel for request details');
      this._panel.reveal(vscode.ViewColumn.One);

      // Add a small delay to ensure the webview is ready, then send the data
      setTimeout(() => {
        log('Sending request data to existing panel after delay');
        this._panel?.webview.postMessage({
          data: this._currentRequestData,
          type: 'requestData',
        });
      }, 100);

      return;
    }

    // Otherwise, create a new panel
    log('Creating new panel for request details');
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
            log('Webview is ready, sending current data');
            // Send whatever data we currently have (request or event)
            if (this._currentRequestData) {
              log('Sending current request data to ready webview', {
                requestId: this._currentRequestData.id,
              });
              this._panel?.webview.postMessage({
                data: this._currentRequestData,
                type: 'requestData',
              });
            } else if (this._currentEventData) {
              log('Sending current event data to ready webview', {
                eventId: this._currentEventData.id,
              });
              this._panel?.webview.postMessage({
                data: this._currentEventData,
                type: 'eventData',
              });
            } else {
              log('No current data to send to ready webview');
            }
            break;
          case 'setupMcpServer':
            // Trigger MCP server setup via existing command
            vscode.commands.executeCommand('unhook.configureApiKey');
            break;
          case 'replayEvent':
            // Handle event replay from webview
            log('Received replay event request from webview', {
              eventId: message.data?.event?.id,
            });
            if (message.data?.event) {
              // Execute the replay event command
              vscode.commands.executeCommand('unhook.replayEvent', {
                event: message.data.event,
              });
            }
            break;
          case 'webview_interaction':
            // Track webview interactions from React components
            this._analyticsService?.track('webview_interaction', {
              action: message.action,
              component: message.component,
              ...message.properties,
            });
            break;
          case 'zustand:patch':
            // Handle Zustand state persistence from webview
            log('Received Zustand patch from webview', {
              payload: message.payload,
            });
            Object.entries(message.payload as Record<string, unknown>).forEach(
              ([key, value]) => {
                // Store in extension context for persistence
                // Note: We need access to the extension context here
                // For now, we'll log the state changes
                log('Zustand state change', { key, value });
              },
            );
            break;
          case 'zustand:request_state':
            // Send current persisted state back to webview
            log('Sending persisted state to webview');
            // Note: We need access to the extension context here
            // For now, we'll send default values
            this._panel?.webview.postMessage({
              payload: {
                eventDetails: {
                  activeTab: 'payload',
                  showAiPrompt: false,
                },
                payloadFormat: 'json', // Default value
                sidebarCollapsed: false, // Default value
                theme: 'system', // Default value
              },
              type: 'zustand:hydrate',
            });
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

        // Track panel disposal
        this._analyticsService?.track('webview_panel_disposed', {
          panel_type: 'request_details',
        });

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

      // Normalize and derive dev server hosts
      const devUrl = new URL(this._devServerUrl);
      const port = devUrl.port || '5173';
      const host = devUrl.hostname || 'localhost';
      const httpHostUrl = `http://${host}:${port}`;
      const httpLocalhostUrl = `http://localhost:${port}`;
      const httpZeroUrl = `http://0.0.0.0:${port}`;
      const wsHostUrl = `ws://${host}:${port}`;
      const wsLocalhostUrl = `ws://localhost:${port}`;
      const wsZeroUrl = `ws://0.0.0.0:${port}`;

      // Create a simple HTML that loads from the Vite dev server
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none';
    img-src ${webview.cspSource} https: ${httpHostUrl} ${httpLocalhostUrl} ${httpZeroUrl};
    script-src 'unsafe-inline' 'unsafe-eval' ${webview.cspSource} ${httpHostUrl} ${httpLocalhostUrl} ${httpZeroUrl};
    style-src 'unsafe-inline' ${webview.cspSource} ${httpHostUrl} ${httpLocalhostUrl} ${httpZeroUrl};
    connect-src ${webview.cspSource} ${httpHostUrl} ${httpLocalhostUrl} ${httpZeroUrl} ${wsHostUrl} ${wsLocalhostUrl} ${wsZeroUrl};
    font-src ${webview.cspSource} ${httpHostUrl} ${httpLocalhostUrl} ${httpZeroUrl};">
  <title>Unhook</title>
  <base href="/">
  <style>
    @keyframes unhook-spin { to { transform: rotate(360deg); } }
    #initial-loader {
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      background: var(--vscode-editor-background, #0b0b0b);
      color: var(--vscode-editor-foreground, #cccccc);
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    }
    #initial-loader .spinner {
      width: 18px; height: 18px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 9999px;
      animation: unhook-spin 0.9s linear infinite;
      margin-right: 8px;
      opacity: 0.9;
    }
    #initial-loader .text { font-size: 12px; opacity: 0.8; }
  </style>
</head>
<body>
  <div id="root">
    <div id="initial-loader">
      <div class="spinner" aria-hidden="true"></div>
      <div class="text" aria-live="polite">Loading Unhook panel…</div>
    </div>
  </div>
  <script type="module">
    import RefreshRuntime from '${httpHostUrl}/@react-refresh'
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
  <script type="module" src="${httpHostUrl}/@vite/client"></script>
  <script type="module" src="${httpHostUrl}/main.tsx"></script>
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
