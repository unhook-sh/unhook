import { originalConsole } from '../logger';
import type { LogDestination, LogMessage } from '../types';

export class ConsoleDestination implements LogDestination {
  write(message: LogMessage): void {
    const { level, namespace, message: msg, metadata, timestamp } = message;
    const formattedMessage = `[${timestamp.toISOString()}] ${namespace}: ${msg}`;

    switch (level) {
      case 'debug':
        metadata
          ? originalConsole.debug(formattedMessage, metadata)
          : originalConsole.debug(formattedMessage);
        break;
      case 'info':
        metadata
          ? originalConsole.info(formattedMessage, metadata)
          : originalConsole.info(formattedMessage);
        break;
      case 'warn':
        metadata
          ? originalConsole.warn(formattedMessage, metadata)
          : originalConsole.warn(formattedMessage);
        break;
      case 'error':
        metadata
          ? originalConsole.error(formattedMessage, metadata)
          : originalConsole.error(formattedMessage);
        break;
    }
  }
}
