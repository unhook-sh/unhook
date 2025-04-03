import { createBrowserClient } from '@supabase/ssr';

import { useSession } from '@clerk/nextjs';
import { env } from '../env.client';
import type { Database } from './types';

export const useClient = () => {
  const { session } = useSession();

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      async accessToken() {
        return session?.getToken() ?? null;
      },
    },
  );
};
