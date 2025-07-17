import { sql } from 'drizzle-orm';
import { db } from '../src/client';

type PolicyOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';

interface Policy {
  name: string;
  operation: PolicyOperation;
  using?: string;
  withCheck?: string;
}

interface PolicyConfig {
  tableName: string;
  policies: Policy[];
}

// Common policy conditions
const policyConditions = {
  eventOwnership: `EXISTS (
    SELECT 1 FROM events
    WHERE events.id = requests."eventId"
    AND events."userId" = (SELECT auth.jwt()->>'sub')
  )`,
  orgOwnership: (columnName = 'orgId') =>
    `(SELECT auth.jwt()->>'org_id') = ("${columnName}")::text`,
  userOwnership: (columnName = 'userId') =>
    `(SELECT auth.jwt()->>'sub') = ("${columnName}")::text`,
} as const;

// Helper to create a policy for user ownership
const createUserOwnershipPolicy = (
  operation: PolicyOperation,
  columnName: string,
): Policy => ({
  name: `User can ${operation.toLowerCase()} their own records`,
  operation,
  using:
    operation === 'INSERT'
      ? undefined
      : policyConditions.userOwnership(columnName),
  withCheck:
    operation === 'INSERT'
      ? policyConditions.userOwnership(columnName)
      : undefined,
});

// Helper to create a policy for org ownership
const createOrgOwnershipPolicy = (
  operation: PolicyOperation,
  columnName: string,
): Policy => ({
  name: `Users can ${operation.toLowerCase()} their organization's records`,
  operation,
  using: policyConditions.orgOwnership(columnName),
});

const createPolicy = async (tableName: string, policy: Policy) => {
  const { name, operation, using, withCheck } = policy;

  // First drop the policy if it exists
  await db.execute(sql`
    DROP POLICY IF EXISTS ${sql.raw(`"${name}"`)} ON "public"."${sql.raw(tableName)}";
  `);

  // Then create the new policy
  const policySql = sql`
    CREATE POLICY ${sql.raw(`"${name}"`)}
    ON "public"."${sql.raw(tableName)}"
    ${operation === 'ALL' ? sql`FOR ALL` : sql`FOR ${sql.raw(operation)}`}
    TO authenticated
    ${using ? sql`USING (${sql.raw(using)})` : sql``}
    ${withCheck ? sql`WITH CHECK (${sql.raw(withCheck)})` : sql``}
  `;

  await db.execute(policySql);
};

const dropPolicy = async (tableName: string, policyName: string) => {
  await db.execute(sql`
    DROP POLICY IF EXISTS ${sql.raw(`"${policyName}"`)} ON "public"."${sql.raw(tableName)}";
  `);
};

const enableRLS = async (tableName: string) => {
  console.log(`Enabling RLS for table: ${tableName}`);
  await db.execute(sql`
    ALTER TABLE "public"."${sql.raw(tableName)}" ENABLE ROW LEVEL SECURITY;
  `);
  console.log(`RLS enabled for table: ${tableName}`);
};

const policyConfigs: Record<string, PolicyConfig> = {
  apiKeys: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createUserOwnershipPolicy('UPDATE', 'userId'),
      createUserOwnershipPolicy('DELETE', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'apiKeys',
  },
  authCodes: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createUserOwnershipPolicy('UPDATE', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'authCodes',
  },
  connections: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createUserOwnershipPolicy('UPDATE', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'connections',
  },
  events: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'events',
  },
  forwardingDestinations: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createUserOwnershipPolicy('UPDATE', 'userId'),
      createUserOwnershipPolicy('DELETE', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'forwardingDestinations',
  },
  forwardingExecutions: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'forwardingExecutions',
  },
  forwardingRules: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createUserOwnershipPolicy('UPDATE', 'userId'),
      createUserOwnershipPolicy('DELETE', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'forwardingRules',
  },
  orgMembers: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createUserOwnershipPolicy('UPDATE', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'orgMembers',
  },
  orgs: {
    policies: [
      // Users can access orgs they created
      {
        name: 'Users can select orgs they created',
        operation: 'SELECT',
        using: policyConditions.userOwnership('createdByUserId'),
      },
      {
        name: 'Users can insert orgs',
        operation: 'INSERT',
        withCheck: policyConditions.userOwnership('createdByUserId'),
      },
      {
        name: 'Users can update orgs they created',
        operation: 'UPDATE',
        using: policyConditions.userOwnership('createdByUserId'),
        withCheck: policyConditions.userOwnership('createdByUserId'),
      },
    ],
    tableName: 'orgs',
  },
  requests: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
      {
        name: 'Users can access requests for their events',
        operation: 'SELECT',
        using: policyConditions.eventOwnership,
      },
    ],
    tableName: 'requests',
  },
  user: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'id'),
      createUserOwnershipPolicy('UPDATE', 'id'),
    ],
    tableName: 'user',
  },
  webhookAccessRequests: {
    policies: [
      // Users can access requests they made (as requester)
      {
        name: 'Users can select their own access requests',
        operation: 'SELECT',
        using: policyConditions.userOwnership('requesterId'),
      },
      {
        name: 'Users can insert their own access requests',
        operation: 'INSERT',
        withCheck: policyConditions.userOwnership('requesterId'),
      },
      {
        name: 'Users can update their own access requests',
        operation: 'UPDATE',
        using: policyConditions.userOwnership('requesterId'),
        withCheck: policyConditions.userOwnership('requesterId'),
      },
      // Users can respond to requests (as responder)
      {
        name: 'Users can update requests they are responding to',
        operation: 'UPDATE',
        using: policyConditions.userOwnership('responderId'),
        withCheck: policyConditions.userOwnership('responderId'),
      },
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'webhookAccessRequests',
  },
  webhooks: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'userId'),
      createUserOwnershipPolicy('INSERT', 'userId'),
      createUserOwnershipPolicy('UPDATE', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'webhooks',
  },
};

async function withErrorHandling<T>(
  operation: () => Promise<T>,
  successMessage: string,
  errorMessage: string,
): Promise<T> {
  try {
    const result = await operation();
    console.log(successMessage);
    return result;
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
}

async function setupTablePolicies(config: PolicyConfig) {
  return withErrorHandling(
    async () => {
      await enableRLS(config.tableName);
      await Promise.all(
        config.policies.map((policy) => createPolicy(config.tableName, policy)),
      );
    },
    `Policies for ${config.tableName} set up successfully`,
    `Error setting up policies for ${config.tableName}`,
  );
}

async function dropTablePolicies(config: PolicyConfig) {
  return withErrorHandling(
    async () => {
      await Promise.all(
        config.policies.map((policy) =>
          dropPolicy(config.tableName, policy.name),
        ),
      );
    },
    `Policies for ${config.tableName} dropped successfully`,
    `Error dropping policies for ${config.tableName}`,
  );
}

async function setupAllPolicies() {
  return withErrorHandling(
    async () => {
      // Process tables sequentially to avoid deadlocks
      for (const config of Object.values(policyConfigs)) {
        await setupTablePolicies(config);
      }
    },
    'All policies have been set up successfully',
    'Error setting up policies',
  );
}

async function _dropAllPolicies() {
  return withErrorHandling(
    async () => {
      await Promise.all(Object.values(policyConfigs).map(dropTablePolicies));
    },
    'All policies have been dropped successfully',
    'Error dropping policies',
  );
}

setupAllPolicies()
  .then(() => {
    console.log('Policy setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Policy setup failed:', error);
    process.exit(1);
  });
