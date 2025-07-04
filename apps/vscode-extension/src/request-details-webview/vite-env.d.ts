/// <reference types="vite/client" />

interface VSCodeApi {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

declare global {
  interface Window {
    acquireVsCodeApi: () => VSCodeApi;
  }
}
