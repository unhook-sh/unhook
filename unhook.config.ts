import { defineTunnelConfig } from '@unhook/cli';

const config = defineTunnelConfig({
  tunnelId: 't_internal',
  to: [{ name: 'localClerk', url: 'http://localhost:3000/api/webhooks/clerk' }],
  forward: [{ from: 'clerk', to: 'localClerk' }],
} as const);

export default config;
