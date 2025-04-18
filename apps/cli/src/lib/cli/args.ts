import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createId } from '@unhook/id';
import { loadConfig } from '@unhook/tunnel';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { CliConfig, ParsedConfig } from '../../types/config';

function validatePingValue(value: unknown): boolean | string | number {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const pingLower = value.toLowerCase();
    if (pingLower === 'true') return true;
    if (pingLower === 'false') return false;

    const parsedPort = Number.parseInt(value, 10);
    if (!Number.isNaN(parsedPort) && parsedPort > 0 && parsedPort <= 65535) {
      return parsedPort;
    }

    try {
      new URL(value);
      return value;
    } catch {
      throw new Error(
        'Invalid ping value. Must be true, false, a valid URL, or a port number (1-65535).',
      );
    }
  }

  if (typeof value === 'number') {
    if (value < 1 || value > 65535 || !Number.isInteger(value)) {
      throw new Error('Invalid port number for ping. Must be between 1-65535.');
    }
    return value;
  }

  throw new Error(
    'Invalid ping value type. Must be boolean, string, or number.',
  );
}

export async function parseArgs(): Promise<ParsedConfig> {
  const config = await loadConfig();
  const pkg = JSON.parse(
    readFileSync(join(__dirname, '../../../package.json'), 'utf-8'),
  ) as { version: string };

  const argv = await yargs(hideBin(process.argv))
    .option('port', {
      alias: 'p',
      type: 'number',
      description: 'Port of the local service (e.g., 3000)',
      default: config.port,
    })
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
    .option('telemetry', {
      type: 'boolean',
      description: 'Enable or disable telemetry data collection',
      default: config.telemetry,
    })
    .option('ping', {
      type: 'string',
      description:
        'Target for connection checks: boolean (true/false), URL, or port number',
      default: config.ping ?? true,
    })
    .usage(
      'Usage: $0 -t <tunnel-id> (-p <port> | -r <redirect-url>) [-c <client-id>] [-d] [--ping <value>]',
    )
    .help()
    .alias('help', 'h')
    .check((argv) => {
      const portProvided = argv.port !== undefined;
      const redirectProvided = argv.redirect !== undefined;

      if (portProvided && redirectProvided) {
        throw new Error(
          'Options --port (-p) and --redirect (-r) are mutually exclusive.',
        );
      }

      if (!portProvided && !redirectProvided) {
        throw new Error(
          'Either --port (-p) or --redirect (-r) must be provided.',
        );
      }

      if (!argv.tunnelId) {
        throw new Error('Tunnel ID (--tunnel-id or -t) is required.');
      }

      argv.ping = validatePingValue(argv.ping);

      return true;
    })
    .parseAsync();

  const parsedConfig = argv as unknown as CliConfig;
  parsedConfig.version = pkg.version;

  const baseProps = {
    tunnelId: parsedConfig.tunnelId,
    clientId: parsedConfig.clientId,
    debug: parsedConfig.debug,
    version: parsedConfig.version,
    telemetry: parsedConfig.telemetry,
    ping: parsedConfig.ping,
  };

  if (parsedConfig.port !== undefined) {
    return {
      props: baseProps,
      exclusiveProps: { port: parsedConfig.port },
    };
  }

  if (typeof parsedConfig.redirect === 'string') {
    return {
      props: baseProps,
      exclusiveProps: { redirect: parsedConfig.redirect },
    };
  }

  throw new Error(
    'Internal error: Neither port nor redirect defined after validation.',
  );
}
