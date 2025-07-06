# Unhook Integration Tests

This package contains comprehensive integration tests for the Unhook platform, testing the interaction between the web application, CLI, and VSCode extension.

## Overview

The integration tests cover:

- **Webhook lifecycle**: Creation, listing, updating, and deletion
- **Events and requests**: Processing, storage, filtering, and replay
- **CLI functionality**: Initialization, connection management, and webhook forwarding
- **WebSocket connections**: Real-time communication and reconnection handling
- **Database operations**: Data integrity and cascade operations
- **API endpoints**: REST API functionality and error handling

## Running Tests

### Prerequisites

1. **Local Development Setup**:
   ```bash
   # Start local Supabase instance
   cd packages/db
   bun run supabase:start
   
   # Run database migrations
   bun run db:migrate
   ```

2. **Install Dependencies**:
   ```bash
   # From the integ-test package directory
   cd packages/integ-test
   bun install
   ```

### Running Tests Locally

```bash
# Run all integration tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:ci

# Run specific test file
bun test src/webhooks.test.ts

# Run tests with UI
bun test:ui
```

### Environment Variables

The tests support the following environment variables:

- `USE_LOCAL_DB=true` - Use local Supabase instance instead of test containers
- `CI=true` - Run in CI mode with appropriate reporters
- `DATABASE_URL` - Override default database URL
- `SUPABASE_URL` - Override default Supabase URL
- `SUPABASE_ANON_KEY` - Override default Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Override default Supabase service role key

### Test Containers

By default, the tests use [Testcontainers](https://testcontainers.com/) to spin up PostgreSQL instances for isolated testing. This ensures tests don't interfere with your local development database.

To use your local database instead (faster but less isolated):

```bash
USE_LOCAL_DB=true bun test
```

## CI/CD Configuration

### GitHub Actions

Add this workflow to `.github/workflows/integration-tests.yml`:

```yaml
name: Integration Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Run database migrations
        run: bun run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
      
      - name: Run integration tests
        run: bun run test:ci
        working-directory: packages/integ-test
        env:
          CI: true
          USE_LOCAL_DB: true
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          SUPABASE_URL: http://localhost:54321
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          files: ./packages/integ-test/coverage/coverage-final.json
          flags: integration
```

### Turbo Integration

The package is integrated with Turborepo. Run tests as part of the monorepo:

```bash
# From root directory
turbo run test --filter=@unhook/integ-test
```

## Test Structure

### Setup and Teardown

- `src/setup.ts` - Global test setup including database and API server initialization
- `beforeAll` - Initializes test database and starts mock API server
- `beforeEach` - Cleans test data between tests
- `afterAll` - Cleans up resources

### Test Utilities

- `test-utils/database.ts` - Database connection and container management
- `test-utils/api-server.ts` - Mock API server for testing
- `test-utils/factories.ts` - Test data factories for creating entities
- `test-utils/cleanup.ts` - Database cleanup utilities

### Test Files

- `src/webhooks.test.ts` - Webhook CRUD operations and configuration
- `src/events-requests.test.ts` - Event processing and request handling
- `src/cli.test.ts` - CLI commands and webhook forwarding
- `src/connections.test.ts` - WebSocket connections and real-time features
- `src/forwarding.test.ts` - Webhook forwarding rules and execution

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, testApiServer } from './setup';
import { TestFactories } from '../test-utils/factories';

describe('Feature Name', () => {
  let factories: TestFactories;
  let testSetup: Awaited<ReturnType<TestFactories['createCompleteWebhookSetup']>>;
  
  beforeEach(async () => {
    factories = new TestFactories(testDb.db);
    testSetup = await factories.createCompleteWebhookSetup();
  });
  
  it('should do something', async () => {
    // Your test here
  });
});
```

### Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up resources (processes, connections, files)
3. **Factories**: Use test factories to create consistent test data
4. **Timeouts**: Use appropriate timeouts for async operations
5. **Assertions**: Make specific assertions about expected behavior
6. **Error Cases**: Test both success and failure scenarios

## Debugging

### Running Individual Tests

```bash
# Run with Node.js inspector
bun test:debug

# Run specific test with logging
DEBUG=* bun test src/webhooks.test.ts
```

### Common Issues

1. **Port Conflicts**: Ensure no services are running on test ports
2. **Database Connection**: Check DATABASE_URL is correct
3. **Timeouts**: Increase timeouts for slower CI environments
4. **File Permissions**: Ensure write access for temp directories

## Performance

The tests are configured to run sequentially to avoid database conflicts. For faster local development:

1. Use local database with `USE_LOCAL_DB=true`
2. Run specific test files instead of the full suite
3. Use `test.skip` to temporarily disable slow tests

## Contributing

When adding new integration tests:

1. Follow the existing test structure
2. Use test factories for data creation
3. Clean up all resources in `afterEach`/`afterAll`
4. Document any new environment variables
5. Update this README with new test descriptions