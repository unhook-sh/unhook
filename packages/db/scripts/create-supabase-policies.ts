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
  orgOwnership: '(SELECT auth.jwt()->>\'org_id\') = ("orgId")::text',
  orgOwnershipById: '(SELECT auth.jwt()->>\'org_id\') = ("id")::text',
  userOwnership: '(SELECT auth.jwt()->>\'sub\') = ("userId")::text',
  userOwnershipById: '(SELECT auth.jwt()->>\'sub\') = ("id")::text',
} as const;

// Helper to create a policy for user ownership
const createUserOwnershipPolicy = (
  operation: PolicyOperation,
  useId = false,
): Policy => ({
  name: `User can ${operation.toLowerCase()} their own records`,
  operation,
  using:
    operation === 'INSERT'
      ? undefined
      : useId
        ? policyConditions.userOwnershipById
        : policyConditions.userOwnership,
  withCheck:
    operation === 'INSERT'
      ? useId
        ? policyConditions.userOwnershipById
        : policyConditions.userOwnership
      : undefined,
});

const createOrgOwnershipByIdPolicy = (operation: PolicyOperation): Policy => ({
  name: `Users can ${operation.toLowerCase()} their orgs`,
  operation,
  using: operation === 'INSERT' ? undefined : policyConditions.orgOwnershipById,
  withCheck:
    operation === 'INSERT' ? policyConditions.orgOwnershipById : undefined,
});

// Helper to create a policy for org ownership
const createOrgOwnershipPolicy = (operation: PolicyOperation): Policy => ({
  name: `Users can ${operation.toLowerCase()} their organization's records`,
  operation,
  using: policyConditions.orgOwnership,
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
  authCodes: {
    policies: [
      createUserOwnershipPolicy('SELECT'),
      createUserOwnershipPolicy('INSERT'),
      createUserOwnershipPolicy('UPDATE'),
      createOrgOwnershipPolicy('ALL'),
    ],
    tableName: 'authCodes',
  },
  connections: {
    policies: [
      createUserOwnershipPolicy('SELECT'),
      createUserOwnershipPolicy('INSERT'),
      createUserOwnershipPolicy('UPDATE'),
      createOrgOwnershipPolicy('ALL'),
    ],
    tableName: 'connections',
  },
  events: {
    policies: [
      createUserOwnershipPolicy('SELECT'),
      createUserOwnershipPolicy('INSERT'),
      createOrgOwnershipPolicy('ALL'),
    ],
    tableName: 'events',
  },
  orgMembers: {
    policies: [
      createUserOwnershipPolicy('SELECT'),
      createUserOwnershipPolicy('INSERT'),
      createUserOwnershipPolicy('UPDATE'),
      createOrgOwnershipPolicy('ALL'),
    ],
    tableName: 'orgMembers',
  },
  orgs: {
    policies: [
      createOrgOwnershipByIdPolicy('SELECT'),
      createOrgOwnershipByIdPolicy('INSERT'),
      createOrgOwnershipByIdPolicy('UPDATE'),
    ],
    tableName: 'orgs',
  },
  requests: {
    policies: [
      createUserOwnershipPolicy('SELECT'),
      createUserOwnershipPolicy('INSERT'),
      createOrgOwnershipPolicy('ALL'),
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
      createUserOwnershipPolicy('SELECT', true),
      createUserOwnershipPolicy('UPDATE', true),
    ],
    tableName: 'user',
  },
  webhooks: {
    policies: [
      createUserOwnershipPolicy('SELECT'),
      createUserOwnershipPolicy('INSERT'),
      createUserOwnershipPolicy('UPDATE'),
      createOrgOwnershipPolicy('ALL'),
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
