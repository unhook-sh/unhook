import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { AppRoutePath } from '~/app/routes';
import type { CliState } from '~/stores/cli-store';

export async function parseArgs({
  debug,
}: {
  debug?: boolean;
}): Promise<CliState> {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, '../../../package.json'), 'utf-8'),
  ) as { version: string };

  const argv = await yargs(hideBin(process.argv))
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug logging',
      default: debug ?? false,
    })
    .command('init', 'Initialize a new Unhook project', {
      path: {
        type: 'string',
        description: 'Path to initialize the project',
        default: '.',
      },
      code: {
        alias: 'c',
        type: 'string',
        description: 'Authentication code for direct login',
      },
      webhookId: {
        alias: 'w',
        type: 'string',
        description: 'Webhook ID to use',
      },
      from: {
        alias: 'f',
        type: 'string',
        description: 'Source URL or path',
      },
      to: {
        alias: 't',
        type: 'string',
        description: 'Destination URL or path',
      },
    })
    .command('listen', 'Start listening for changes', {
      path: {
        type: 'string',
        description: 'Path to watch for changes',
        default: '.',
      },
      config: {
        alias: 'c',
        type: 'string',
        description: 'Path to configuration file',
      },
    })
    .command('login', 'Login to your Unhook account', {
      code: {
        alias: 'c',
        type: 'string',
        description: 'Authentication code for direct login',
      },
    })
    .usage('Usage: $0 <command> [options]')
    .help()
    .alias('help', 'h')
    .parseAsync();

  const parsedConfig = argv as unknown as CliState;
  parsedConfig.version = pkg.version;

  // Map command to route path
  const commandToPath: Record<string, AppRoutePath> = {
    init: '/init',
    listen: '/listen',
    login: '/login',
  };

  return {
    debug: parsedConfig.debug,
    version: parsedConfig.version,
    code: parsedConfig.code,
    command: commandToPath[parsedConfig.command as string] || '/',
    path: parsedConfig.path as string,
    webhookId: parsedConfig.webhookId as string,
    from: parsedConfig.from as string,
    to: parsedConfig.to as string,
    configPath: parsedConfig.configPath as string,
  };
}
