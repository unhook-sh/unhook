import { execSync } from 'child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as schema from '@unhook/db/src/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { GenericContainer, Wait } from 'testcontainers';
import type { StartedTestContainer } from 'testcontainers';

export interface TestDatabase {
  db: ReturnType<typeof drizzle>;
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
    db,
    connectionString,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
    cleanup: async () => {
      await sql.end();
    },
  };
}

async function getContainerDatabase(): Promise<TestDatabase> {
  console.log('🐳 Starting PostgreSQL container...');

  // Start PostgreSQL container
  pgContainer = await new GenericContainer('postgres:15')
    .withEnvironment({
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
      POSTGRES_DB: 'test',
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
    db,
    connectionString,
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
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
  };
}
