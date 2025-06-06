import { appendFile, mkdir, rename } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { LogDestination, LogMessage } from '../types';
import { formatLogArgs } from '../utils';

export interface RollingFileDestinationProps {
  /**
   * Base filepath for the log file
   * Example: ./logs/app.log
   */
  filepath: string;

  /**
   * Maximum size of each log file in bytes before rolling
   * Default: 10MB
   */
  maxSize?: number;

  /**
   * Maximum number of backup files to keep
   * Default: 5
   */
  maxFiles?: number;

  /**
   * Interval in milliseconds to force rotation regardless of size
   * Default: 24 hours
   */
  rotationInterval?: number;

  /**
   * Whether to create the directory if it doesn't exist
   * Default: true
   */
  createDirectory?: boolean;
}

export class RollingFileDestination implements LogDestination {
  private filepath: string;
  private maxSize: number;
  private maxFiles: number;
  private rotationInterval: number;
  private currentSize = 0;
  private lastRotation: number = Date.now();
  private rotationTimeout: Timer | null = null;

  constructor(props: RollingFileDestinationProps) {
    this.filepath = props.filepath;
    this.maxSize = props.maxSize ?? 10 * 1024 * 1024; // 10MB default
    this.maxFiles = props.maxFiles ?? 5;
    this.rotationInterval = props.rotationInterval ?? 24 * 60 * 60 * 1000; // 24 hours default

    if (props.createDirectory !== false) {
      mkdir(dirname(this.filepath), { recursive: true }).catch((error) => {
        console.error('Failed to create directory:', error);
      });
    }

    // Schedule time-based rotation
    if (this.rotationInterval > 0) {
      this.scheduleRotation();
    }
  }

  private scheduleRotation() {
    if (this.rotationTimeout) {
      clearTimeout(this.rotationTimeout);
    }

    const now = Date.now();
    const nextRotation = this.lastRotation + this.rotationInterval;
    const delay = Math.max(0, nextRotation - now);

    this.rotationTimeout = setTimeout(() => {
      this.rotate().catch((error) => {
        console.error('Failed to rotate log file:', error);
      });
      this.scheduleRotation();
    }, delay);
  }

  private async rotate(): Promise<void> {
    // Shift existing log files
    for (let i = this.maxFiles - 1; i >= 0; i--) {
      const source = i === 0 ? this.filepath : this.getBackupPath(i);
      const target = this.getBackupPath(i + 1);

      try {
        const sourceFile = Bun.file(source);
        if (await sourceFile.exists()) {
          await rename(source, target);
        }
      } catch (error) {
        console.error(
          `Failed to rotate log file from ${source} to ${target}:`,
          error,
        );
      }
    }

    this.currentSize = 0;
    this.lastRotation = Date.now();
  }

  private getBackupPath(index: number): string {
    const dir = dirname(this.filepath);
    const ext = this.filepath.includes('.')
      ? this.filepath.split('.').pop()
      : '';
    const base = this.filepath.substring(
      this.filepath.lastIndexOf('/') + 1,
      ext ? -ext.length - 1 : undefined,
    );
    return join(dir, `${base}.${index}${ext ? `.${ext}` : ''}`);
  }

  private async checkRotation(messageSize: number): Promise<void> {
    if (this.currentSize + messageSize > this.maxSize) {
      await this.rotate();
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await mkdir(dirname(this.filepath), { recursive: true });
    } catch (error) {
      console.error('Failed to create directory:', error);
      throw error;
    }
  }

  async write(message: LogMessage): Promise<void> {
    const { level, namespace, args, timestamp } = message;
    const formattedArgs = formatLogArgs(args);
    const formattedMessage = `[${timestamp.toISOString()}] [${level.toUpperCase()}] ${namespace}: ${formattedArgs}\n`;
    const messageSize = new TextEncoder().encode(formattedMessage).length;

    try {
      await this.checkRotation(messageSize);
      await appendFile(this.filepath, formattedMessage);
      this.currentSize += messageSize;
    } catch (error) {
      // If the error is ENOENT (file or directory doesn't exist), try to recreate the directory and retry
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        try {
          await this.ensureDirectoryExists();
          await appendFile(this.filepath, formattedMessage);
          this.currentSize += messageSize;
          return;
        } catch (retryError) {
          console.error('Failed to recover and write to log file:', retryError);
          throw retryError;
        }
      }

      console.error('Failed to write to log file:', error);
      throw error;
    }
  }
}
