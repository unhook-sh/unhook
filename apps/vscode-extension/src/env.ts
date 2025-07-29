import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: z.string(),
    NEXT_PUBLIC_APP_ENV: z.string(),
    NEXT_PUBLIC_APP_URL: z.string(),
    NEXT_PUBLIC_IS_SELF_HOSTED: z.string(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_VSCODE_EXTENSION_ID: z.string().default('unhook.unhook-vscode'),
  },
  clientPrefix: '',
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_IS_SELF_HOSTED: process.env.NEXT_PUBLIC_IS_SELF_HOSTED,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_VSCODE_EXTENSION_ID:
      process.env.NEXT_PUBLIC_VSCODE_EXTENSION_ID,
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: !!process.env.CI,
});
