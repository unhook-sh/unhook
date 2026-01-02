import isCI from 'is-ci';
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
      default: false,
      description: 'Enable verbose debug logging for troubleshooting.',
      type: 'boolean',
    })
    .option('non-interactive', {
      alias: 'y',
      default: false,
      description:
        'Enable non-interactive mode. Disables browser prompts, interactive forms, and user input. Automatically enabled in CI environments.',
      type: 'boolean',
    })
    .option('api-key', {
      alias: 'k',
      description:
        'API key or token for authentication in non-interactive mode. Can also be set via UNHOOK_API_KEY environment variable.',
      type: 'string',
    })
    .command(
      'init',
      'Authenticate with Unhook and set up your project. Creates an unhook.yaml config and guides you through connecting your webhook provider.',
      {
        code: {
          alias: 'c',
          description:
            'Authentication code for direct login (advanced; usually not needed).',
          type: 'string',
        },
        destination: {
          alias: 't',
          description:
            'Set the local destination URL to forward webhooks to (e.g., "http://localhost:3000/api/webhooks").',
          type: 'string',
        },
        source: {
          alias: 's',
          description:
            'Set the source name or URL for incoming webhooks (e.g., "stripe").',
          type: 'string',
        },
        webhookUrl: {
          alias: 'w',
          description:
            'Specify a webhook URL to use (e.g., https://unhook.sh/my-org/my-webhook).',
          type: 'string',
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
        config: {
          alias: 'c',
          description: 'Path to a custom unhook.yaml configuration file.',
          type: 'string',
        },
        path: {
          default: '.',
          description: 'Directory to watch for config changes (default: ".").',
          type: 'string',
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
          description:
            'Authentication code for direct login (advanced; usually not needed).',
          type: 'string',
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

  // Auto-detect CI environment or use explicit flag
  const nonInteractive =
    parsedConfig.nonInteractive || process.env.CI === 'true' || isCI;

  // Support UNHOOK_API_KEY environment variable as alternative to --api-key flag
  const apiKey = parsedConfig.apiKey || process.env.UNHOOK_API_KEY;

  return {
    apiKey: apiKey as string | undefined,
    code: parsedConfig.code,
    command,
    configPath: parsedConfig.configPath as string,
    destination: parsedConfig.destination as string,
    nonInteractive,
    path: parsedConfig.path as string,
    source: parsedConfig.source as string,
    verbose: parsedConfig.verbose,
    version: parsedConfig.version,
    webhookUrl: parsedConfig.webhookUrl as string,
  };
}
