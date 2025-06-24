import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import type { AppRoutePath } from '~/app/routes';
import { env } from '~/env';
import type { CliState } from '~/stores/cli-store';

export async function parseArgs(): Promise<CliState> {
  // Version is injected at build time
  const version = env.NEXT_PUBLIC_CLI_VERSION || '0.0.0';

  // Map command to route path
  const commandToPath: Record<string, AppRoutePath> = {
    init: '/init',
    listen: '/events',
    login: '/login',
  };

  let command: AppRoutePath | undefined;

  const argv = await yargs(hideBin(process.argv))
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Enable verbose debug logging for troubleshooting.',
      default: false,
    })
    .command(
      'init',
      'Authenticate with Unhook and set up your project. Creates an unhook.yaml config and guides you through connecting your webhook provider.',
      {
        code: {
          alias: 'c',
          type: 'string',
          description:
            'Authentication code for direct login (advanced; usually not needed).',
        },
        webhook: {
          alias: 'w',
          type: 'string',
          description:
            'Specify a webhook ID to use (optional; usually auto-generated).',
        },
        source: {
          alias: 's',
          type: 'string',
          description:
            'Set the source name or URL for incoming webhooks (e.g., "stripe").',
        },
        destination: {
          alias: 't',
          type: 'string',
          description:
            'Set the local destination URL to forward webhooks to (e.g., "http://localhost:3000/api/webhooks").',
        },
      },
      () => {
        command = commandToPath['init' as keyof typeof commandToPath];
      },
    )
    .command(
      'listen',
      'Start the Unhook relay to receive and forward webhooks to your local server. Keeps the CLI running and displays incoming requests.',
      {
        path: {
          type: 'string',
          description: 'Directory to watch for config changes (default: ".").',
          default: '.',
        },
        config: {
          alias: 'c',
          type: 'string',
          description: 'Path to a custom unhook.yaml configuration file.',
        },
      },
      () => {
        command = commandToPath['listen' as keyof typeof commandToPath];
      },
    )
    .command(
      'login',
      'Authenticate your CLI with your Unhook account. Opens a browser for login.',
      {
        code: {
          alias: 'c',
          type: 'string',
          description:
            'Authentication code for direct login (advanced; usually not needed).',
        },
      },
      () => {
        command = commandToPath['login' as keyof typeof commandToPath];
      },
    )
    .help()
    .alias('help', 'h')
    .scriptName('unhook')
    .parseAsync();

  // biome-ignore lint/suspicious/noExplicitAny: args doesn't have a type
  const parsedConfig = argv as any;
  parsedConfig.version = version;

  return {
    verbose: parsedConfig.verbose,
    version: parsedConfig.version,
    code: parsedConfig.code,
    command,
    path: parsedConfig.path as string,
    webhookId: parsedConfig.webhook as string,
    source: parsedConfig.source as string,
    destination: parsedConfig.destination as string,
    configPath: parsedConfig.configPath as string,
  };
}
