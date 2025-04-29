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
 * @type {import('@unhook/tunnel/config').TunnelConfig}
 */
const config = {
  // Tunnel ID for authentication with the tunnel server
  // Can also be set via:
  // - TUNNEL_TUNNEL_ID environment variable
  // - --tunnel-id command line flag
  tunnelId: 't_2vCR1xwHHTLxE5m20AYewlc5y2j',

  // Optional: Unique client identifier
  // Can also be set via TUNNEL_CLIENT_ID environment variable
  // Default: auto-generated
  clientId: 'my-app',

  // Optional: Enable debug logging
  // Can also be set via TUNNEL_DEBUG environment variable
  // Default: false
  debug: false,

  to: [
    {
      name: 'clerk',
      url: 'http://localhost:3000/api/webhooks/clerk',
    },
  ],
  forward: [
    {
      from: 'clerk',
      to: 'clerk',
    },
  ],
};

export default config;
