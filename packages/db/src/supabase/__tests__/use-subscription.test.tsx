import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { createClient } from '../client';
import type { TableName } from '../types';
import { SubscriptionProvider, useSubscription } from '../use-subscription';

// Mock the Supabase client
vi.mock('../client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((callback: (status: string, error?: Error) => void) => {
        // Store the callback for later use in tests
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (global as any).__subscriptionCallback = callback;
        return {
          unsubscribe: vi.fn(),
        };
      }),
    })),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
    realtime: {
      connect: vi.fn(),
      disconnect: vi.fn(),
      isConnected: vi.fn().mockReturnValue(true),
    },
  })),
}));

describe('useSubscription', () => {
  const mockToken = 'test-token';
  const mockUrl = 'https://test.supabase.co';
  const mockTable: TableName = 'events';
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    (global as any).__subscriptionCallback = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
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
          table: mockTable,
          onInsert: mockCallback,
        }),
      { wrapper },
    );

    expect(createClient).toHaveBeenCalledWith(mockToken, mockUrl);
    expect(result.current.status).toBe('connecting');
  });

  it('should handle connection and disconnection', async () => {
    const { result } = renderHook(
      () =>
        useSubscription({
          table: mockTable,
          onInsert: mockCallback,
        }),
      { wrapper },
    );

    // Simulate successful connection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (global as any).__subscriptionCallback('SUBSCRIBED');
    });

    expect(result.current.status).toBe('connected');

    // Simulate disconnection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (global as any).__subscriptionCallback('CLOSED');
    });

    expect(result.current.status).toBe('disconnected');
  });

  it('should attempt reconnection after disconnection', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(
      () =>
        useSubscription({
          table: mockTable,
          onInsert: mockCallback,
        }),
      { wrapper },
    );

    // Initial connection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (global as any).__subscriptionCallback('SUBSCRIBED');
    });

    expect(result.current.status).toBe('connected');

    // Simulate disconnection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (global as any).__subscriptionCallback('CLOSED');
    });

    expect(result.current.status).toBe('disconnected');

    // Fast-forward time to trigger reconnection
    await act(async () => {
      vi.advanceTimersByTime(1000); // Initial retry delay
    });

    // Verify reconnection attempt
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('connecting');

    vi.useRealTimers();
  });

  it('should handle subscription errors', async () => {
    const errorCallback = vi.fn();
    const { result } = renderHook(
      () =>
        useSubscription({
          table: mockTable,
          onInsert: mockCallback,
          onError: errorCallback,
        }),
      { wrapper },
    );

    // Simulate error
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
          table: mockTable,
          onInsert: mockCallback,
        }),
      { wrapper },
    );

    // Initial connection
    await act(async () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      (global as any).__subscriptionCallback('SUBSCRIBED');
    });

    // Unmount component
    unmount();

    // Verify cleanup
    expect(createClient).toHaveBeenCalled();
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const client = (createClient as any).mock.results[0].value;
    expect(client.removeAllChannels).toHaveBeenCalled();
    expect(client.realtime.disconnect).toHaveBeenCalled();
  });

  it('should handle network status changes', async () => {
    const { result } = renderHook(
      () =>
        useSubscription({
          table: mockTable,
          onInsert: mockCallback,
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
