import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Check if this is a help command or development mode
const isHelpMode =
  process.argv.includes('--help') || process.argv.includes('-h');
const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEV === 'true';
const shouldSkipValidation = !!process.env.CI || isHelpMode || isDevelopment;

export const env = createEnv({
  clientPrefix: 'NEXT_PUBLIC_',
  runtimeEnv: {
    ...process.env,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_TYPE: process.env.NEXT_PUBLIC_APP_TYPE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CLI_VERSION: process.env.NEXT_PUBLIC_CLI_VERSION,
  },
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional().default(''),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional().default(''),
    NEXT_PUBLIC_POSTHOG_HOST: z
      .string()
      .optional()
      .default('https://app.posthog.com'),
    NEXT_PUBLIC_API_URL: z.string().optional().default('https://api.unhook.sh'),
    NEXT_PUBLIC_APP_ENV: z
      .enum(['development', 'production'])
      .default('development'),
    NEXT_PUBLIC_APP_TYPE: z.enum(['cli', 'nextjs']).default('cli'),
    NEXT_PUBLIC_SUPABASE_URL: z.string().optional().default(''),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(''),
    NEXT_PUBLIC_CLI_VERSION: z.string().optional().default(''),
  },

  skipValidation: shouldSkipValidation,
  onValidationError: (issues) => {
    const errorMessage = issues
      .map((issue) => {
        const path = issue.path ? issue.path.join('.') : 'unknown';
        return `${path}: ${issue.message}`;
      })
      .join(', ');

    console.error(
      'Environment validation failed. Some features may not work properly.',
      errorMessage,
    );

    // Don't throw in help/development mode, just warn and continue
    if (shouldSkipValidation) {
      console.warn(
        'Continuing with default values for development/help mode...',
      );
      // Return never to satisfy TypeScript but this won't actually be reached due to skipValidation
      return process.exit(0) as never;
    }

    throw new Error(`Invalid environment variables: ${errorMessage}`);
  },
});
