'use client';
import type { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useClient } from './client';

type BroadcastStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface BroadcastMessage {
  event: string;
  topic: string;
  payload: unknown;
}

interface BroadcastCallbacks<T extends BroadcastMessage> {
  onMessage?: (message: T['payload']) => void | Promise<void>;
  onStatusChange?: (
    status: BroadcastStatus,
    error?: Error,
  ) => void | Promise<void>;
}

interface BroadcastConfig {
  channelName?: string;
  topic: string;
  event: string;
  self?: boolean;
  ack?: boolean;
  timeout?: number;
}

interface BroadcastProps<T extends BroadcastMessage>
  extends BroadcastConfig,
    BroadcastCallbacks<T> {
  topic: T['topic'];
  event: T['event'];
}

export function useBroadcast<T extends BroadcastMessage>({
  topic,
  event,
  onMessage,
  onStatusChange,
  channelName,
  self = false,
  ack = false,
  timeout,
}: BroadcastProps<T>): {
  send: (message: T['payload']) => Promise<boolean>;
  status: BroadcastStatus;
} {
  const [status, setStatus] = useState<BroadcastStatus>('disconnected');
  const stableCallbacks = useRef({ onMessage, onStatusChange });

  // Update the ref when callbacks change
  useEffect(() => {
    stableCallbacks.current = { onMessage, onStatusChange };
  }, [onMessage, onStatusChange]);

  const handleStatusChange = useCallback(
    async (newStatus: BroadcastStatus, error?: Error) => {
      setStatus(newStatus);
      await stableCallbacks.current.onStatusChange?.(newStatus, error);
    },
    [], // No dependencies needed since we use ref
  );

  // Memoize the channel name to prevent unnecessary reconnections
  const channelNameMemo = useMemo(
    () => channelName ?? `broadcast-${topic}`,
    [channelName, topic],
  );

  const supabase = useClient();

  useEffect(() => {
    void handleStatusChange('connecting');

    const channel = supabase.channel(channelNameMemo, {
      config: {
        broadcast: {
          ack,
          self,
        },
      },
    });

    channel
      .on('broadcast', { event }, (payload: { payload: T['payload'] }) => {
        void stableCallbacks.current.onMessage?.(payload.payload);
      })
      .subscribe(
        (status: keyof typeof REALTIME_SUBSCRIBE_STATES, error?: Error) => {
          switch (status) {
            case 'SUBSCRIBED': {
              void handleStatusChange('connected');
              break;
            }
            case 'CLOSED': {
              void handleStatusChange('disconnected');
              break;
            }
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT': {
              void handleStatusChange('error', error);
              break;
            }
          }
        },
        timeout,
      );

    return () => {
      void supabase.removeChannel(channel);
      void handleStatusChange('disconnected');
    };
  }, [
    event,
    self,
    ack,
    handleStatusChange,
    channelNameMemo,
    timeout,
    supabase,
  ]);

  const send = useCallback(
    async (message: T['payload']) => {
      const channel = supabase.channel(channelNameMemo);

      try {
        await channel.send({
          event,
          payload: message,
          type: 'broadcast',
        });

        return true;
      } catch (error) {
        console.error('Error sending broadcast message:', error);
        return false;
      } finally {
        void supabase.removeChannel(channel);
      }
    },
    [channelNameMemo, event, supabase],
  );

  return {
    send,
    status,
  };
}
