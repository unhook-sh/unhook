import { defaultLogger } from '@unhook/logger';
import { RollingFileDestination } from '@unhook/logger/destinations/rolling-file';

defaultLogger.addDestination(
  new RollingFileDestination({
    filepath: '.unhook/logs/unhook.log',
    createDirectory: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    rotationInterval: 60 * 60 * 1000, // 1 hour
  }),
);

import { debug } from '@unhook/logger';
import { render } from 'ink';
import { Layout } from './app/layout';
import { parseArgs } from './lib/cli/args';
import { setupDebug } from './lib/cli/debug';
import { cleanup, setupProcessHandlers } from './lib/cli/process';
import { capture, captureException } from './lib/posthog';
import { useCliStore } from './stores/cli-store';

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
