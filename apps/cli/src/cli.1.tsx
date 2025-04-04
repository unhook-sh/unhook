#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { hostname, platform, release } from 'node:os';
import { join } from 'node:path';
import { createId } from '@acme/id';
import { startTunnelClient } from '@acme/tunnel';
import { loadConfig } from '@acme/tunnel/config';
import debug from 'debug';
import { render } from 'ink';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { App } from './ui/app';

const log = debug('tunnel:cli');
const pkg = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8'),
) as { version: string };

// function InteractiveApp({ children }: { children: React.ReactNode }) {
//   const { isRawModeSupported, setRawMode } = useStdin();

//   useEffect(() => {
//     if (isRawModeSupported) {
//       setRawMode(true);
//     }
//     return () => {
//       if (isRawModeSupported) {
//         setRawMode(false);
//       }
//     };
//   }, [isRawModeSupported, setRawMode]);

//   return <>{children}</>;
// }

async function main() {
  // Load config file first
  const config = await loadConfig();

  const argv = await yargs(hideBin(process.argv))
    .option('port', {
      alias: 'p',
      type: 'number',
      description: 'Port of the local service (e.g., 3000)',
      demandOption: !config.port,
      default: config.port,
    })
    .option('api-key', {
      alias: 'k',
      type: 'string',
      description: 'API key for authentication with the tunnel server',
      demandOption: !config.apiKey,
      // Can also be provided via TUNNEL_API_KEY environment variable or config file
      default: config.apiKey,
    })
    .option('client-id', {
      alias: 'c',
      type: 'string',
      description: 'Unique client identifier (default: auto-generated)',
      default: config.clientId ?? createId({ prefix: 'client' }),
    })
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug logging',
      default: config.debug ?? false,
    })
    .usage('Usage: $0 -p <port> -k <api-key> [-c <client-id>] [-d]')
    .help()
    .alias('help', 'h')
    .parseAsync();

  // Enable debug logging if requested
  if (argv.debug) {
    debug.enable('tunnel:*');
    log('Debug logging enabled');
  }

  if (!argv.apiKey) {
    console.error(
      'Error: API key is required. Provide it via --api-key, TUNNEL_API_KEY environment variable, or config file.',
    );
    process.exit(1);
  }

  if (!argv.port) {
    console.error(
      'Error: Port is required. Provide it via --port or TUNNEL_PORT environment variable.',
    );
    process.exit(1);
  }

  try {
    const metadata = {
      clientId: argv.clientId,
      clientVersion: pkg.version,
      clientOs: `${platform()} ${release()}`,
      clientHostname: hostname(),
    };

    let tunnelClient = startTunnelClient({
      port: argv.port,
      apiKey: argv.apiKey as string,
      metadata,
    });

    const { waitUntilExit } = render(
      <App
        port={argv.port}
        apiKey={argv.apiKey as string}
        clientId={argv.clientId}
        debug={argv.debug}
        onAction={(action, data) => {
          switch (action) {
            case 'status':
              // TODO: Implement status check
              break;
            case 'change-port':
              if (data?.port) {
                tunnelClient();
                tunnelClient = startTunnelClient({
                  port: data.port as number,
                  apiKey: argv.apiKey as string,
                  metadata,
                });
              }
              break;
            case 'logs':
              // TODO: Implement log viewing
              break;
            case 'metrics':
              // TODO: Implement metrics viewing
              break;
            case 'exit':
              tunnelClient();
              process.exit(0);
              break;
          }
        }}
      />,
    );

    // Handle cleanup on exit
    process.on('exit', () => {
      const terminal = process.stderr.isTTY
        ? process.stderr
        : process.stdout.isTTY
          ? process.stdout
          : undefined;
      terminal?.write('\u001B[?25h');
    });

    await waitUntilExit();
  } catch (error) {
    console.error('Failed to start tunnel client:', error);
    process.exit(1);
  }
}

void main();
