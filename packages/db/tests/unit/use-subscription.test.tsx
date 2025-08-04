import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { act, renderHook } from '@testing-library/react';
import type { TableName } from '../../src/supabase/types';
import {
  SubscriptionProvider,
  useSubscription,
} from '../../src/supabase/use-subscription';

// Create mock functions using Bun's mock
const mockCreateClient = mock(() => ({
  channel: mock(() => ({
    on: mock(() => ({
      subscribe: mock((callback: (status: string, error?: Error) => void) => {
        // Store the callback for later use in tests
        // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
        (global as any).__subscriptionCallback = callback;
        return {
          unsubscribe: mock(() => {}),
        };
      }),
    })),
  })),
  realtime: {
    connect: mock(() => {}),
    disconnect: mock(() => {}),
    isConnected: mock(() => true),
  },
  removeAllChannels: mock(() => {}),
  removeChannel: mock(() => {}),
}));

// Mock the Supabase client module
mock.module('../../src/supabase/client', () => ({
  createClient: mockCreateClient,
}));

describe.skip('useSubscription Unit Tests', () => {
  const mockToken = 'test-token';
  const mockUrl = 'https://test.supabase.co';
  const mockTable: TableName = 'events';
  const mockCallback = mock(() => {});

  beforeEach(() => {
    mockCreateClient.mockClear();
    // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    (global as any).__subscriptionCallback = null;
  });

  afterEach(() => {
    mockCreateClient.mockClear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SubscriptionProvider authToken={mockToken} url={mockUrl}>
      {children}
    </SubscriptionProvider>
  );

  it('should initialize subscription correctly', async () => {
    const { result } = renderHook(
      () =>
        useSubscription({
          onInsert: mockCallback,
          table: mockTable,
        }),
      { wrapper },
    );

    expect(mockCreateClient).toHaveBeenCalledWith(mockToken, mockUrl);
    expect(result.current.status).toBe('connecting');
  });

  it('should handle connection and disconnection', async () => {
    const { result } = renderHook(
      () =>
        useSubscription({
          onInsert: mockCallback,
          table: mockTable,
        }),
      { wrapper },
    );

    // Simulate successful connection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
      (global as any).__subscriptionCallback('SUBSCRIBED');
    });

    expect(result.current.status).toBe('connected');

    // Simulate disconnection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
      (global as any).__subscriptionCallback('CLOSED');
    });

    expect(result.current.status).toBe('disconnected');
  });

  it('should attempt reconnection after disconnection', async () => {
    const { result } = renderHook(
      () =>
        useSubscription({
          onInsert: mockCallback,
          table: mockTable,
        }),
      { wrapper },
    );

    // Simulate successful connection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
      (global as any).__subscriptionCallback('SUBSCRIBED');
    });

    expect(result.current.status).toBe('connected');

    // Simulate disconnection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
      (global as any).__subscriptionCallback('CLOSED');
    });

    expect(result.current.status).toBe('disconnected');

    // Wait a bit for reconnection attempt
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(result.current.status).toBe('connecting');
  });

  it('should handle subscription errors', async () => {
    const errorCallback = mock(() => {});
    const { result } = renderHook(
      () =>
        useSubscription({
          onError: errorCallback,
          onInsert: mockCallback,
          table: mockTable,
        }),
      { wrapper },
    );

    // Simulate error
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
      (global as any).__subscriptionCallback(
        'CHANNEL_ERROR',
        new Error('Test error'),
      );
    });

    expect(result.current.status).toBe('error');
    expect(errorCallback).toHaveBeenCalled();
  });

  it('should cleanup subscriptions on unmount', async () => {
    const { unmount } = renderHook(
      () =>
        useSubscription({
          onInsert: mockCallback,
          table: mockTable,
        }),
      { wrapper },
    );

    // Initial connection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
      (global as any).__subscriptionCallback('SUBSCRIBED');
    });

    // Unmount component
    unmount();

    // Verify cleanup
    expect(mockCreateClient).toHaveBeenCalled();
    // biome-ignore lint/suspicious/noExplicitAny: we're mocking a function
    const client = (mockCreateClient as any).mock.results[0].value;
    expect(client.removeAllChannels).toHaveBeenCalled();
    expect(client.realtime.disconnect).toHaveBeenCalled();
  });

  it('should handle network status changes', async () => {
    const { result } = renderHook(
      () =>
        useSubscription({
          onInsert: mockCallback,
          table: mockTable,
        }),
      { wrapper },
    );

    // Simulate network going offline
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });

    // Simulate network coming back online
    await act(async () => {
      window.dispatchEvent(new Event('online'));
    });

    // Verify reconnection attempt
    expect(result.current.status).toBe('connecting');
  });
});
