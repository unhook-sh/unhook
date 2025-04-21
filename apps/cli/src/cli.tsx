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
    const config = await parseArgs();

    const { tunnelId, clientId, debug, version, argSources } =
      useCliStore.getState();

    capture({
      event: 'cli_loaded',
      properties: {
        tunnelId,
        clientId,
        debug,
        version,
        argSources,
      },
    });

    await setupDebug({ isDebugEnabled: debug ?? false });
    setupProcessHandlers();

    log('Starting CLI ', {
      tunnelId,
      clientId,
      debug,
      version,
      argSources,
    });

    const { waitUntilExit } = render(<Layout {...config} />, {
      debug: config.debug,
    });

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
