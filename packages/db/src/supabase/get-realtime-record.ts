import { sql } from 'drizzle-orm';
import { db } from '../client';

// Type definitions for the realtime subscription table
export interface RealtimeSubscription {
  id: number;
  subscription_id: string;
  entity: string;
  filters: string;
  claims: Record<string, unknown>;
  claims_role: string;
  created_at: Date;
  [key: string]: unknown;
}

export interface SubscriptionClaimsRoleCheck {
  subscription_id: string;
  claims_role: string;
  is_anon_or_authenticated: boolean;
}

/**
 * Get all realtime subscriptions using raw SQL
 */
export async function getAllRealtimeSubscriptions() {
  const result = await db.execute(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    ORDER BY created_at DESC
  `);

  return result;
}

/**
 * Get realtime subscription by ID using raw SQL
 */
export async function getRealtimeSubscriptionById(id: number) {
  const result = await db.execute(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    WHERE id = ${id}
    LIMIT 1
  `);

  return Array.isArray(result) && result.length > 0 ? result[0] : null;
}

/**
 * Get realtime subscriptions by subscription ID using raw SQL
 */
export async function getRealtimeSubscriptionsBySubscriptionId(
  subscriptionId: string,
) {
  const result = await db.execute(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    WHERE subscription_id = ${subscriptionId}
    ORDER BY created_at DESC
  `);

  return result;
}

/**
 * Get realtime subscriptions by entity using raw SQL
 */
export async function getRealtimeSubscriptionsByEntity(entity: string) {
  const result = await db.execute(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    WHERE entity = ${entity}
    ORDER BY created_at DESC
  `);

  return result;
}

/**
 * Get realtime subscriptions by claims role using raw SQL
 */
export async function getRealtimeSubscriptionsByClaimsRole(claimsRole: string) {
  const result = await db.execute(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    WHERE claims_role::text = ${claimsRole}
    ORDER BY created_at DESC
  `);

  return result;
}

/**
 * Get realtime subscriptions created after a specific date using raw SQL
 */
export async function getRealtimeSubscriptionsAfterDate(date: Date) {
  const result = await db.execute(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    WHERE created_at > ${date}
    ORDER BY created_at DESC
  `);

  return result;
}

/**
 * Get realtime subscription statistics using raw SQL
 */
export async function getRealtimeSubscriptionStats() {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) as total_subscriptions,
      COUNT(DISTINCT entity) as unique_entities,
      COUNT(DISTINCT subscription_id) as unique_subscription_ids,
      MAX(created_at) as latest_subscription
    FROM realtime.subscription
  `);

  return Array.isArray(result) && result.length > 0 ? result[0] : null;
}

/**
 * Get realtime subscriptions grouped by entity using raw SQL
 */
export async function getRealtimeSubscriptionsGroupedByEntity() {
  const result = await db.execute(sql`
    SELECT
      entity,
      COUNT(*) as count,
      MAX(created_at) as latest_created
    FROM realtime.subscription
    GROUP BY entity
    ORDER BY count DESC
  `);

  return result;
}

/**
 * Raw SQL query to access the realtime schema directly
 * This bypasses Drizzle schema and queries the actual Supabase realtime table
 */
export async function queryRealtimeSchemaRaw() {
  // Query the realtime subscription table directly using raw SQL
  const result = await db.execute(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    ORDER BY created_at DESC
    LIMIT 100
  `);

  return result;
}

/**
 * Raw SQL query to get subscription count by entity
 */
export async function getSubscriptionCountByEntityRaw() {
  const result = await db.execute(sql`
    SELECT
      entity,
      COUNT(*) as subscription_count,
      MAX(created_at) as latest_subscription
    FROM realtime.subscription
    GROUP BY entity
    ORDER BY subscription_count DESC
  `);

  return result;
}

/**
 * Raw SQL query to find subscriptions with specific claims
 */
export async function findSubscriptionsByClaimsRaw(
  claimsKey: string,
  claimsValue: string,
) {
  const result = await db.execute(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    WHERE claims->>${claimsKey} = ${claimsValue}
    ORDER BY created_at DESC
  `);

  return result;
}

/**
 * Raw SQL query to get active subscriptions (created in last 24 hours)
 */
export async function getActiveSubscriptionsRaw() {
  const result = await db.execute(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    WHERE created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
  `);

  return result;
}

/**
 * Raw SQL query to get subscription details with entity information
 */
export async function getSubscriptionDetailsWithEntityRaw(
  subscriptionId: string,
) {
  const result = await db.execute(sql`
    SELECT
      s.id,
      s.subscription_id,
      s.entity,
      s.filters,
      s.claims,
      s.claims_role,
      s.created_at,
      pg_class.relname as table_name,
      pg_namespace.nspname as schema_name
    FROM realtime.subscription s
    LEFT JOIN pg_class ON s.entity = pg_class.oid
    LEFT JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE s.subscription_id = ${subscriptionId}
  `);

  return result;
}

/**
 * Check if subscription has claims role 'anon' or 'authenticated'
 */
export async function checkSubscriptionClaimsRole(subscriptionId: string) {
  const result = await db.execute(sql`
    SELECT
      subscription_id,
      claims_role,
      CASE
        WHEN claims_role::text = 'anon' THEN true
        WHEN claims_role::text = 'authenticated' THEN true
        ELSE false
      END as is_anon_or_authenticated
    FROM realtime.subscription
    WHERE subscription_id = ${subscriptionId}
  `);

  return Array.isArray(result) && result.length > 0 ? result[0] : null;
}

/**
 * Count subscriptions by claims role (anon vs authenticated)
 */
export async function countSubscriptionsByClaimsRole() {
  const result = await db.execute(sql`
    SELECT
      claims_role::text as role,
      COUNT(*) as count
    FROM realtime.subscription
    WHERE claims_role::text IN ('anon', 'authenticated')
    GROUP BY claims_role::text
    ORDER BY count DESC
  `);

  return result;
}

/**
 * Check if a specific entity has subscriptions with anon or authenticated roles
 */
export async function checkEntitySubscriptionRoles(entity: string) {
  const result = await db.execute(sql`
    SELECT
      entity,
      claims_role::text as role,
      COUNT(*) as subscription_count
    FROM realtime.subscription
    WHERE entity = ${entity}
      AND claims_role::text IN ('anon', 'authenticated')
    GROUP BY entity, claims_role::text
    ORDER BY subscription_count DESC
  `);

  return result;
}

/**
 * Get realtime subscriptions filtered by webhook ID in the filters column
 */
export async function getRealtimeSubscriptionsByWebhookId(
  webhookId: string,
): Promise<RealtimeSubscription[]> {
  const result = await db.execute<RealtimeSubscription>(sql`
    SELECT
      id,
      subscription_id,
      entity,
      filters,
      claims,
      claims_role,
      created_at
    FROM realtime.subscription
    WHERE filters::text LIKE ${`%${webhookId}%`}
    ORDER BY created_at DESC
  `);

  return result.rows;
}
