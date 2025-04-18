import { sql } from '@unhook/db/client';
import { debug } from '@unhook/logger';
import { capture, shutdown } from '../posthog';

const log = debug('unhook:cli:process');
export function setupProcessHandlers(): void {
  const handleTermination = async (signal: string) => {
    capture({
      event: 'cli_shutdown',
      properties: {
        exitType: signal,
      },
    });
    await shutdown();
    // Use standard signal exit codes (128 + signal number)
    const exitCode = signal === 'SIGINT' ? 130 : 143; // 128 + 2 for SIGINT, 128 + 15 for SIGTERM
    process.exit(exitCode);
  };

  process.on('SIGINT', () => void handleTermination('SIGINT'));
  process.on('SIGTERM', () => void handleTermination('SIGTERM'));
}

export async function cleanup(): Promise<void> {
  try {
    await sql.end();
  } catch (error) {
    log('Error closing database connection:', error);
  }
  await shutdown();
}
