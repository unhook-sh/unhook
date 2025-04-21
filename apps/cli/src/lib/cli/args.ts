import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createId } from '@unhook/id';
import { loadConfig } from '@unhook/tunnel';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { CliState } from '~/stores/cli-store';

export async function parseArgs(): Promise<CliState> {
  const config = await loadConfig();
  const pkg = JSON.parse(
    readFileSync(join(__dirname, '../../../package.json'), 'utf-8'),
  ) as { version: string };

  const argv = await yargs(hideBin(process.argv))
    // .option('port', {
    //   alias: 'p',
    //   type: 'number',
    //   description: 'Port of the local service (e.g., 3000)',
    //   default: config.port,
    // })
    .option('tunnel-id', {
      alias: 't',
      type: 'string',
      description: 'Tunnel ID for authentication with the tunnel server',
      demandOption: !config.tunnelId,
      default: config.tunnelId,
    })
    .option('client-id', {
      alias: 'c',
      type: 'string',
      description: 'Unique client identifier (default: auto-generated)',
      default: config.clientId ?? createId({ prefix: 'client' }),
    })
    // .option('redirect', {
    //   alias: 'r',
    //   type: 'string',
    //   description:
    //     'URL to redirect requests to instead of forwarding (optional)',
    //   default: config.redirect,
    // })
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug logging',
      default: config.debug ?? false,
    })
    .option('telemetry', {
      type: 'boolean',
      description: 'Enable or disable telemetry data collection',
      default: config.telemetry,
    })
    // .option('ping', {
    //   type: 'string',
    //   description:
    //     'Target for connection checks: boolean (true/false), URL, or port number',
    //   default: config.ping ?? true,
    // })
    .usage(
      'Usage: $0 -t <tunnel-id> (-p <port> | -r <redirect-url>) [-c <client-id>] [-d] [--ping <value>]',
    )
    .help()
    .alias('help', 'h')
    .check((argv) => {
      if (!argv.tunnelId) {
        throw new Error('Tunnel ID (--tunnel-id or -t) is required.');
      }

      return true;
    })
    .parseAsync();

  const parsedConfig = argv as unknown as CliState;
  parsedConfig.version = pkg.version;

  return {
    tunnelId: parsedConfig.tunnelId,
    clientId: parsedConfig.clientId,
    debug: parsedConfig.debug,
    version: parsedConfig.version,
    telemetry: parsedConfig.telemetry,
    forward: parsedConfig.forward,
    argSources: {
      tunnelId: 'cli',
      clientId: 'cli',
      debug: 'cli',
      version: 'cli',
      telemetry: 'cli',
    },
    from: parsedConfig.from,
  };
}
