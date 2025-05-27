import { EventEmitter } from 'node:events';

interface RealtimeChannel {
  on: (event: string, callback: (payload: unknown) => void) => RealtimeChannel;
  subscribe: (
    callback?: (status: string, error?: Error) => void,
  ) => Promise<void>;
  unsubscribe: () => Promise<string>;
}

class MockRealtimeClient extends EventEmitter {
  private connected = false;
  private subscriptions = new Map<string, Set<(payload: unknown) => void>>();
  private shouldFailInsert = false;

  constructor() {
    super();
    // Automatically connect on creation for test convenience
    this.connect();
  }

  isConnected() {
    return this.connected;
  }

  async connect() {
    this.connected = true;
    this.emit('connected');
    return Promise.resolve();
  }

  async disconnect() {
    this.connected = false;
    this.emit('disconnected');
    return Promise.resolve();
  }

  channel(table: string): RealtimeChannel {
    const channel: RealtimeChannel = {
      on: (event: string, callback: (payload: unknown) => void) => {
        const key = `${table}:${event}`;
        if (!this.subscriptions.has(key)) {
          this.subscriptions.set(key, new Set());
        }
        this.subscriptions.get(key)?.add(callback);
        return channel;
      },
      subscribe: (callback?: (status: string, error?: Error) => void) => {
        if (callback) {
          // Simulate successful subscription
          callback('SUBSCRIBED');
        }
        return Promise.resolve();
      },
      unsubscribe: async () => {
        return 'ok';
      },
    };
    return channel;
  }

  // Helper method to simulate receiving an event
  simulateEvent(table: string, event: string, payload: unknown) {
    const key = `${table}:${event}`;
    const callbacks = this.subscriptions.get(key);
    if (callbacks) {
      // Format payload to match Supabase's realtime event structure
      const formattedPayload = {
        schema: 'public',
        table,
        commit_timestamp: new Date().toISOString(),
        eventType: event,
        new: payload,
        old: null,
      };
      for (const cb of callbacks) {
        cb(formattedPayload);
      }
    }
  }

  // Simulate network interruption
  simulateNetworkDisconnect() {
    this.disconnect();
  }
  simulateNetworkReconnect() {
    this.connect();
  }

  // Simulate insert error for testing
  setShouldFailInsert(shouldFail: boolean) {
    this.shouldFailInsert = shouldFail;
  }
  async insert(table: string, data: unknown) {
    if (this.shouldFailInsert) {
      return { data: null, error: new Error('Simulated insert error') };
    }
    // Simulate successful insert and emit event with proper payload structure
    this.simulateEvent(table, 'INSERT', data);
    return { data, error: null };
  }
}

export function createMockRealtimeClient() {
  return new MockRealtimeClient();
}
