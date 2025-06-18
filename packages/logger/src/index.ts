import { UnhookLogger } from './logger';

// Create and export a default logger instance
export const defaultLogger = new UnhookLogger({
  defaultNamespace: 'unhook',
});

// Export a debug function that uses the default logger
export const debug = (namespace: string) => defaultLogger.debug(namespace);

// Export everything else
export { UnhookLogger };
export type { LoggerProps } from './logger';

// Enable debug namespaces based on environment variable (similar to debug package)
if (typeof process !== 'undefined' && process.env.DEBUG) {
  for (const namespace of process.env.DEBUG.split(',')) {
    defaultLogger.enableNamespace(namespace.trim());
  }
}

export * from './types';
export * from './logger';
