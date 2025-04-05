import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createId } from '@acme/id';
import { loadConfig } from '@acme/tunnel';
import debug from 'debug';
import { render } from 'ink';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Layout } from './app/layout';

const log = debug('tunnel:cli');
const pkg = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8'),
) as { version: string };

// Setup React DevTools
try {
  log('Setting up React DevTools connection...');

  // Using the backend.js file directly
  // await import('react-devtools-core/backend');

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
      demandOption: !config.port,
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
  if (!argv.port) {
    throw new Error('Port is required');
  }
  if (!argv.apiKey) {
    throw new Error('API key is required');
  }

  try {
    const { waitUntilExit } = render(
      <Layout
        port={argv.port}
        apiKey={argv.apiKey}
        clientId={argv.clientId}
        debug={argv.debug}
        onAction={() => {}}
      />,
      // { patchConsole: true, debug:true },
    );

    await waitUntilExit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

void main();
