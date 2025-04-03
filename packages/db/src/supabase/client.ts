import { useSession } from '@clerk/nextjs';
import { createBrowserClient } from '@supabase/ssr';
import { useMemo } from 'react';
import { env } from '../env.client';
import type { Database } from './types';

export const useClient = () => {
  const { session } = useSession();

  return useMemo(
    () =>
      createBrowserClient<Database>(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          async accessToken() {
            return session?.getToken() ?? null;
          },
        },
      ),
    [session],
  );
};

export const createClient = (accessToken: string) => {
  if (!accessToken) {
    console.warn('No access token provided to createClient');
  }

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      async accessToken() {
        return accessToken;
      },
    },
  );
};
