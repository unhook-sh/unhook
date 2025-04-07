import type { Config } from 'drizzle-kit';

import { env } from './src/env.server';

const nonPoolingUrl = env.POSTGRES_URL.replace(':6543', ':5432');

export default {
  schema: './src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: { url: nonPoolingUrl },
} satisfies Config;
