import { debug } from '@unhook/logger';
import keytar from 'keytar';
import type { StorageInterface } from './storage-interface';

const log = debug('unhook:cli:secure-storage');
const SERVICE_NAME = 'unhook-cli';

interface StorageData {
  [key: string]: string | null;
}

export class SecureStorage implements StorageInterface {
  private data: StorageData = {};
  private namespace: string;

  constructor(props: { namespace: string }) {
    this.namespace = props.namespace;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      log('Storing secure value for key', fullKey);
      await keytar.setPassword(SERVICE_NAME, fullKey, value);
      // Update cache after successful keychain write
      this.data[fullKey] = value;
    } catch (error: unknown) {
      log('Error storing secure value', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to store secure value: ${message}`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const fullKey = this.getKey(key);
      log('Retrieving secure value for key');

      // Check cache first
      if (fullKey in this.data) {
        log('Retrieved secure value from cache');
        return this.data[fullKey] ?? null;
      }

      // If not in cache, get from keychain
      const value = await keytar.getPassword(SERVICE_NAME, fullKey);
      log('Retrieved secure value from keychain');

      // Update cache and return value
      if (typeof value === 'string') {
        this.data[fullKey] = value;
        return value;
      }

      this.data[fullKey] = null;
      return null;
    } catch (error: unknown) {
      log('Error retrieving secure value: %O', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const fullKey = this.getKey(key);
      log('Removing secure value for key', fullKey);
      await keytar.deletePassword(SERVICE_NAME, fullKey);
      // Remove from cache after successful keychain deletion
      delete this.data[fullKey];
    } catch (error: unknown) {
      log('Error removing secure value', error);
      // Don't throw on removal errors
    }
  }
}
