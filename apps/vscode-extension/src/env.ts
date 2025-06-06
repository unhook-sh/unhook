import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: '',
  client: {
    NEXT_PUBLIC_API_URL: z.string().default('http://localhost:3000'),
    NEXT_PUBLIC_VSCODE_EXTENSION_ID: z.string().default('unhook.unhook-vscode'),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.CI,
});
