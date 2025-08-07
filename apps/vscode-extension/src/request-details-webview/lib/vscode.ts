import { debug } from '@unhook/logger';

const log = debug('unhook:vscode:request-details-webview');

declare global {
  interface Window {
    acquireVsCodeApi?: () => {
      postMessage: (message: unknown) => void;
      getState: () => unknown;
      setState: (state: unknown) => void;
    };
  }
}

export const vscode = window.acquireVsCodeApi?.() || {
  postMessage: (message: unknown) => {
    log('VSCode API not available, posting to parent', message);
    window.parent.postMessage(message as MessageEvent, '*');
  },
};
