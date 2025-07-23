import { createEnv } from '@t3-oss/env-core';
import { vercel } from '@t3-oss/env-nextjs/presets-zod';
import { z } from 'zod';

export const env = createEnv({
  extends: [vercel()],
  runtimeEnv: {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_URL: process.env.POSTGRES_URL,
  },
  server: {
    CLERK_SECRET_KEY: z.string(),
    POSTGRES_URL: z.string().url(),
  },
  skipValidation: !!process.env.CI,
});
