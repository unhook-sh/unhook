import { debug, defaultLogger } from '@unhook/logger';

const log = debug('unhook:cli');

// Static import that can be tree-shaken in production builds
let connectToDevTools: ((options?: unknown) => void) | null = null;

// Only attempt to import and use react-devtools in development/debug mode
// and when not running in a compiled binary
const isCompiledBinary =
  typeof (globalThis as unknown as { __BUN_EMBEDDED_MODULES__: unknown })
    .__BUN_EMBEDDED_MODULES__ !== 'undefined';
const isDev = process.env.NODE_ENV === 'development';

if (!isCompiledBinary && isDev) {
  try {
    // This will only be included in builds when not using --compile
    const reactDevTools = await import('react-devtools-core/backend');
    connectToDevTools = reactDevTools.connectToDevTools as (
      options?: unknown,
    ) => void;
  } catch (error) {
    // react-devtools-core might not be available in all environments
    log('React DevTools not available:', error);
  }
}

export async function setupDebug({
  isDebugEnabled,
}: {
  isDebugEnabled: boolean;
}): Promise<void> {
  if (!isDebugEnabled) return;

  defaultLogger.enableNamespace('unhook:*');
  log('Debug logging enabled');

  // Only attempt to connect to devtools if we have it available and we're not in a compiled binary
  if (connectToDevTools && !isCompiledBinary && isDev) {
    try {
      log('Setting up React DevTools connection...');
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
  } else {
    log('React DevTools skipped (compiled binary or not available)');
  }
}
