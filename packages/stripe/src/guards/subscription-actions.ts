'use server';

import { createSafeActionClient } from 'next-safe-action';
import { getSubscriptionInfo } from './subscription-server';

// Create the action client
const action = createSafeActionClient();

// Action to get subscription info for the current organization
export const getSubscriptionInfoAction = action.action(async () => {
  try {
    // Get subscription info from the centralized function
    const subscriptionInfo = await getSubscriptionInfo();

    return {
      subscriptionInfo,
    };
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return {
      reason: 'Error getting subscription info',
      subscriptionInfo: {
        customerId: null,
        hasAny: false,
        isActive: false,
        isCanceled: false,
        isPaid: false,
        isPastDue: false,
        isTrialing: false,
        status: null,
      },
    };
  }
});
