import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { AppRoutePath } from '~/app/routes';
import type { CliState } from '~/stores/cli-store';

export async function parseArgs(): Promise<CliState> {
  const pkg = JSON.parse(
    readFileSync(join(__dirname, '../../../package.json'), 'utf-8'),
  ) as { version: string };

  // Map command to route path
  const commandToPath: Record<string, AppRoutePath> = {
    init: '/init',
    listen: '/events',
    login: '/login',
  };

  let command: AppRoutePath | undefined;

  const argv = await yargs(hideBin(process.argv))
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Enable debug logging',
      default: false,
    })
    .command(
      'init',
      'Initialize a new Unhook project',
      {
        code: {
          alias: 'c',
          type: 'string',
          description: 'Authentication code for direct login',
        },
        webhook: {
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
      },
      () => {
        command = commandToPath['init' as keyof typeof commandToPath];
      },
    )
    .command(
      'listen',
      'Start listening for changes',
      {
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
      },
      () => {
        command = commandToPath['listen' as keyof typeof commandToPath];
      },
    )
    .command(
      'login',
      'Login to your Unhook account',
      {
        code: {
          alias: 'c',
          type: 'string',
          description: 'Authentication code for direct login',
        },
      },
      () => {
        command = commandToPath['login' as keyof typeof commandToPath];
      },
    )
    .command('version', 'Display the current version', {}, () => {
      console.log(`Unhook CLI v${pkg.version}`);
      process.exit(0);
    })
    .usage('Usage: $0 <command> [options]')
    .help()
    .alias('help', 'h')
    .parseAsync();

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const parsedConfig = argv as any;
  parsedConfig.version = pkg.version;

  return {
    debug: parsedConfig.debug,
    version: parsedConfig.version,
    code: parsedConfig.code,
    command,
    path: parsedConfig.path as string,
    webhookId: parsedConfig.webhook as string,
    from: parsedConfig.from as string,
    to: parsedConfig.to as string,
    configPath: parsedConfig.configPath as string,
  };
}
