import { file } from 'bun';
import { debug as originalDebug } from 'debug';

// Create a BunFile and FileSink for logging
const logFile = file('hook.log');
const logWriter = logFile.writer();

export function enableDebug(namespace: string) {
  originalDebug.enable(namespace);
}

// Factory function to create a logger with a specific namespace
export const debug = (namespace: string) => {
  const originalLog = originalDebug(namespace);

  // Logger function that logs to both console and file
  return (formatter: string, ...args: unknown[]) => {
    // Log to console using debug
    originalLog(formatter, ...args);

    // Write to file using FileSink
    try {
      logWriter.write(`${namespace}: ${formatter} ${args.join(' ')}\n`);
    } catch (error) {
      console.error('Failed to write log to file:', error);
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
