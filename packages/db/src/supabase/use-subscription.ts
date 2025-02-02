import type {
  REALTIME_SUBSCRIBE_STATES,
  RealtimePostgresChangesFilter,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'
import { REALTIME_POSTGRES_CHANGES_LISTEN_EVENT } from '@supabase/supabase-js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { createClient } from './client'
import type { TableName, Tables } from './types'

type SubscriptionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface SubscriptionCallbacks<T extends TableName> {
  onDelete?: (old: Tables[T]) => void | Promise<void>
  onError?: (error: Error) => void | Promise<void>
  onInsert?: (new_: Tables[T]) => void | Promise<void>
  onStatusChange?: (
    status: SubscriptionStatus,
    error?: Error,
  ) => void | Promise<void>
  onUpdate?: (new_: Tables[T], old: Tables[T]) => void | Promise<void>
}

type SubscriptionConfig<T extends `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`> =
  Partial<Omit<RealtimePostgresChangesFilter<T>, 'event'>> & {
    channelName?: string
    timeout?: number
  }

interface SubscriptionProps<T extends TableName>
  extends Partial<SubscriptionCallbacks<T>>,
    SubscriptionConfig<`${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`> {
  table: T
  event?: `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`
}

function determineEvents<T extends TableName>(
  props: SubscriptionProps<T>,
): `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}` {
  const events: `${REALTIME_POSTGRES_CHANGES_LISTEN_EVENT}`[] = []
  if (props.onInsert) events.push(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT)
  if (props.onUpdate) events.push(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.UPDATE)
  if (props.onDelete) events.push(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.DELETE)

  // If no specific callbacks are provided or if we have all three,
  // use "*" for efficiency
  if (events.length === 0 || events.length === 3)
    return REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL
  return events[0] ?? REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL
}

async function handleSubscriptionEvent<T extends TableName>(
  payload: RealtimePostgresChangesPayload<Tables[T]>,
  callbacks: SubscriptionCallbacks<T>,
) {
  try {
    switch (payload.eventType) {
      case 'INSERT': {
        if (callbacks.onInsert) {
          await callbacks.onInsert(payload.new)
        }
        break
      }
      case 'UPDATE': {
        if (callbacks.onUpdate) {
          await callbacks.onUpdate(payload.new, payload.old as Tables[T])
        }
        break
      }
      case 'DELETE': {
        if (callbacks.onDelete) {
          await callbacks.onDelete(payload.old as Tables[T])
        }
        break
      }
    }
  } catch (error) {
    await callbacks.onError?.(
      error instanceof Error ? error : new Error(String(error)),
    )
  }
}

export function useSubscription<T extends TableName>({
  table,
  onDelete,
  onError,
  onInsert,
  onStatusChange,
  onUpdate,
  event: configEvent,
  filter,
  channelName,
  timeout,
}: SubscriptionProps<T>) {
  const [status, setStatus] = useState<SubscriptionStatus>('disconnected')
  const stableCallbacks = useRef({
    onDelete,
    onError,
    onInsert,
    onStatusChange,
    onUpdate,
  })

  // Update the ref when callbacks change
  useEffect(() => {
    stableCallbacks.current = {
      onDelete,
      onError,
      onInsert,
      onStatusChange,
      onUpdate,
    }
  }, [onDelete, onError, onInsert, onStatusChange, onUpdate])

  const handleStatusChange = useCallback(
    async (newStatus: SubscriptionStatus, error?: Error) => {
      setStatus(newStatus)
      await stableCallbacks.current.onStatusChange?.(newStatus, error)
    },
    [], // No dependencies needed since we use ref
  )

  // Determine which events to listen for based on callbacks
  const event = useMemo(() => {
    if (configEvent) return configEvent
    return determineEvents({
      onDelete,
      onInsert,
      onUpdate,
      table,
    })
  }, [configEvent, table, onDelete, onInsert, onUpdate])

  // Memoize the channel name to prevent unnecessary reconnections
  const channelNameMemo = useMemo(
    () => channelName ?? `${String(table)}-changes`,
    [channelName, table],
  )

  useEffect(() => {
    void handleStatusChange('connecting')

    const supabase = createClient()
    const channel = supabase
      .channel(channelNameMemo)
      .on<Tables[T]>(
        'postgres_changes',
        {
          event: event as '*', // HACK: Type hack to get around that this doesn't accept a union type of events which event is because we are dynamically determining it at runtime. This does not mean that we are listening to all events.
          filter: filter ?? undefined,
          schema: 'public',
          table: String(table),
        },
        (payload: RealtimePostgresChangesPayload<Tables[T]>) => {
          void handleSubscriptionEvent(payload, stableCallbacks.current)
        },
      )
      .subscribe(
        (status: keyof typeof REALTIME_SUBSCRIBE_STATES, error?: Error) => {
          switch (status) {
            case 'SUBSCRIBED': {
              void handleStatusChange('connected')
              break
            }
            case 'CLOSED': {
              void handleStatusChange('disconnected')
              break
            }
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT': {
              void handleStatusChange('error', error)
              break
            }
            // No default
          }
        },
        timeout,
      )

    return () => {
      void supabase.removeChannel(channel)
      void handleStatusChange('disconnected')
    }
  }, [table, filter, timeout, handleStatusChange, channelNameMemo, event])

  return {
    status,
  }
}
