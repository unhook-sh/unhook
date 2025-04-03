import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '../env.client';
import type { Database } from './types';

export const createClient = () =>
  createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
