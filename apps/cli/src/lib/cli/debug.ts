import { debug, defaultLogger } from '@unhook/logger';

const log = debug('unhook:cli');

export async function setupDebug({
  isDebugEnabled,
}: { isDebugEnabled: boolean }): Promise<void> {
  if (!isDebugEnabled) return;

  defaultLogger.enableNamespace('unhook:*');
  log('Debug logging enabled');

  try {
    log('Setting up React DevTools connection...');
    const { connectToDevTools } = await import('react-devtools-core/backend');
    log('Connecting to React DevTools...');
    connectToDevTools({
      host: 'localhost',
      port: 8097,
      isAppActive: () => true,
      websocket: true,
      resolveRNStyle: null,
    });
    log('React DevTools connection setup complete');
  } catch (error) {
    log('Failed to setup React DevTools:', error);
  }
}
