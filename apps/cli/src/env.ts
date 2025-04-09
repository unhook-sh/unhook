import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: '',
  runtimeEnv: process.env,
  client: {
    NEXT_PUBLIC_API_URL: z.string().url(),
    POSTGRES_URL: z.string().url(),
    VERCEL: z.boolean().optional(),
  },

  skipValidation: !!process.env.CI,
});
