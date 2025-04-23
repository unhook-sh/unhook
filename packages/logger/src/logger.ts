import type { LogDestination, LogLevel, LogMessage } from './types';

type ConsoleMethod = 'debug' | 'info' | 'warn' | 'error' | 'log';

export interface LoggerProps {
  defaultNamespace?: string;
  enabledNamespaces?: Set<string>;
  useColors?: boolean;
  destinations?: LogDestination[];
  flushInterval?: number;
}

// Store original console methods
const originalConsole: Record<ConsoleMethod, typeof console.log> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
  log: console.log,
};

const isBrowser = typeof window !== 'undefined';

function formatMessage(template: string, ...args: unknown[]): string {
  let index = 0;
  return template.replace(/%[sdjoO]/g, (match) => {
    if (index >= args.length) {
      return match;
    }
    const value = args[index++];
    switch (match) {
      case '%s':
        return String(value);
      case '%d':
        return Number(value).toString();
      case '%j':
        try {
          return JSON.stringify(value);
        } catch {
          return '[Circular]';
        }
      case '%o':
      case '%O':
        return typeof value === 'object' && value !== null
          ? JSON.stringify(value, null, 2)
          : String(value);
      default:
        return match;
    }
  });
}

interface BufferedLogMessage extends LogMessage {
  sequence: number;
}

export class UnhookLogger {
  private enabledNamespaces: Set<string>;
  private defaultNamespace: string;
  private useColors: boolean;
  private destinations: Set<LogDestination>;
  private logBuffer: BufferedLogMessage[] = [];
  private flushInterval: number;
  private flushTimer: Timer | null = null;
  private sequence = 0;

