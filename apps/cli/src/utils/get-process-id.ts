import os from 'node:os';
import { debug } from '@unhook/logger';
import { $ } from 'zx';

const log = debug('unhook:cli:get-process-id');

interface ProcessInfo {
  pid: number;
  name: string;
}

/**
 * Gets the process ID (PID) and name of the process listening on the specified port.
 * Works cross-platform on Windows, macOS, and Linux.
 *
 * @param port - The port number to check
 * @returns The process info if found, null otherwise
 */
export async function getProcessIdForPort(
  port: number,
): Promise<ProcessInfo | null> {
  try {
    const platform = os.platform();
    let pidCommand: string;
    let processInfoCommand: string;

    if (platform === 'win32') {
      // Windows command to get PID
      pidCommand = `netstat -ano | findstr :${port}`;
      processInfoCommand = 'tasklist /FI "PID eq $PID" /FO CSV /NH';
    } else {
      // macOS and Linux command
      pidCommand = `lsof -i :${port} -t`;
      // Get both command name and arguments for better identification
      processInfoCommand = 'ps -p $PID -o comm=,args=';
    }

    // Get PID first
    const pidOutput = await $`${pidCommand}`.quiet();
    const pidStdout = pidOutput.stdout.trim();

    if (platform === 'win32') {
      // Parse Windows netstat output which looks like:
      // TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    1234
      const lines = pidStdout.split('\n');
      for (const line of lines) {
        if (!line) continue;
        const parts = line.trim().split(/\s+/);
        if (parts.length < 5) continue;

        const portPart = parts[1];
        const pidPart = parts[4];

        if (!portPart || !pidPart) continue;
        if (!portPart.includes(`:${port}`)) continue;

        const pid = Number.parseInt(pidPart, 10);
        if (Number.isNaN(pid)) continue;

        // Get process name
        const processOutput =
          await $`${processInfoCommand.replace('$PID', pid.toString())}`.quiet();
        const processName =
          processOutput.stdout.split(',')[0]?.replace(/"/g, '').trim() ??
          'unknown';

        return {
          pid,
          name: processName,
        };
      }
      return null;
    }

    // Parse Unix lsof output
    const pid = Number.parseInt(pidStdout, 10);
    if (Number.isNaN(pid)) return null;

    // Get process name and args
    const processOutput =
      await $`${processInfoCommand.replace('$PID', pid.toString())}`.quiet();
    const processInfo = processOutput.stdout.trim();

    // Extract a human readable name from the process info
    const [processPath = 'unknown', ...args] = processInfo.split(/\s+/);
    const executableName = processPath.split('/').pop() || 'unknown';

    // For node processes, try to get the script name
    if (executableName === 'node') {
      const scriptName = args
        .find((arg) => arg.endsWith('.js') || arg.endsWith('.mjs'))
        ?.split('/')
        .pop();
      return {
        pid,
        name: scriptName ? `node (${scriptName})` : 'node',
      };
    }

    return {
      pid,
      name: executableName,
    };
  } catch (error) {
    // Log error for debugging but return null to maintain the function's contract
    log('Error getting process info:', error);
    return null;
  }
}
