import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    // Email configuration
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().email().default('noreply@unhook.sh'),
    EMAIL_REPLY_TO: z.string().email().optional(),
    // App URL for generating links in emails
    APP_URL: z.string().url().default('https://unhook.sh'),
  },
  runtimeEnv: {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
    APP_URL: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL,
  },
});
