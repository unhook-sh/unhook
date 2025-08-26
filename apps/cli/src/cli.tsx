#!/usr/bin/env node
import { homedir } from 'node:os';
import { join } from 'node:path';
import { debug, defaultLogger } from '@unhook/logger';
import { RollingFileDestination } from '@unhook/logger/destinations/rolling-file';

const logDir = join(homedir(), '.unhook');
defaultLogger.addDestination(
  new RollingFileDestination({
    createDirectory: true,
    filepath: join(logDir, 'unhook.log'),
    maxFiles: 5, // 10MB
    maxSize: 10 * 1024 * 1024,
    rotationInterval: 60 * 60 * 1000, // 1 hour
  }),
);

import { render } from 'ink';
import { Layout } from './app/layout';
import { setConfigApiUrl } from './env';
import { parseArgs } from './lib/cli/args';
import { setupDebug } from './lib/cli/debug';
import { setupProcessHandlers } from './lib/cli/process';
import { capture, captureException, shutdown } from './lib/posthog';
import { useCliStore } from './stores/cli-store';
import { useConfigStore } from './stores/config-store';

const log = debug('unhook:cli');

async function main() {
  try {
    const args = await parseArgs();
    await setupDebug({ isDebugEnabled: args.verbose });
    useCliStore.setState(args);

    const config = await useConfigStore.getState().loadConfig();

    // Set API URL from config if available
    if (config.server?.apiUrl) {
      setConfigApiUrl(config.server.apiUrl);
      log('Using API URL from config:', config.server.apiUrl);
    }

    void useConfigStore.getState().watchConfig();

    if (config.debug) {
      // TODO: this is causing logging to not work for some reason
      // await setupDebug({ isDebugEnabled: config.debug });
    }

    capture({
      event: 'cli_loaded',
      properties: {
        clientId: config.clientId,
        command: args.command,
        debug: args.verbose,
        selfHosted: !!config.server?.apiUrl,
        version: args.version,
        webhookUrl: config.webhookUrl,
      },
    });

    setupProcessHandlers();

    log('Starting CLI', {
      apiUrl: config.server?.apiUrl,
      command: args.command,
      debug: args.verbose,
      version: args.version,
      webhookUrl: config.webhookUrl,
    });

    const renderInstance = render(<Layout />, {
      debug: args.verbose,
    });

    log('Waiting for CLI to exit...');
    await renderInstance.waitUntilExit();
    log('Cleanup after CLI exit...');
    renderInstance.cleanup();
  } catch (error) {
    log('Global error:', error);
    try {
      captureException(error as Error);
    } catch (error) {
      log('Error capturing exception:', error);
    }
  } finally {
    log('Cleanup in finally...');
    await shutdown();
    setTimeout(() => {
      process.exit(1);
    }, 0);
  }
}

void main();
