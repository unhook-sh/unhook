import { debug } from '@unhook/logger';

// Create debuggers for different concerns
export const log = {
  error: debug('unhook:lib:error'),
  main: debug('unhook:main'),
  request: debug('unhook:lib:request'),
  response: debug('unhook:lib:response'),
} as const;
