import * as schema from '@unhook/db/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export async function cleanupTestData(
  db: PostgresJsDatabase<typeof schema>,
): Promise<void> {
  // Delete all data in reverse order of dependencies
  await db.delete(schema.ForwardingExecutions);
  await db.delete(schema.ForwardingRules);
  await db.delete(schema.ForwardingDestinations);
  await db.delete(schema.AuthCodes);
  await db.delete(schema.WebhookAccessRequests);
  await db.delete(schema.Requests);
  await db.delete(schema.Events);
  await db.delete(schema.Connections);
  await db.delete(schema.Webhooks);
  await db.delete(schema.OrgMembers);
  await db.delete(schema.Orgs);
  await db.delete(schema.Users);
}
