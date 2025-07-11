'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

import { useClient } from '../client';
import { usePresenceStore } from './store-provider';

export function Presence(props: { id: string }) {
  const setOnlineUsers = usePresenceStore((store) => store.setOnlineUsers);
  const { user } = useUser();

  const supabase = useClient();

  useEffect(() => {
    if (!user || !props.id) return;

    const readingChannel = supabase
      .channel(`presence:${props.id}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const onlineUsers = new Set(
          Object.keys(readingChannel.presenceState()),
        );

        setOnlineUsers(onlineUsers);
      })
      .subscribe((status) => {
        if (
          status === 'SUBSCRIBED' &&
          !readingChannel.presenceState()[user.id]
        ) {
          void readingChannel.track({
            onlineAt: new Date().toISOString(),
            userId: user.id,
          });
        }
      });

    return () => {
      void supabase.removeChannel(readingChannel);
    };
  }, [user, props.id, setOnlineUsers, supabase]);
  return null;
}
