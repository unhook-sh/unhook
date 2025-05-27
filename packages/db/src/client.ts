import { sql } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres';
import { Pool } from 'pg';

import { env } from './env.server';
import * as schema from './schema';

const isProd = env.VERCEL_ENV === 'production';

export const db = isProd
  ? drizzleVercel(sql, { schema })
  : drizzle(
      new Pool({
        connectionString: env.POSTGRES_URL,
      }),
      { schema },
    );

export { sql };
