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

// Create the requesting_user_id function as per Clerk docs
const createRequestingUserIdFunction = async () => {
  console.log('Creating requesting_user_id function...');
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION requesting_user_id()
    RETURNS text
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = ''
    AS $$
      SELECT NULLIF(
        current_setting('request.jwt.claims', true)::json->>'sub',
        ''
      )::text;
    $$;
  `);
  console.log('requesting_user_id function created successfully');
};

// Create the requesting_org_id function for consistency
const createRequestingOrgIdFunction = async () => {
  console.log('Creating requesting_org_id function...');
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION requesting_org_id()
    RETURNS text
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = ''
    AS $$
      SELECT NULLIF(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        ''
      )::text;
    $$;
  `);
  console.log('requesting_org_id function created successfully');
};

// Common policy conditions using the requesting_user_id function
const policyConditions = {
  orgOwnership: (columnName = 'orgId') =>
    `(SELECT requesting_org_id()) = ("${columnName}")::text`,
  userOwnership: (columnName = 'userId') =>
    `(SELECT requesting_user_id()) = ("${columnName}")::text`,
  webhookOwnership: `EXISTS (
    SELECT 1 FROM webhooks
    WHERE webhooks.id = requests."webhookId"
    AND webhooks."orgId" = (SELECT requesting_org_id())
  )`,
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
      createUserOwnershipPolicy('ALL', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'apiKeys',
  },
  apiKeyUsage: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'apiKeyUsage',
  },
  authCodes: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'authCodes',
  },
  connections: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'connections',
  },
  events: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'events',
  },
  forwardingDestinations: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
      createUserOwnershipPolicy('DELETE', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'forwardingDestinations',
  },
  forwardingExecutions: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'forwardingExecutions',
  },
  forwardingRules: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
    ],
    tableName: 'forwardingRules',
  },
  orgMembers: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
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
      createUserOwnershipPolicy('ALL', 'userId'),
      createOrgOwnershipPolicy('ALL', 'orgId'),
      {
        name: 'Users can access requests for their webhooks',
        operation: 'SELECT',
        using: policyConditions.webhookOwnership,
      },
      {
        name: 'Users can delete requests for their webhooks',
        operation: 'DELETE',
        using: policyConditions.webhookOwnership,
      },
      {
        name: 'Users can update requests for their webhooks',
        operation: 'UPDATE',
        using: policyConditions.webhookOwnership,
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
      createUserOwnershipPolicy('ALL', 'userId'),
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
      // First create the requesting_user_id and requesting_org_id functions
      await createRequestingUserIdFunction();
      await createRequestingOrgIdFunction();

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

// _dropAllPolicies()
//   .then(() => {
//     console.log('Policy setup completed');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Policy setup failed:', error);
//     process.exit(1);
//   });
setupAllPolicies()
  .then(() => {
    console.log('Policy setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Policy setup failed:', error);
    process.exit(1);
  });
