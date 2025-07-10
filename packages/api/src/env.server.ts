import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  /**
   * You can't destructure `process.env` as a regular object in Next.js, so we have to do
   * it manually here.
   */
  runtimeEnv: {
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    EMAIL_FROM: z.string().default('noreply@unhook.sh'),
    EMAIL_REPLY_TO: z.string().default('noreply@unhook.sh'),
    RESEND_API_KEY: z.string(),
  },

  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
});
