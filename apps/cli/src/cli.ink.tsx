import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '@unhook/db/client';
import { createId } from '@unhook/id';
import { loadConfig } from '@unhook/tunnel';
import { render } from 'ink';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Layout } from './app/layout';
import { debug, enableDebug } from './log';
import { initializeLogger } from './log';
import type { PageProps, PagePropsExclusive } from './types';

const log = debug('unhook:cli');

const pkg = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8'),
) as { version: string };

// Initialize the logger
initializeLogger();

// Setup React DevTools
try {
  log('Setting up React DevTools connection...');

  // Initialize React DevTools backend with websocket connection
  const { connectToDevTools } = await import('react-devtools-core/backend');
  log('Connecting to React DevTools...');
  connectToDevTools({
    host: 'localhost', // Use the IP address shown in the DevTools UI
    port: 8097,
    isAppActive: () => true,
    websocket: true, // Enable WebSocket connection
    resolveRNStyle: null,
  });

  log('React DevTools connection setup complete');
} catch (error) {
  log('Failed to setup React DevTools:', error);
}

async function main() {
  // Load config file first
  const config = await loadConfig();

  const argv = await yargs(hideBin(process.argv))
    .option('port', {
      alias: 'p',
      type: 'number',
      description: 'Port of the local service (e.g., 3000)',
      default: config.port,
    })
    .option('api-key', {
      alias: 'k',
      type: 'string',
      description: 'API key for authentication with the tunnel server',
      demandOption: !config.apiKey,
      default: config.apiKey,
    })
    .option('client-id', {
      alias: 'c',
      type: 'string',
      description: 'Unique client identifier (default: auto-generated)',
      default: config.clientId ?? createId({ prefix: 'client' }),
    })
    .option('redirect', {
      alias: 'r',
      type: 'string',
      description:
        'URL to redirect requests to instead of forwarding (optional)',
      default: config.redirect,
    })
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug logging',
      default: config.debug ?? false,
    })
    .option('ping', {
      type: 'string', // Accept string initially, validation handles types
      description:
        'Target for connection checks: boolean (true/false), URL, or port number',
      default: config.ping ?? true, // Default from config or true
    })
    .usage(
      'Usage: $0 -k <api-key> (-p <port> | -r <redirect-url>) [-c <client-id>] [-d] [--ping <value>]',
    )
    .help()
    .alias('help', 'h')
    .check((argv) => {
      const portProvided = argv.port !== undefined;
      const redirectProvided = argv.redirect !== undefined;

      // Check for mutual exclusion
      if (portProvided && redirectProvided) {
        throw new Error(
          'Options --port (-p) and --redirect (-r) are mutually exclusive. Please provide only one, either via command line or config file.',
        );
      }

      // Check if at least one is provided
      if (!portProvided && !redirectProvided) {
        throw new Error(
          'Either --port (-p) or --redirect (-r) must be provided, either via command line or config file.',
        );
      }

      // API key is always required
      if (!argv.apiKey) {
        // This check is technically redundant due to yargs' handling of demandOption/default,
        // but kept for explicit safety.
        throw new Error('API key (--api-key or -k) is required.');
      }

      // Validate ping value
      let validPing = true;
      if (typeof argv.ping === 'string') {
        const pingLower = argv.ping.toLowerCase();
        if (pingLower === 'true') {
          argv.ping = true;
        } else if (pingLower === 'false') {
          argv.ping = false;
        } else {
          // Try parsing as number (port)
          const parsedPort = Number.parseInt(argv.ping, 10);
          if (
            !Number.isNaN(parsedPort) &&
            parsedPort > 0 &&
            parsedPort <= 65535
          ) {
            argv.ping = parsedPort;
          } else {
            // Try validating as URL
            try {
              new URL(argv.ping);
              // keep as string
            } catch {
              validPing = false; // Invalid URL
            }
          }
        }
      } else if (typeof argv.ping === 'number') {
        if (
          argv.ping < 1 ||
          argv.ping > 65535 ||
          !Number.isInteger(argv.ping)
        ) {
          validPing = false; // Invalid port number
        }
      } else if (typeof argv.ping !== 'boolean') {
        validPing = false; // Not a boolean, string, or number
      }

      if (!validPing) {
        throw new Error(
          'Invalid --ping value. Must be true, false, a valid URL, or a port number (1-65535).',
        );
      }

      return true; // Validation passed
    })
    .parseAsync();

  // Perform runtime checks to satisfy TypeScript and linters, even though
  // yargs validation should prevent these errors.
  if (typeof argv.apiKey !== 'string' || !argv.apiKey) {
    throw new Error('Internal error: API key is missing after validation.');
  }

  let exclusiveProps: PagePropsExclusive;
  if (argv.port !== undefined) {
    exclusiveProps = { port: argv.port };
  } else if (typeof argv.redirect === 'string') {
    exclusiveProps = { redirect: argv.redirect };
  } else {
    throw new Error(
      'Internal error: Neither port nor redirect defined after validation.',
    );
  }

  // Construct the props object conforming to PageProps
  const layoutProps: PageProps = {
    apiKey: argv.apiKey, // apiKey is now confirmed string
    clientId: argv.clientId,
    debug: argv.debug,
    version: pkg.version,
    ...exclusiveProps,
    ping: argv.ping, // Add the validated ping value
  };

  // Enable debug logging if requested
  if (layoutProps.debug) {
    enableDebug('unhook:*');
    log('Debug logging enabled');
  }

  // API key check (already validated, but keep for explicit safety)
  if (!layoutProps.apiKey) {
    throw new Error('API key is required');
  }

  try {
    const { waitUntilExit } = render(
      <Layout {...layoutProps} />, // Spread the correctly typed props
      { debug: false },
    );

    await waitUntilExit();
    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

void main();
