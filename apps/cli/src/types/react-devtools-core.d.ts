declare module 'react-devtools-core/backend' {
  interface ConnectOptions {
    host?: string;
    port?: number;
    websocket?: boolean;
    resolveRNStyle?: ((style: unknown) => unknown) | null;
    isAppActive?: () => boolean;
  }

  export function connectToDevTools(options?: ConnectOptions): void;
}
