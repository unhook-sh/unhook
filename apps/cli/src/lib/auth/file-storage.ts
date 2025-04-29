import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { debug } from '@unhook/logger';
import type { StorageInterface } from './storage-interface';

const log = debug('unhook:cli:file-storage');
const STORAGE_DIR = path.join(os.homedir(), '.unhook');

interface StorageData {
  [key: string]: string;
}

export class FileStorage implements StorageInterface {
  private data: StorageData = {};
  private storageFile: string;
  private namespace: string;

  constructor(props: { namespace: string; fileName?: string }) {
    this.namespace = props.namespace;
    this.storageFile = path.join(STORAGE_DIR, props.fileName ?? 'storage.json');

    // Initialize storage asynchronously
    this.initStorage().catch((error) => {
      log('Error initializing storage', error);
    });
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private async initStorage(): Promise<void> {
    try {
      // Ensure storage directory exists
      await fs.mkdir(STORAGE_DIR, { recursive: true });

      // Try to read existing data
      try {
        const fileContent = await fs.readFile(this.storageFile, 'utf-8');
        this.data = JSON.parse(fileContent);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
        // File doesn't exist yet, use empty data object
        this.data = {};
      }
    } catch (error: unknown) {
      log('Error initializing storage', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize storage: ${message}`);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await fs.writeFile(
        this.storageFile,
        JSON.stringify(this.data, null, 2),
        'utf-8',
      );
    } catch (error: unknown) {
      log('Error saving data', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to save data: ${message}`);
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      // Ensure storage is initialized
      await this.initStorage();

      log('Storing value for key', this.getKey(key));
      this.data[this.getKey(key)] = value;
      await this.saveData();
    } catch (error: unknown) {
      log('Error storing value', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to store value: ${message}`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      // Ensure storage is initialized
      await this.initStorage();

      log('Retrieving value for key', this.getKey(key));
      const value = this.data[this.getKey(key)];
      return value || null;
    } catch (error: unknown) {
      log('Error retrieving value: %O', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      // Ensure storage is initialized
      await this.initStorage();

      log('Removing value for key', this.getKey(key));
      delete this.data[this.getKey(key)];
      await this.saveData();
    } catch (error: unknown) {
      log('Error removing value', error);
      // Don't throw on removal errors
    }
  }
}
