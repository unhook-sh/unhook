// Logger interface for file operations
export type LogWriter = {
  write: (data: string) => void;
  flush: () => void;
};

// Logger module interface
export type LoggerModule = {
  debug: (namespace: string) => (formatter: string, ...args: unknown[]) => void;
  enableDebug: (namespace: string) => void;
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogMessage {
  level: LogLevel;
  namespace: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
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
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, metadata?: Record<string, unknown>): void;
}
