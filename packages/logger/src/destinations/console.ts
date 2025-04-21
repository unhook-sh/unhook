import type { LogDestination, LogMessage } from '../types';

export class ConsoleDestination implements LogDestination {
  write(message: LogMessage): void {
    const { level, namespace, message: msg, metadata, timestamp } = message;
    const formattedMessage = `[${timestamp.toISOString()}] ${namespace}: ${msg}`;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, metadata);
        break;
      case 'info':
        console.info(formattedMessage, metadata);
        break;
      case 'warn':
        console.warn(formattedMessage, metadata);
        break;
      case 'error':
        console.error(formattedMessage, metadata);
        break;
    }
  }
}