  constructor(props: LoggerProps = {}) {
    this.enabledNamespaces = new Set(props.enabledNamespaces || ['*']);
    this.defaultNamespace = props.defaultNamespace || 'app';
    this.useColors = props.useColors ?? isBrowser;
    this.destinations = new Set(props.destinations || []);
    this.flushInterval = props.flushInterval ?? 100; // Default 100ms

    // Start the flush timer
    this.startFlushTimer();

    // Intercept console methods
    this.interceptConsole();
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error('Failed to flush logs:', error);
      });
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    // Sort buffer by sequence number to maintain order
    const sortedBuffer = [...this.logBuffer].sort(
      (a, b) => a.sequence - b.sequence,
    );
    this.logBuffer = [];

    // Process each message in order
    for (const bufferedMessage of sortedBuffer) {
      const { sequence, ...message } = bufferedMessage;
      if (this.destinations.size > 0) {
        await Promise.all(
          Array.from(this.destinations).map((destination) =>
            destination.write(message),
          ),
        );
      }
    }
  }

  private writeToDestinations(
    level: LogLevel,
    namespace: string,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    const logMessage: BufferedLogMessage = {
      level,
      namespace,
      message,
      metadata,
      timestamp: new Date(),
      sequence: this.sequence++,
    };

    this.logBuffer.push(logMessage);

    // If buffer gets too large, trigger an immediate flush
    if (this.logBuffer.length > 1000) {
      this.flush().catch((error) => {
        console.error('Failed to flush logs:', error);
      });
    }
  }

  private getColor(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return (Math.abs(hash) % 6) + 31; // Returns a number between 31 and 36 (ANSI colors)
  }

  private formatWithColor(str: string, namespace: string): string {
    if (!this.useColors) return str;

    const color = this.getColor(namespace);
    if (!isBrowser) {
      return `\x1b[${color}m${str}\x1b[0m`;
    }
    return `%c${str}`;
  }

  private isNamespaceEnabled(namespace: string): boolean {
    if (this.enabledNamespaces.has('*')) return true;

    // Support wildcard patterns like 'unhook:*'
    for (const pattern of this.enabledNamespaces) {
      if (pattern.endsWith('*') && namespace.startsWith(pattern.slice(0, -1))) {
        return true;
      }
      if (pattern === namespace) {
        return true;
      }
    }
    return false;
  }

  private interceptConsole(): void {
    const self = this;

    function enhanceConsole(method: ConsoleMethod) {
      console[method] = (...args: unknown[]) => {
        const firstArg = args[0];
        let namespace = self.defaultNamespace;
        let messageArgs: unknown[] = args;
        let message: unknown = '';

        // Handle [namespace] prefix pattern
        if (typeof firstArg === 'string') {
          if (firstArg.startsWith('[') && firstArg.includes(']')) {
            const closingBracket = firstArg.indexOf(']');
            namespace = firstArg.slice(1, closingBracket);
            message = firstArg.slice(closingBracket + 1).trim();
            messageArgs = [message, ...args.slice(1)];
          } else {
            message = firstArg;
            messageArgs = args;
          }
        } else {
          message = firstArg;
          messageArgs = args;
        }

        if (!self.isNamespaceEnabled(namespace)) return;

        // Format the message if it's a format string
        const formattedMessage =
          typeof messageArgs[0] === 'string'
            ? formatMessage(messageArgs[0], ...messageArgs.slice(1))
            : messageArgs[0];

        // Write to destinations with all metadata
        const metadata: Record<string, unknown> = {};
        messageArgs.slice(1).forEach((arg, index) => {
          if (arg !== null && typeof arg === 'object') {
            Object.assign(metadata, arg as Record<string, unknown>);
          } else {
            metadata[`arg${index + 1}`] = arg;
          }
        });

        const timestamp = new Date();
        const prefix = `[${timestamp.toISOString()}] [${namespace}]`;

        // Write to destinations (non-blocking)
        self.writeToDestinations(
          method === 'log' ? 'info' : (method as LogLevel),
          namespace,
          typeof formattedMessage === 'string'
            ? formattedMessage
            : formatMessage('%O', formattedMessage),
          Object.keys(metadata).length > 0 ? metadata : undefined,
        );

        // Immediately write to console
        if (self.useColors) {
          if (!isBrowser) {
            // Node.js
            originalConsole[method](
              self.formatWithColor(prefix, namespace),
              formattedMessage,
            );
            return;
          }
          // Browser
          const color = self.getColor(namespace);
          const colors = [
            '#0066cc',
            '#cc0066',
            '#00cc66',
            '#cc6600',
            '#6600cc',
            '#66cc00',
          ];
          const style = `color: ${colors[color - 31]}; font-weight: bold`;
          originalConsole[method](`%c${prefix}`, style, formattedMessage);
          return;
        }

        originalConsole[method](prefix, formattedMessage);
      };
    }

    enhanceConsole('debug');
    enhanceConsole('info');
    enhanceConsole('warn');
    enhanceConsole('error');
    enhanceConsole('log');
  }

  enableNamespace(namespace: string): void {
    this.enabledNamespaces.add(namespace);
  }

  disableNamespace(namespace: string): void {
    this.enabledNamespaces.delete(namespace);
  }

  // Create a debug function for a specific namespace
  debug(namespace: string): (...args: unknown[]) => Promise<void> {
    return async (...args: unknown[]) => {
      if (!this.isNamespaceEnabled(namespace)) return;
      const message =
        typeof args[0] === 'string'
          ? formatMessage(args[0] as string, ...args.slice(1))
          : args[0];

      // Extract metadata if present
      const metadata = args.length > 1 ? args[1] : undefined;

      // Write to destinations with metadata
      this.writeToDestinations(
        'debug',
        namespace,
        String(message),
        metadata as Record<string, unknown>,
      );
    };
  }

  // Destination management
  addDestination(destination: LogDestination): void {
    this.destinations.add(destination);
  }

  removeDestination(destination: LogDestination): void {
    this.destinations.delete(destination);
  }

  // Restore original console methods
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush any remaining logs
    this.flush().catch((error) => {
      console.error('Failed to flush final logs:', error);
    });

    for (const [method, fn] of Object.entries(originalConsole)) {
      console[method as ConsoleMethod] = fn;
    }
  }
}
