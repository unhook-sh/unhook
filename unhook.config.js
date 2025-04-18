// @ts-check

/**
 * Tunnel Configuration Example
 *
 * Environment Variables:
 * All settings can also be configured using environment variables:
 * - TUNNEL_PORT=3000
 * - TUNNEL_API_KEY=your-api-key-here
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
  // Port of the local service to forward traffic to
  // Can also be set via TUNNEL_PORT environment variable
  // port: 3002,

  // API key for authentication with the tunnel server
  // Can also be set via:
  // - TUNNEL_ID environment variable
  // - --tunnel-id command line flag
  tunnelId: 't_internal',

  // ping: 'https://o2em3sulde.execute-api.us-east-1.amazonaws.com/_debug/ping',
  ping: false,
  telemetry: true,

  // Optional: Unique client identifier
  // Can also be set via TUNNEL_CLIENT_ID environment variable
  // Default: auto-generated
  clientId: 'my-app',

  redirect: 'https://o2em3sulde.execute-api.us-east-1.amazonaws.com',

  // Optional: Enable debug logging
  // Can also be set via TUNNEL_DEBUG environment variable
  // Default: false
  debug: false,
};

export default config;
