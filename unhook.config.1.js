// @ts-check

/**
 * Tunnel Configuration Example
 *
 * Environment Variables:
 * All settings can also be configured using environment variables:
 * - TUNNEL_CLIENT_ID=my-app
 * - TUNNEL_DEBUG=true|false|1|0|yes|no
 *
 * Priority order (highest to lowest):
 * 1. Command line arguments
 * 2. Environment variables
 * 3. Configuration file
 * 4. Default values
 *
 * @type {import('@unhook/cli').TunnelConfig}
 */
const config = {
  tunnelId: 't_internal',
  forward: [
    { to: new URL('http://localhost:3000/api/webhooks/stripe') },
    { from: 'clerk', to: new URL('http://localhost:3000/api/webhooks/clerk') },
  ],
};

export default config;

// https://unhook.dev/t_internal?from=clerk

// Use case I want to forward any webhook to a somewhere else like Slack
// i.e. When clerk creates a new user I want to be able to have a webhook that forwards to Slack
// https://unhook.dev/t_internal?from=clerk&to=slack

// The "to" query param in the url will be called from the service that is listening for the webhook i.e. https://unhook.dev/api/tunnel/recieve
// i.e. it will not be called from the cli. Only local configs from the cli config will be called from the cli.
// Actually maybe the "to" query param shoulnd't be allowed and you can only configure it at the tunnel level in the UI.
