import type { Config } from 'drizzle-kit';

import { env } from './src/env.server';

const nonPoolingUrl = env.POSTGRES_URL.replace(':6543', ':5432');

export default {
  dbCredentials: { url: nonPoolingUrl },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/schema.ts',
} satisfies Config;
