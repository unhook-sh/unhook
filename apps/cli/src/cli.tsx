import { initializeLogger } from '@unhook/logger';
import { debug } from '@unhook/logger';
import { render } from 'ink';
import { Layout } from './app/layout';
import { parseArgs } from './lib/cli/args';
import { setupDebug } from './lib/cli/debug';
import { cleanup, setupProcessHandlers } from './lib/cli/process';
import { capture, captureException } from './lib/posthog';
import { useCliStore } from './stores/cli-store';

// Initialize the logger
initializeLogger();

const log = debug('unhook:cli');

async function main() {
  try {
    const { props, exclusiveProps } = await parseArgs();

    const {
      port,
      tunnelId,
      clientId,
      redirect,
      debug,
      version,
      ping,
      argSources,
    } = useCliStore.getState();

    capture({
      event: 'cli_loaded',
      properties: {
        port,
        tunnelId,
        clientId,
        redirect,
        debug,
        version,
        ping,
        argSources,
      },
    });

    await setupDebug({ isDebugEnabled: props.debug });
    setupProcessHandlers();

    log('Starting CLI ', {
      tunnelId: props.tunnelId,
      ...exclusiveProps,
    });

    const { waitUntilExit } = render(
      <Layout {...props} {...exclusiveProps} />,
      { debug: props.debug },
    );

    await waitUntilExit();
    await cleanup();
  } catch (error) {
    log('Error:', error);
    captureException(error as Error);
    await cleanup();
    process.exit(1);
  }
}

void main();
