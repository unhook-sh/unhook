import { inspect } from 'node:util';
import { file } from 'bun';
import { debug as originalDebug } from 'debug';

// Create a BunFile and FileSink for logging
const logFilePath = 'unhook.log';
const logFile = file(logFilePath);
const logWriter = logFile.writer();

export function enableDebug(namespace: string) {
  originalDebug.enable(namespace);
}

// Factory function to create a logger with a specific namespace
export const debug = (namespace: string) => {
  const originalLog = originalDebug(namespace);

  // Logger function that logs to both console and file
  return (formatter: string, ...args: unknown[]) => {
    // Format objects using inspect for better readability
    const formattedArgs = args.map((arg) =>
      typeof arg === 'object'
        ? inspect(arg, { depth: null, colors: false })
        : arg,
    );

    // Log to console using debug
    originalLog(formatter, ...formattedArgs);

    if (originalLog.enabled) {
      // Write to file using FileSink
      try {
        logWriter.write(
          `${namespace}: ${formatter} ${formattedArgs.join(' ')}\n`,
        );
        logWriter.flush(); // Ensure the content is written to disk
      } catch (error) {
        console.error('Failed to write log to file:', error);
      }
    }
  };
};

// Initialize the logger
export const initializeLogger = () => {
  process.on('exit', () => {
    logWriter.flush();
    logWriter.end();
  });
};
