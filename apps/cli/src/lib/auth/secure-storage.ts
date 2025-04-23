import { debug } from '@unhook/logger';
import keytar from 'keytar';

const log = debug('unhook:cli:secure-storage');
const SERVICE_NAME = 'unhook-cli';

export class SecureStorage {
  constructor(private namespace: string) {}

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      log('Storing secure value for key: %s', this.getKey(key));
      await keytar.setPassword(SERVICE_NAME, this.getKey(key), value);
    } catch (error: unknown) {
      log('Error storing secure value: %O', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to store secure value: ${message}`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      log('Retrieving secure value for key: %s', this.getKey(key));
      const value = await keytar.getPassword(SERVICE_NAME, this.getKey(key));
      return value || null;
    } catch (error: unknown) {
      log('Error retrieving secure value: %O', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      log('Removing secure value for key: %s', this.getKey(key));
      await keytar.deletePassword(SERVICE_NAME, this.getKey(key));
    } catch (error: unknown) {
      log('Error removing secure value: %O', error);
      // Don't throw on removal errors
    }
  }
}
