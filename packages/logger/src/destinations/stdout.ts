import type { LogDestination, LogMessage } from '../types';

export class StdoutDestination implements LogDestination {
  constructor(
    private namespaces: string[] = [],
    private force = false,
  ) {}

  write(message: LogMessage): void {
    if (
      this.force ||
      this.namespaces.length === 0 ||
      this.namespaces.includes(message.namespace)
    ) {
      process.stdout.write(`${message.args.map(String).join(' ')}\n`);
    }
  }
}
