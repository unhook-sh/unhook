import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  runtimeEnv: {
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },
  server: {
    EMAIL_FROM: z.string().email().default('noreply@unhook.sh'),
    EMAIL_REPLY_TO: z.string().email().optional(),
    RESEND_API_KEY: z.string().min(1),
  },
});
