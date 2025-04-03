import debug from 'debug';

// Create debuggers for different concerns
export const log = {
  main: debug('tunnel:main'),
  request: debug('tunnel:request'),
  response: debug('tunnel:response'),
  error: debug('tunnel:error'),
} as const;
