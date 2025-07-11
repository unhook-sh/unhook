import { useSession } from '@clerk/nextjs';
import { createBrowserClient } from '@supabase/ssr';
import { debug } from '@unhook/logger';
import { useEffect, useMemo } from 'react';
import { env } from '../env.client';
import type { Database } from './types';

const log = debug('unhook:lib:supabase:client');

export const useClient = () => {
  const { session } = useSession();

  const client = useMemo(
    () =>
      createBrowserClient<Database>(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          async accessToken() {
            return session?.getToken() ?? null;
          },
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
          },
        },
      ),
    [session],
  );

  useEffect(() => {
    log('Connecting to realtime...');
    client.realtime.connect();

    return () => {
      log('Disconnecting from realtime...');
      client.realtime.disconnect();
    };
  }, [client]);

  return client;
};

export function createClient(props: { authToken?: string; url?: string }) {
  const { authToken, url } = props;
  if (!authToken) {
    log('Warning: No access token provided to createClient');
  }

  const supabaseUrl = url ?? env.NEXT_PUBLIC_SUPABASE_URL;

  log('Creating Supabase client with config:', {
    hasToken: !!authToken,
    url: supabaseUrl,
  });

  const client = createBrowserClient<Database>(
    supabaseUrl,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      async accessToken() {
        return authToken ?? null;
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    },
  );

  log('Connecting to realtime...');
  client.realtime.connect();

  return client;
}
