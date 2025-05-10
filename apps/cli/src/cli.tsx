import { defaultLogger } from '@unhook/logger';
import { debug } from '@unhook/logger';
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

import { loadConfig } from '@unhook/webhook/config';
import { render } from 'ink';
import { Layout } from './app/layout';
import { parseArgs } from './lib/cli/args';
import { setupDebug } from './lib/cli/debug';
import { setupProcessHandlers } from './lib/cli/process';
import { capture, captureException } from './lib/posthog';
import { useCliStore } from './stores/cli-store';
import { useConfigStore } from './stores/config-store';

const log = debug('unhook:cli');

async function main() {
  try {
    const config = await loadConfig();
    useConfigStore.getState().setConfig(config);

    const args = await parseArgs({ debug: config.debug });
    useCliStore.getState().setCliArgs(args);

    capture({
      event: 'cli_loaded',
      properties: {
        webhookId: config.webhookId,
        clientId: config.clientId,
        debug: args.debug,
        version: args.version,
      },
    });

    await setupDebug({ isDebugEnabled: args.debug });
    setupProcessHandlers();

    log('Starting CLI', {
      webhookId: config.webhookId,
      clientId: config.clientId,
      debug: args.debug,
      version: args.version,
    });
    log('args', useConfigStore.getState());

    const renderInstance = render(<Layout />, {
      debug: args.debug,
    });

    log('Waiting for CLI to exit...');
    await renderInstance.waitUntilExit();
    log('Cleanup after CLI exit...');
    renderInstance.cleanup();
  } catch (error) {
    log('Global error:', error);
    captureException(error as Error);
    setTimeout(() => {
      process.exit(1);
    }, 0);
  } finally {
    log('Cleanup in finally...');
  }
}

void main();
