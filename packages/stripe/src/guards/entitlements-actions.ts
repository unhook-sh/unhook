'use server';

import { auth } from '@clerk/nextjs/server';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import type { EntitlementKey, EntitlementsRecord } from './entitlement-types';
import { getOrgEntitlements } from './entitlements-server';

// Create the action client
const action = createSafeActionClient();

// Validation schema for entitlement check
const checkEntitlementSchema = z.object({
  entitlement: z
    .string()
    .min(1, 'Entitlement is required') as z.ZodType<EntitlementKey>,
});

// Server action to check entitlement
export const checkEntitlementAction = action
  .inputSchema(checkEntitlementSchema)
  .action(async ({ parsedInput }) => {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return { entitled: false, reason: 'Unauthorized' };
    }

    try {
      // Get entitlements from Stripe using the centralized function
      const entitlements = await getOrgEntitlements();

      // Check if the specific entitlement exists
      const entitled = entitlements[parsedInput.entitlement] || false;

      return {
        entitled,
        entitlements,
        reason: entitled ? 'Entitled' : 'Feature not included in subscription',
      };
    } catch (error) {
      console.error('Error checking entitlement:', error);
      return { entitled: false, reason: 'Error checking entitlement' };
    }
  });

// Action to get all entitlements for the current organization
export const getEntitlementsAction = action.action(async () => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { entitlements: {} as EntitlementsRecord, reason: 'Unauthorized' };
  }

  try {
    // Get entitlements from Stripe using the centralized function
    const entitlements = await getOrgEntitlements();

    return {
      entitlements,
    };
  } catch (error) {
    console.error('Error getting entitlements:', error);
    return {
      entitlements: {} as EntitlementsRecord,
      reason: 'Error getting entitlements',
    };
  }
});
