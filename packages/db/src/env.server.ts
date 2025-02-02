import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  runtimeEnv: process.env,
  server: {
    POSTGRES_URL: z.string().url(),
    VERCEL: z.boolean().optional(),
  },
  skipValidation: !!process.env.CI,
})
