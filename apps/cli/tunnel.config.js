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
 * @type {import('@acme/tunnel/config').TunnelConfig}
 */
const config = {
  // Port of the local service to forward traffic to
  // Can also be set via TUNNEL_PORT environment variable
  port: 3000,

  // API key for authentication with the tunnel server
  // Can also be set via:
  // - TUNNEL_API_KEY environment variable
  // - --api-key command line flag
  apiKey: 'your-api-key-here',

  // Optional: Unique client identifier
  // Can also be set via TUNNEL_CLIENT_ID environment variable
  // Default: auto-generated
  clientId: 'my-app',

  // Optional: Enable debug logging
  // Can also be set via TUNNEL_DEBUG environment variable
  // Default: false
  debug: false,
};

export default config;
