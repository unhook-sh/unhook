import { debug, defaultLogger } from '@unhook/logger';
import { useCliStore } from '../../stores/cli-store';
import { useConnectionStore } from '../../stores/connection-store';
import { useEventStore } from '../../stores/events-store';
import { capture, captureException, shutdown } from '../posthog';

const log = debug('unhook:cli:process');

let webhookClientCleanup: (() => void) | null = null;
let requestSubscriptionCleanup: (() => void) | undefined;

export function setWebhookClientCleanup(cleanup: () => void) {
  webhookClientCleanup = cleanup;
}

export function setRequestSubscriptionCleanup(cleanup: () => void) {
  requestSubscriptionCleanup = cleanup;
}

function exit(exitCode: number) {
  setTimeout(() => {
    process.exit(exitCode);
  }, 0);
}

export function setupProcessHandlers(): void {
  const handleTermination = async (signal: string) => {
    log(`Received ${signal} signal, starting cleanup...`);

    try {
      // Capture shutdown event first in case other operations fail
      capture({
        event: 'cli_shutdown',
        properties: {
          exitType: signal,
        },
      });

      // Run cleanup operations
      await cleanup();

      // Use standard signal exit codes (128 + signal number)
      const exitCode = signal === 'SIGINT' ? 130 : 143; // 128 + 2 for SIGINT, 128 + 15 for SIGTERM
      log(`Cleanup complete, exiting with code: ${exitCode}`);
      exit(exitCode);
    } catch (error) {
      log('Error during cleanup:', error);
      exit(1);
    }
  };

  // Ensure we handle the signals synchronously to prevent multiple cleanup attempts
  let isCleaningUp = false;

  const signalHandler = (signal: string) => {
    if (isCleaningUp) {
      log(`Cleanup already in progress, ignoring ${signal} signal`);
      return;
    }
    isCleaningUp = true;
    void handleTermination(signal);
  };

  process.on('SIGINT', () => signalHandler('SIGINT'));
  process.on('SIGTERM', () => signalHandler('SIGTERM'));
  process.on('uncaughtException', (e) => {
    log('Uncaught exception:', e.stack);
    captureException(e);
    void handleTermination('SIGINT');
  });
}

export async function cleanup() {
  log('Starting cleanup process...');

  if (webhookClientCleanup) {
    log('Cleaning up webhook client...');
    webhookClientCleanup();
    webhookClientCleanup = null;
  }

  if (requestSubscriptionCleanup) {
    log('Cleaning up request subscription...');
    requestSubscriptionCleanup();
    requestSubscriptionCleanup = undefined;
  }

  log('Resetting stores...');
  useConnectionStore.getState().reset();
  useCliStore.getState().reset();
  useEventStore.getState().reset();

  log('Shutting down posthog...');
  await shutdown();

  // Destroy logger to flush remaining logs
  log('Destroying logger...');
  defaultLogger.destroy();

  log('Cleanup complete');
}
