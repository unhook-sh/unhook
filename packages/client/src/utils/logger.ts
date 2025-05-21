import { debug } from '@unhook/logger';

// Create debuggers for different concerns
export const log = {
  main: debug('unhook:main'),
  request: debug('unhook:lib:request'),
  response: debug('unhook:lib:response'),
  error: debug('unhook:lib:error'),
} as const;
