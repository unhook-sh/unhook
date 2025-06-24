'use client';

import type {
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { REALTIME_POSTGRES_CHANGES_LISTEN_EVENT } from '@supabase/supabase-js';
import { debug } from '@unhook/logger';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createClient } from './client';
import { type NetworkStatus, useNetworkStore } from './network-store';
import type { TableName, Tables } from './types';

type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface SubscriptionCallbacks<T extends TableName> {
  onDelete?: (old: Tables<T>) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  onInsert?: (new_: Tables<T>) => void | Promise<void>;
  onStatusChange?: (
    status: SubscriptionStatus,
    error?: Error,
  ) => void | Promise<void>;
  onUpdate?: (new_: Tables<T>, old: Tables<T>) => void | Promise<void>;
}

type SubscriptionConfig<T extends `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`> =
  Partial<Omit<RealtimePostgresChangesFilter<T>, 'event'>> & {
    channelName?: string;
    timeout?: number;
  };

interface SubscriptionProps<T extends TableName>
  extends Partial<SubscriptionCallbacks<T>>,
    SubscriptionConfig<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`> {
  table: T;
  event?: `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`;
}

type SubscriptionInstance<T extends TableName> = {
  callbacks: Set<SubscriptionCallbacks<T>>;
  channel: RealtimeChannel;
  status: SubscriptionStatus;
};

interface SubscriptionContextValue {
  subscribe: <T extends TableName>(config: SubscriptionProps<T>) => void;
  unsubscribe: <T extends TableName>(
    callbacks: SubscriptionCallbacks<T>,
  ) => void;
  getStatus: () => SubscriptionStatus;
  isInitialized: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

const log = debug(':lib:subscription');

function determineEvents<T extends TableName>(
  props: SubscriptionProps<T>,
): `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}` {
  const events: `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`[] = [];
  if (props.onInsert)
    events.push(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT);
  if (props.onUpdate)
    events.push(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE);
  if (props.onDelete)
    events.push(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE);

  if (events.length === 0 || events.length === 3)
    return REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL;
  return events[0] ?? REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL;
}

async function handleSubscriptionEvent<T extends TableName>(
  payload: RealtimePostgresChangesPayload<Tables<T>>,
  callbacks: Set<SubscriptionCallbacks<T>>,
) {
  try {
    for (const callback of callbacks) {
      switch (payload.eventType) {
        case 'INSERT': {
          if (callback.onInsert) {
            await callback.onInsert(payload.new);
          }
          break;
        }
        case 'UPDATE': {
          if (callback.onUpdate) {
            await callback.onUpdate(payload.new, payload.old as Tables<T>);
          }
          break;
        }
        case 'DELETE': {
          if (callback.onDelete) {
            await callback.onDelete(payload.old as Tables<T>);
          }
          break;
        }
      }
    }
  } catch (error) {
    for (const callback of callbacks) {
      await callback.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}

interface SubscriptionProviderProps {
  children: ReactNode;
  authToken?: string;
  url?: string;
}

export function SubscriptionProvider({
  children,
  authToken,
  url,
}: SubscriptionProviderProps) {
  const subscriptionRef = useRef<SubscriptionInstance<TableName> | null>(null);
  const isUnmountingRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create a ref to store the current client instance
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null);
  const tokenRef = useRef<string>(authToken);
  const urlRef = useRef<string>(url);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    if (clientRef.current) {
      void clientRef.current.removeAllChannels();
      clientRef.current.realtime.disconnect();
    }
  }, []);

  // Create a new client when the token changes
  const createNewClient = useCallback(
    (props: { authToken?: string; url?: string }) => {
      const { authToken, url } = props;
      log('Creating new Supabase client');
      if (clientRef.current) {
        log('Removing existing channels');
        void clientRef.current.removeAllChannels();
        clientRef.current.realtime.disconnect();
      }

      try {
        const client = createClient({ authToken, url });
        clientRef.current = client;

        // Connect to realtime
        client.realtime.connect();

        // Set up reconnection timer
        reconnectIntervalRef.current = setInterval(() => {
          if (!client.realtime.isConnected()) {
            log('Realtime disconnected, attempting to reconnect...');
            client.realtime.connect();
          }
        }, 5000);

        // Wait for connection to be established
        const waitForConnection = () => {
          if (client.realtime.isConnected()) {
            log('Realtime connection established');
            setIsInitialized(true);
            return;
          }

          retryTimeoutRef.current = setTimeout(waitForConnection, 100);
        };

        waitForConnection();

        log('New Supabase client created');
        return client;
      } catch (error) {
        log('Error creating Supabase client:', error);
        throw error;
      }
    },
    [],
  );

  // Initialize or update client when token changes
  useEffect(() => {
    log('Token changed:', { authToken, previousToken: tokenRef.current });
    if (authToken !== tokenRef.current) {
      tokenRef.current = authToken;
      log('Creating new client with token');
      createNewClient({ authToken, url: urlRef.current });
    }
  }, [authToken, createNewClient]);

  // Initialize client on mount if we have a token
  useEffect(() => {
    if (authToken && !clientRef.current) {
      log('Initializing client on mount');
      createNewClient({ authToken, url: urlRef.current });
    }

    // Cleanup on unmount
    return () => {
      log('Provider unmounting, cleaning up');
      isUnmountingRef.current = true;
      cleanup();
    };
  }, [authToken, createNewClient, cleanup]);

  const handleStatusChange = useCallback(
    async (status: SubscriptionStatus, error?: Error) => {
      log('Subscription status changed:', {
        status,
        error,
        hasSubscription: !!subscriptionRef.current,
        previousStatus: subscriptionRef.current?.status,
        isUnmounting: isUnmountingRef.current,
      });

      // Don't update status if we're unmounting
      if (isUnmountingRef.current) {
        log('Ignoring status change during unmount');
        return;
      }

      const instance = subscriptionRef.current;
      if (instance) {
        instance.status = status;
        for (const callback of instance.callbacks) {
          await callback.onStatusChange?.(status, error);
        }
      } else {
        log('Warning: No subscription instance found when status changed');
      }
    },
    [],
  );

  const subscribe = useCallback(
    <T extends TableName>(config: SubscriptionProps<T>) => {
      log('Subscribing to:', { table: config.table });
      const existing =
        subscriptionRef.current as SubscriptionInstance<T> | null;
      if (existing) {
        log('Adding callback to existing subscription');
        existing.callbacks.add(config);
        return;
      }

      if (!clientRef.current) {
        log('Error: Supabase client not initialized');
        void handleStatusChange(
          'error',
          new Error('Supabase client not initialized'),
        );
        return;
      }

      if (!isInitialized) {
        log('Error: Supabase client not yet connected');
        void handleStatusChange(
          'error',
          new Error('Supabase client not yet connected'),
        );
        return;
      }

      try {
        const event = determineEvents(config);
        log('Creating channel for:', { table: config.table, event });
        const channel = clientRef.current
          .channel(config.channelName ?? `${String(config.table)}-changes`)
          .on<Tables<T>>(
            'postgres_changes',
            {
              event: event as '*',
              filter: config.filter ?? undefined,
              schema: 'public',
              table: String(config.table),
            },
            (payload) => {
              log('Received payload:', {
                table: config.table,
                type: payload.eventType,
              });
              const instance =
                subscriptionRef.current as SubscriptionInstance<T> | null;
              if (instance) {
                void handleSubscriptionEvent(payload, instance.callbacks);
              }
            },
          )
          .subscribe(
            (status: keyof typeof REALTIME_SUBSCRIBE_STATES, error?: Error) => {
              log('Channel status changed:', { status, error });
              let newStatus: SubscriptionStatus;
              switch (status) {
                case 'SUBSCRIBED':
                  newStatus = 'connected';
                  break;
                case 'CLOSED':
                  newStatus = 'disconnected';
                  break;
                case 'CHANNEL_ERROR':
                case 'TIMED_OUT':
                  newStatus = 'error';
                  break;
                default:
                  newStatus = 'disconnected';
              }
              void handleStatusChange(newStatus, error);
            },
            config.timeout,
          );

        log('Setting up new subscription instance');
        subscriptionRef.current = {
          callbacks: new Set([config]),
          channel,
          status: 'connecting',
        } as SubscriptionInstance<T>;

        // Set a connection timeout
        connectionTimeoutRef.current = setTimeout(() => {
          const instance = subscriptionRef.current;
          if (instance && instance.status === 'connecting') {
            log('Connection timeout reached, forcing status update');
            void handleStatusChange('connected');
          }
        }, 2000);
      } catch (error) {
        log('Error setting up subscription:', error);
        throw error;
      }
    },
    [handleStatusChange, isInitialized],
  );

  const unsubscribe = useCallback(
    <T extends TableName>(callbacks: SubscriptionCallbacks<T>) => {
      log('Unsubscribing');
      const instance =
        subscriptionRef.current as SubscriptionInstance<T> | null;
      if (!instance) return;

      instance.callbacks.delete(callbacks);

      if (instance.callbacks.size === 0) {
        log('Removing channel');
        // Add a small delay before removing the channel to prevent race conditions
        setTimeout(() => {
          if (
            subscriptionRef.current?.callbacks.size === 0 &&
            !isUnmountingRef.current
          ) {
            void clientRef.current?.removeChannel(instance.channel);
            subscriptionRef.current = null;
          }
        }, 100);
      }
    },
    [],
  );

  const getStatus = useCallback(() => {
    const status = subscriptionRef.current?.status ?? 'disconnected';
    log('Getting subscription status:', {
      status,
      hasSubscription: !!subscriptionRef.current,
      subscriptionStatus: subscriptionRef.current?.status,
      isUnmounting: isUnmountingRef.current,
    });
    return status;
  }, []);

  const value = useMemo(
    () => ({
      getStatus,
      subscribe,
      unsubscribe,
      isInitialized,
    }),
    [subscribe, unsubscribe, getStatus, isInitialized],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription<T extends TableName>(
  props: SubscriptionProps<T>,
): {
  status: SubscriptionStatus;
  unsubscribe: () => void;
  subscribe: () => void;
  networkStatus: NetworkStatus;
} {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider',
    );
  }

  const { subscribe, unsubscribe, getStatus, isInitialized } = context;
  const callbacksRef = useRef(props);
  const previousStatusRef = useRef<SubscriptionStatus>('disconnected');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const INITIAL_RETRY_DELAY = 1000; // 1 second

  const networkStatus = useNetworkStore.use.status();

  // Cleanup function for reconnection attempts
  const cleanupReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Handle reconnection logic
  const handleReconnect = useCallback(() => {
    log('Attempting to reconnect...');
    cleanupReconnect();

    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      log('Max reconnection attempts reached');
      return;
    }

    const delay = INITIAL_RETRY_DELAY * 2 ** reconnectAttemptsRef.current;
    reconnectTimeoutRef.current = setTimeout(() => {
      log(
        `Reconnecting attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS}`,
      );
      subscribe(callbacksRef.current);
      reconnectAttemptsRef.current += 1;
    }, delay);
  }, [subscribe, cleanupReconnect]);

  // Monitor network status changes
  useEffect(() => {
    if (networkStatus === 'online') {
      // Reset reconnection attempts when network comes back online
      reconnectAttemptsRef.current = 0;
      // Attempt to reconnect immediately if not already connected
      if (getStatus() !== 'connected') {
        handleReconnect();
      }
    }
  }, [networkStatus, getStatus, handleReconnect]);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = props;
  }, [props]);

  // Monitor status changes and handle reconnection
  useEffect(() => {
    const currentStatus = getStatus();
    const previousStatus = previousStatusRef.current;

    log('Status changed:', {
      previous: previousStatus,
      current: currentStatus,
    });

    if (previousStatus === 'connected' && currentStatus === 'disconnected') {
      log('Connection lost, initiating reconnection...');
      handleReconnect();
    } else if (currentStatus === 'connected') {
      log('Connection established, resetting reconnection attempts');
      reconnectAttemptsRef.current = 0;
      cleanupReconnect();
    }

    previousStatusRef.current = currentStatus;
  }, [getStatus, handleReconnect, cleanupReconnect]);

  // Subscribe when initialized
  useEffect(() => {
    if (!isInitialized) {
      log('Waiting for client initialization...');
      return;
    }

    log('Client initialized, attempting to subscribe');
    subscribe(callbacksRef.current);
    return () => {
      unsubscribe(callbacksRef.current);
      cleanupReconnect();
    };
  }, [subscribe, unsubscribe, isInitialized, cleanupReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupReconnect();
    };
  }, [cleanupReconnect]);

  return {
    status: getStatus(),
    unsubscribe: () => {
      unsubscribe(callbacksRef.current);
      cleanupReconnect();
    },
    subscribe: () => {
      subscribe(callbacksRef.current);
    },
    networkStatus,
  };
}
