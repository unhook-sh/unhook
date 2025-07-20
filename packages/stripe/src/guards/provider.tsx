'use client';

import { useOrganization } from '@clerk/nextjs';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { EntitlementKey, EntitlementsRecord } from './entitlement-types';
import { getEntitlementsAction } from './entitlements-actions';
import { getSubscriptionInfoAction } from './subscription-actions';

// Combined context type
interface StripeContextType {
  // Subscription info
  subscriptionInfo: {
    status: string | null;
    customerId: string | null;
    isActive: boolean;
    isPastDue: boolean;
    isCanceled: boolean;
    isTrialing: boolean;
    isPaid: boolean;
    hasAny: boolean;
  };
  // Entitlements info
  entitlements: EntitlementsRecord;
  loading: boolean;
  checkEntitlement: (entitlement: EntitlementKey) => boolean;
}

export const StripeContext = createContext<StripeContextType | undefined>(
  undefined,
);

// Provider component
interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const { organization } = useOrganization();
  const [subscriptionInfo, setSubscriptionInfo] = useState<
    StripeContextType['subscriptionInfo']
  >({
    customerId: null,
    hasAny: false,
    isActive: false,
    isCanceled: false,
    isPaid: false,
    isPastDue: false,
    isTrialing: false,
    status: null,
  });
  const [entitlements, setEntitlements] = useState<EntitlementsRecord>(
    {} as EntitlementsRecord,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) {
      setSubscriptionInfo({
        customerId: null,
        hasAny: false,
        isActive: false,
        isCanceled: false,
        isPaid: false,
        isPastDue: false,
        isTrialing: false,
        status: null,
      });
      setEntitlements({} as EntitlementsRecord);
      setLoading(false);
      return;
    }

    // Check both subscription and entitlements
    const checkStripeData = async () => {
      try {
        const [subscriptionResult, entitlementsResult] = await Promise.all([
          getSubscriptionInfoAction(),
          getEntitlementsAction(),
        ]);

        // Update subscription info
        if (subscriptionResult.data?.subscriptionInfo) {
          setSubscriptionInfo(subscriptionResult.data.subscriptionInfo);
        } else {
          setSubscriptionInfo({
            customerId: null,
            hasAny: false,
            isActive: false,
            isCanceled: false,
            isPaid: false,
            isPastDue: false,
            isTrialing: false,
            status: null,
          });
        }

        // Update entitlements
        if (entitlementsResult.data?.entitlements) {
          setEntitlements(
            entitlementsResult.data.entitlements as EntitlementsRecord,
          );
        } else {
          setEntitlements({} as EntitlementsRecord);
        }
      } catch (error) {
        console.error('Error checking Stripe data:', error);
        setSubscriptionInfo({
          customerId: null,
          hasAny: false,
          isActive: false,
          isCanceled: false,
          isPaid: false,
          isPastDue: false,
          isTrialing: false,
          status: null,
        });
        setEntitlements({} as EntitlementsRecord);
      } finally {
        setLoading(false);
      }
    };

    checkStripeData();
  }, [organization]);

  const checkEntitlement = (entitlement: EntitlementKey): boolean => {
    return entitlements[entitlement] || false;
  };

  return (
    <StripeContext.Provider
      value={{
        checkEntitlement,
        entitlements,
        loading,
        subscriptionInfo,
      }}
    >
      {children}
    </StripeContext.Provider>
  );
}

// Hook to use the Stripe context
export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe must be used within a StripeProvider');
  }
  return context;
}
