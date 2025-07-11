import { config } from 'dotenv';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { TestApiServer } from '../test-utils/api-server';
import { cleanupTestData } from '../test-utils/cleanup';
import { getTestDatabase } from '../test-utils/database';

// Load environment variables
config({ path: '../../.env.local' });

// Global test state
export let testDb: Awaited<ReturnType<typeof getTestDatabase>>;
export let testApiServer: TestApiServer;

// Setup before all tests
beforeAll(async () => {
  console.log('🚀 Starting integration test setup...');

  // Initialize test database
  testDb = await getTestDatabase();
  console.log('✅ Test database initialized');

  // Start test API server
  testApiServer = new TestApiServer();
  await testApiServer.start();
  console.log('✅ Test API server started on port', testApiServer.getPort());

  // Set global test environment variables
  process.env.NEXT_PUBLIC_API_URL = testApiServer.getUrl();
  process.env.DATABASE_URL = testDb.connectionString;
  process.env.POSTGRES_URL = testDb.connectionString;
  process.env.SUPABASE_URL = testDb.supabaseUrl;
  process.env.SUPABASE_ANON_KEY = testDb.supabaseAnonKey;
  process.env.SUPABASE_SERVICE_ROLE_KEY = testDb.supabaseServiceRoleKey;

  console.log('✅ Integration test setup complete');
});

// Cleanup after all tests
afterAll(async () => {
  console.log('🧹 Starting integration test cleanup...');

  // Stop API server
  if (testApiServer) {
    await testApiServer.stop();
    console.log('✅ Test API server stopped');
  }

  // Cleanup database
  if (testDb) {
    await testDb.cleanup();
    console.log('✅ Test database cleaned up');
  }

  console.log('✅ Integration test cleanup complete');
});

// Clean test data before each test
beforeEach(async () => {
  if (testDb) {
    await cleanupTestData(testDb.db);
  }
});
