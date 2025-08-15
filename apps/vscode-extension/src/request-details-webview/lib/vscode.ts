import { debug } from '@unhook/logger';

const log = debug('unhook:vscode:request-details-webview');

// VSCode API interface
interface VscodeApi {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VscodeApi;
  }
}

// Singleton VSCode API instance
let vscodeApi: VscodeApi | null = null;

// Get VSCode API (singleton pattern)
function getVscodeApi(): VscodeApi | null {
  if (vscodeApi) {
    return vscodeApi;
  }

  try {
    if (typeof window !== 'undefined' && 'acquireVsCodeApi' in window) {
      vscodeApi = window.acquireVsCodeApi?.() || null;
      return vscodeApi;
    }
  } catch (error) {
    log('Error getting VSCode API:', error);
  }
  return null;
}

// Export the vscode API with lazy initialization
export const vscode: VscodeApi = {
  getState: () => {
    const api = getVscodeApi();
    if (api) {
      return api.getState();
    }
    return null;
  },
  postMessage: (message: unknown) => {
    const api = getVscodeApi();
    if (api) {
      api.postMessage(message);
    } else {
      log('VSCode API not available, posting to parent', message);
      window.parent.postMessage(message as MessageEvent, '*');
    }
  },
  setState: (state: unknown) => {
    const api = getVscodeApi();
    if (api) {
      api.setState(state);
    }
  },
};
