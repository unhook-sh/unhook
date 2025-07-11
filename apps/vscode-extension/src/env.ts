import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  client: {
    // In production builds, this should always point to the production URL
    // The ConfigManager will override this for development scenarios
    NEXT_PUBLIC_API_URL: z.string().default('https://unhook.sh'),
    NEXT_PUBLIC_VSCODE_EXTENSION_ID: z.string().default('unhook.unhook-vscode'),
  },
  clientPrefix: '',
  runtimeEnv: process.env,
  skipValidation: !!process.env.CI,
});
