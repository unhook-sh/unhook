import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    RESEND_API_KEY: z.string().min(1),
    EMAIL_FROM: z.string().email().default('noreply@unhook.sh'),
    EMAIL_REPLY_TO: z.string().email().optional(),
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
  },
});
