import { readFileSync } from 'node:fs';
import { hostname, platform, release } from 'node:os';
import { join } from 'node:path';
import { createId } from '@unhook/id';
import { startTunnelClient } from '@unhook/tunnel';
import { loadConfig } from '@unhook/tunnel/config';
import debug from 'debug';
import dedent from 'dedent-js';
import pc from 'picocolors';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const log = debug('unhook:cli');
const pkg = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8'),
) as { version: string };

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
      pc.red(
        'Error: API key is required. Provide it via --api-key, TUNNEL_API_KEY environment variable, or config file.',
      ),
    );
    process.exit(1);
  }

  if (!argv.port) {
    console.error(
      pc.red(
        'Error: Port is required. Provide it via --port or TUNNEL_PORT environment variable.',
      ),
    );
    process.exit(1);
  }

  try {
    // Print startup banner
    console.log();
    console.log(pc.cyan('  ▲ Tunnel CLI'));
    console.log();

    // Print initialization message
    console.log(pc.green('✓'), 'Starting...');

    const metadata = {
      clientId: argv.clientId,
      clientVersion: pkg.version,
      clientOs: `${platform()} ${release()}`,
      clientHostname: hostname(),
    };

    const stopClient = startTunnelClient({
      port: argv.port,
      apiKey: argv.apiKey,
      metadata,
    });

    // Print ready message with endpoints
    console.log(pc.green('✓'), 'Ready! Available endpoints:');
    console.log();
    console.log(dedent`
      ${pc.bold('  Endpoints:')}
        ${pc.dim('- Local:')}      ${pc.cyan(`http://localhost:${argv.port}`)}
        ${pc.dim('- Webhook:')}    ${pc.cyan(`https://your-app.vercel.app/api/tunnel?apiKey=${argv.apiKey}`)}
        ${pc.dim('- Dashboard:')}  ${pc.cyan(`https://your-app.vercel.app/tunnel/dashboard?apiKey=${argv.apiKey}`)}

      ${pc.bold('  Tunnel Info:')}
        ${pc.dim('- Client ID:')}  ${pc.cyan(argv.clientId)}
        ${pc.dim('- Version:')}    ${pc.cyan(pkg.version)}
        ${pc.dim('- Hostname:')}   ${pc.cyan(hostname())}
        ${pc.dim('- Platform:')}   ${pc.cyan(`${platform()} ${release()}`)}
        ${pc.dim('- API Key:')}    ${pc.cyan(argv.apiKey)}

      ${
        argv.debug
          ? ''
          : dedent`
      ${pc.bold('  Debug Logging:')}
        ${pc.dim('Run with')} ${pc.cyan('--debug')} ${pc.dim('or set')} ${pc.cyan('DEBUG=tunnel:*')} ${pc.dim('to see debug output')}
      `
      }
    `);
    console.log();

    // Keep the process alive
    process.stdin.resume();

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log();
      console.log(pc.yellow('⚠'), 'Shutting down tunnel client...');
      stopClient();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log();
      console.log(
        pc.yellow('⚠'),
        'Caught termination signal, shutting down client...',
      );
      stopClient();
      process.exit(0);
    });
  } catch (error) {
    console.error(pc.red('✕ Failed to start tunnel client:'), error);
    process.exit(1);
  }
}

void main();
