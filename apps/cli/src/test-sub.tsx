import {
  SubscriptionProvider,
  useSubscription,
} from '@unhook/db/supabase/client';
import { Box, Text } from 'ink';
import { type FC, useState } from 'react';

import type { Tables } from '@unhook/db';
import { env } from './env';

export const Test: FC = () => {
  const [updates, setUpdates] = useState<Tables<'requests'>[]>([]);

  const { status, isInitialized, networkStatus } = useSubscription({
    table: 'requests',
    onStatusChange(status) {
      console.log('status', status);
    },
    onUpdate(data) {
      console.log('data', data);
      setUpdates((prev) => [...prev, data]);
    },
  });

  if (!isInitialized) {
    return <Text>Initializing Supabase client...</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text>Network Status: {networkStatus}</Text>
      <Text>Subscription Status: {status}</Text>
      <Text>Listening for updates...</Text>
      {updates.map((update) => (
        <Text key={update.id}>{update.id}</Text>
      ))}
    </Box>
  );
};

export const Content = () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return <Text>Missing Supabase credentials</Text>;
  }

  return (
    <SubscriptionProvider token={key} url={url}>
      <Test />
    </SubscriptionProvider>
  );
};
