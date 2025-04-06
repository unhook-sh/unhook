import { exec } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/**
 * Gets the process ID (PID) of the process listening on the specified port.
 * Works cross-platform on Windows, macOS, and Linux.
 *
 * @param port - The port number to check
 * @returns The process ID if found, null otherwise
 */
export async function getProcessIdForPort(
  port: number,
): Promise<number | null> {
  try {
    const platform = os.platform();
    let command: string;

    if (platform === 'win32') {
      // Windows command to get PID
      command = `netstat -ano | findstr :${port}`;
    } else {
      // macOS and Linux command
      command = `lsof -i :${port} -t`;
    }

    const { stdout } = await execAsync(command);

    if (platform === 'win32') {
      // Parse Windows netstat output which looks like:
      // TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    1234
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (!line) continue;
        const parts = line.trim().split(/\s+/);
        if (parts.length < 5) continue;

        const portPart = parts[1];
        const pidPart = parts[4];

        if (!portPart || !pidPart) continue;
        if (!portPart.includes(`:${port}`)) continue;

        const pid = Number.parseInt(pidPart, 10);
        return Number.isNaN(pid) ? null : pid;
      }
      return null;
    }

    // Parse Unix lsof output
    const pid = Number.parseInt(stdout.trim(), 10);
    return Number.isNaN(pid) ? null : pid;
  } catch {
    return null;
  }
}
