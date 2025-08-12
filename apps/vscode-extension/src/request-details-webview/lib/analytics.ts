import { vscode } from './vscode';

/**
 * Send analytics tracking message to the VS Code extension
 */
export function trackWebviewInteraction(
  action: string,
  component: string,
  properties?: Record<string, unknown>,
) {
  vscode.postMessage({
    action,
    component,
    properties: properties || {},
    type: 'webview_interaction',
  });
}

/**
 * Track JSON viewer interactions
 */
export function trackJsonViewerInteraction(
  action: string,
  properties?: Record<string, unknown>,
) {
  trackWebviewInteraction(action, 'json_viewer', properties);
}

/**
 * Track request card interactions
 */
export function trackRequestCardInteraction(
  action: string,
  properties?: Record<string, unknown>,
) {
  trackWebviewInteraction(action, 'request_card', properties);
}

/**
 * Track header interactions
 */
export function trackHeaderInteraction(
  action: string,
  properties?: Record<string, unknown>,
) {
  trackWebviewInteraction(action, 'header', properties);
}
