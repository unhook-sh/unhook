import { originalConsole } from '../logger';
import type { LogDestination, LogMessage } from '../types';
import { formatLogArgs } from '../utils';

export class ConsoleDestination implements LogDestination {
  write(message: LogMessage): void {
    const { level, namespace, args, timestamp } = message;
    const formattedArgs = formatLogArgs(args);
    const formattedMessage = `[${timestamp.toISOString()}] ${namespace}: ${formattedArgs}`;
    originalConsole[level](formattedMessage);
  }
}
