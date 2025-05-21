import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defaultLogger } from '@unhook/logger';
import { debug } from '@unhook/logger';
import { RollingFileDestination } from '@unhook/logger/destinations/rolling-file';

const logDir = join(tmpdir(), 'unhook');
console.log(logDir);
defaultLogger.addDestination(
  new RollingFileDestination({
    filepath: join(logDir, 'unhook.log'),
    createDirectory: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    rotationInterval: 60 * 60 * 1000, // 1 hour
  }),
);

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
    const args = await parseArgs();
    await setupDebug({ isDebugEnabled: args.debug });
    useCliStore.setState(args);

    const config = await useConfigStore.getState().loadConfig();
    void useConfigStore.getState().watchConfig();

    if (config.debug) {
      // await setupDebug({ isDebugEnabled: config.debug });
    }

    capture({
      event: 'cli_loaded',
      properties: {
        webhookId: config.webhookId,
        clientId: config.clientId,
        debug: args.debug,
        version: args.version,
        command: args.command,
      },
    });

    setupProcessHandlers();

    log('Starting CLI', {
      webhookId: config.webhookId,
      debug: args.debug,
      version: args.version,
      command: args.command,
    });

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
