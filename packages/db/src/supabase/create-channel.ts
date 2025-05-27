import type {
  REALTIME_SUBSCRIBE_STATES,
  RealtimeChannel,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from '@supabase/supabase-js';
import { REALTIME_POSTGRES_CHANGES_LISTEN_EVENT } from '@supabase/supabase-js';
import { debug } from '@unhook/logger';
import type { TableName, Tables } from './types';

const log = debug('unhook:lib:channel');

type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ChannelCallbacks<T extends TableName> {
  onDelete?: (old: Tables<T>) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  onInsert?: (new_: Tables<T>) => void | Promise<void>;
  onStatusChange?: (
    status: SubscriptionStatus,
    error?: Error,
  ) => void | Promise<void>;
  onUpdate?: (new_: Tables<T>, old: Tables<T>) => void | Promise<void>;
}

type ChannelConfig<T extends `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`> =
  Partial<Omit<RealtimePostgresChangesFilter<T>, 'event'>> & {
    channelName?: string;
    timeout?: number;
  };

interface ChannelProps<T extends TableName>
  extends Partial<ChannelCallbacks<T>>,
    ChannelConfig<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`> {
  table: T;
  event?: `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`;
}

function determineEvents<T extends TableName>(
  props: ChannelProps<T>,
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

async function handleChannelEvent<T extends TableName>(
  payload: RealtimePostgresChangesPayload<Tables<T>>,
  callbacks: ChannelCallbacks<T>,
) {
  try {
    switch (payload.eventType) {
      case 'INSERT': {
        if (callbacks.onInsert) {
          await callbacks.onInsert(payload.new);
        }
        break;
      }
      case 'UPDATE': {
        if (callbacks.onUpdate) {
          await callbacks.onUpdate(payload.new, payload.old as Tables<T>);
        }
        break;
      }
      case 'DELETE': {
        if (callbacks.onDelete) {
          await callbacks.onDelete(payload.old as Tables<T>);
        }
        break;
      }
    }
  } catch (error) {
    if (callbacks.onError) {
      await callbacks.onError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}

export function createChannel<T extends TableName>(
  client: SupabaseClient,
  props: ChannelProps<T>,
): RealtimeChannel {
  log('Creating channel for:', { table: props.table });

  const event = determineEvents(props);
  log('Determined events:', { event });

  const channel = client
    .channel(props.channelName ?? `${String(props.table)}-changes`)
    .on(
      'postgres_changes',
      {
        event: event as '*',
        filter: props.filter ?? undefined,
        schema: 'public',
        table: String(props.table),
      },
      (payload: RealtimePostgresChangesPayload<Tables<T>>) => {
        log('Received payload:', {
          table: props.table,
          type: payload.eventType,
        });
        void handleChannelEvent(payload, props);
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
        void props.onStatusChange?.(newStatus, error);
      },
      props.timeout,
    );

  log('Channel created:', {
    channelName: channel.topic,
    status: channel.state,
  });

  return channel;
}
