import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { debug } from '@unhook/logger';
import { env } from '../env.client';
import type { Database } from './types';

const log = debug('unhook:lib:supabase:realtime-client');

export function createClient(props: {
  authToken: string;
  url?: string;
}) {
  const { authToken, url } = props;
  if (!authToken) {
    log('Warning: No access token provided to createRealtimeClient');
  }

  const supabaseUrl = url ?? env.NEXT_PUBLIC_SUPABASE_URL;

  log('Creating Supabase realtime client with config:', {
    url: supabaseUrl,
    hasToken: !!authToken,
  });

  const client = createSupabaseClient<Database>(
    supabaseUrl,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      accessToken: () => {
        return Promise.resolve(authToken);
      },
      // auth: {
      // persistSession: false,
      // autoRefreshToken: false,
      // },
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
