import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs } from '@unhook/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Helper function to get the current organization's subscription status
 */
export async function getOrgSubscriptionStatus(): Promise<{
  status: string | null;
  customerId: string | null;
}> {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { customerId: null, status: null };
  }

  // Get the organization
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.id, orgId),
  });

  if (!org) {
    return { customerId: null, status: null };
  }

  return {
    customerId: org.stripeCustomerId,
    status: org.stripeSubscriptionStatus,
  };
}

/**
 * Helper function to check if the current user's organization has an active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const { status } = await getOrgSubscriptionStatus();
  return status === 'active';
}

/**
 * Helper function to check if the current user's organization has a past due subscription
 */
export async function hasPastDueSubscription(): Promise<boolean> {
  const { status } = await getOrgSubscriptionStatus();
  return status === 'past_due';
}

/**
 * Helper function to check if the current user's organization has a canceled subscription
 */
export async function hasCanceledSubscription(): Promise<boolean> {
  const { status } = await getOrgSubscriptionStatus();
  return status === 'canceled';
}

/**
 * Helper function to check if the current user's organization has a trialing subscription
 */
export async function hasTrialingSubscription(): Promise<boolean> {
  const { status } = await getOrgSubscriptionStatus();
  return status === 'trialing';
}

/**
 * Helper function to check if the current user's organization has any paid subscription
 * (active, past_due, or trialing)
 */
export async function hasPaidSubscription(): Promise<boolean> {
  const { status } = await getOrgSubscriptionStatus();
  return ['active', 'past_due', 'trialing'].includes(status || '');
}

/**
 * Helper function to check if the current user's organization has any subscription
 * (including canceled)
 */
export async function hasAnySubscription(): Promise<boolean> {
  const { status } = await getOrgSubscriptionStatus();
  return !!status;
}

/**
 * Helper function to require an active subscription and throw an error if not available
 * Useful for server actions that should fail if the subscription is not active
 */
export async function requireActiveSubscription(
  errorMessage?: string,
): Promise<void> {
  const isActive = await hasActiveSubscription();

  if (!isActive) {
    throw new Error(
      errorMessage ||
        'This feature requires an active subscription. Please check your billing status.',
    );
  }
}

/**
 * Helper function to require a paid subscription and throw an error if not available
 * Useful for server actions that should fail if the subscription is not paid
 */
export async function requirePaidSubscription(
  errorMessage?: string,
): Promise<void> {
  const isPaid = await hasPaidSubscription();

  if (!isPaid) {
    throw new Error(
      errorMessage ||
        'This feature requires a paid subscription. Please upgrade your plan.',
    );
  }
}

/**
 * Helper function to require any subscription and throw an error if not available
 * Useful for server actions that should fail if there's no subscription at all
 */
export async function requireAnySubscription(
  errorMessage?: string,
): Promise<void> {
  const hasSubscription = await hasAnySubscription();

  if (!hasSubscription) {
    throw new Error(
      errorMessage ||
        'This feature requires a subscription. Please subscribe to continue.',
    );
  }
}

/**
 * Helper function to get all subscription status information
 */
export async function getSubscriptionInfo(): Promise<{
  status: string | null;
  customerId: string | null;
  isActive: boolean;
  isPastDue: boolean;
  isCanceled: boolean;
  isTrialing: boolean;
  isPaid: boolean;
  hasAny: boolean;
}> {
  const { status, customerId } = await getOrgSubscriptionStatus();

  return {
    customerId,
    hasAny: !!status,
    isActive: status === 'active',
    isCanceled: status === 'canceled',
    isPaid: ['active', 'past_due', 'trialing'].includes(status || ''),
    isPastDue: status === 'past_due',
    isTrialing: status === 'trialing',
    status,
  };
}
