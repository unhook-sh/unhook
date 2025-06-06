import { inspect } from 'node-inspect-extracted';

export function formatLogArgs(args: unknown[]): string {
  return args
    .map((arg) => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        return inspect(arg, { colors: false, depth: null });
      }
      return String(arg);
    })
    .join(' ');
}
