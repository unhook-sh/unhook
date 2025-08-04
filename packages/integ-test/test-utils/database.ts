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

// Cache the database instance to avoid creating multiple containers
let cachedDatabase: TestDatabase | null = null;

export async function getTestDatabase(): Promise<TestDatabase> {
  // Return cached instance if available
  if (cachedDatabase) {
    return cachedDatabase;
  }

  // Use existing local database if in CI or development
  if (process.env.CI || process.env.USE_LOCAL_DB) {
    cachedDatabase = await getLocalDatabase();
    return cachedDatabase;
  }

  // Otherwise, spin up test containers
  cachedDatabase = await getContainerDatabase();
  return cachedDatabase;
}

async function getLocalDatabase(): Promise<TestDatabase> {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@127.0.0.1:44322/postgres';
  const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:44321';
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

  // Start PostgreSQL container with simpler wait strategy
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
    .withStartupTimeout(60000) // 60 seconds
    .start();

  const pgPort = pgContainer.getMappedPort(5432);
  const connectionString = `postgresql://postgres:postgres@localhost:${pgPort}/test`;

  console.log('✅ PostgreSQL container started on port', pgPort);

  // Wait a bit more to ensure the database is fully ready
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test connection before proceeding
  let sql: postgres.Sql | null = null;
  let retries = 10;
  while (retries > 0) {
    try {
      sql = postgres(connectionString, { connect_timeout: 10, max: 1 });
      await sql`SELECT 1`; // Test query
      console.log('✅ Database connection successful');
      break;
    } catch (error) {
      console.log(
        `Database connection failed, retrying... (${retries} attempts left)`,
      );
      retries--;
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (!sql) {
    throw new Error('Database connection failed');
  }

  const db = drizzle(sql, { schema });

  // Run migrations
  const migrationsPath = path.join(__dirname, '../../db/drizzle');
  try {
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

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
    supabaseAnonKey: 'test-anon-key',
    supabaseServiceRoleKey: 'test-service-role-key',
    supabaseUrl: 'http://localhost:54321',
  };
}
