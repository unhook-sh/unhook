import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  /**
   * You can't destructure `process.env` as a regular object in Next.js, so we have to do
   * it manually here.
   */
  runtimeEnv: {
    STRIPE_METER_EVENT_NAME: process.env.STRIPE_METER_EVENT_NAME,
    STRIPE_PRICE_METER_LOOKUP_KEY: process.env.STRIPE_PRICE_METER_LOOKUP_KEY,
    STRIPE_PRICE_SUBSCRIPTION_LOOKUP_KEY:
      process.env.STRIPE_PRICE_SUBSCRIPTION_LOOKUP_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    STRIPE_METER_EVENT_NAME: z.string(),
    STRIPE_PRICE_METER_LOOKUP_KEY: z.string(),
    STRIPE_PRICE_SUBSCRIPTION_LOOKUP_KEY: z.string(),
    STRIPE_PUBLISHABLE_KEY: z.string(),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
  },

  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
});
