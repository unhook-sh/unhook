import { createEnv } from '@t3-oss/env-core';
import { vercel } from '@t3-oss/env-nextjs/presets-zod';
import { z } from 'zod';

export const env = createEnv({
  extends: [vercel()],
  runtimeEnv: process.env,
  server: {
    CLERK_SECRET_KEY: z.string(),
    POSTGRES_URL: z.string().url(),
  },
  skipValidation: !!process.env.CI,
});
