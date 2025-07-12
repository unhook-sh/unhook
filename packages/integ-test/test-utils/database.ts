import path from 'node:path';
import * as schema from '@unhook/db/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { StartedTestContainer } from 'testcontainers';
import { GenericContainer, Wait } from 'testcontainers';

export interface TestDatabase {
  db: PostgresJsDatabase<typeof schema>;
  connectionString: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  cleanup: () => Promise<void>;
}

let pgContainer: StartedTestContainer | null = null;
let supabaseContainer: StartedTestContainer | null = null;

export async function getTestDatabase(): Promise<TestDatabase> {
  // Use existing local database if in CI or development
  if (process.env.CI || process.env.USE_LOCAL_DB) {
    return getLocalDatabase();
  }

  // Otherwise, spin up test containers
  return getContainerDatabase();
}

async function getLocalDatabase(): Promise<TestDatabase> {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:54322/postgres';
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });

  // Run migrations
  const migrationsPath = path.join(__dirname, '../../db/drizzle');
  await migrate(db, { migrationsFolder: migrationsPath });

  return {
    cleanup: async () => {
      await sql.end();
    },
    connectionString,
    db,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    supabaseUrl,
  };
}

async function getContainerDatabase(): Promise<TestDatabase> {
  console.log('🐳 Starting PostgreSQL container...');

  // Start PostgreSQL container
  pgContainer = await new GenericContainer('postgres:15')
    .withEnvironment({
      POSTGRES_DB: 'test',
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_USER: 'postgres',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      Wait.forLogMessage('database system is ready to accept connections'),
    )
    .start();

  const pgPort = pgContainer.getMappedPort(5432);
  const connectionString = `postgresql://postgres:postgres@localhost:${pgPort}/test`;

  console.log('✅ PostgreSQL container started on port', pgPort);

  // For now, we'll use mock Supabase keys since we don't need the full Supabase stack for testing
  const supabaseUrl = 'http://localhost:54321';
  const supabaseAnonKey = 'test-anon-key';
  const supabaseServiceRoleKey = 'test-service-role-key';

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });

  // Run migrations
  const migrationsPath = path.join(__dirname, '../../db/drizzle');
  await migrate(db, { migrationsFolder: migrationsPath });

  console.log('✅ Database migrations completed');

  return {
    cleanup: async () => {
      await sql.end();
      if (pgContainer) {
        await pgContainer.stop();
        pgContainer = null;
      }
      if (supabaseContainer) {
        await supabaseContainer.stop();
        supabaseContainer = null;
      }
    },
    connectionString,
    db,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    supabaseUrl,
  };
}
