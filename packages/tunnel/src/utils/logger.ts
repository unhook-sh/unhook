import debug from 'debug';

// Create debuggers for different concerns
export const log = {
  main: debug('unhook:main'),
  request: debug('unhook:request'),
  response: debug('unhook:response'),
  error: debug('unhook:error'),
} as const;
