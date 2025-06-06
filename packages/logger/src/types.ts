// Logger interface for file operations
export type LogWriter = {
  write: (data: string) => void;
  flush: () => void;
};

// Logger module interface
export type LoggerModule = {
  debug: (namespace: string) => (...args: unknown[]) => void;
  enableDebug: (namespace: string) => void;
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMessage {
  level: LogLevel;
  namespace: string;
  args: unknown[];
  timestamp: Date;
}

export interface LogDestination {
  write(message: LogMessage): void;
}

export interface LoggerProps {
  defaultNamespace?: string;
  destinations?: LogDestination[];
  enabledNamespaces?: Set<string>;
}

export interface ILogger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}
