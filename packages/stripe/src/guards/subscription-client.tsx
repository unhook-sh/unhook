'use client';

import { useOrganization } from '@clerk/nextjs';
import Link from 'next/link';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getSubscriptionInfoAction } from './subscription-actions';

// Subscription context
interface SubscriptionContextType {
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
  loading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

// Subscription provider component
interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { organization } = useOrganization();
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    status: string | null;
    customerId: string | null;
    isActive: boolean;
    isPastDue: boolean;
    isCanceled: boolean;
    isTrialing: boolean;
    isPaid: boolean;
    hasAny: boolean;
  }>({
    customerId: null,
    hasAny: false,
    isActive: false,
    isCanceled: false,
    isPaid: false,
    isPastDue: false,
    isTrialing: false,
    status: null,
  });
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
      setLoading(false);
      return;
    }

    // Check subscription status using server action
    const checkSubscription = async () => {
      try {
        const result = await getSubscriptionInfoAction();

        if (result.data?.subscriptionInfo) {
          setSubscriptionInfo(result.data.subscriptionInfo);
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
      } catch (error) {
        console.error('Error checking subscription status:', error);
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
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [organization]);

  return (
    <SubscriptionContext.Provider value={{ loading, subscriptionInfo }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Hook to use subscription info
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider',
    );
  }
  return context;
}

// Function to check if user has an active subscription
export function useHasActiveSubscription(): boolean {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.warn(
      'useHasActiveSubscription() called outside of SubscriptionProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isActive;
}

// Function to check if user has a past due subscription
export function useHasPastDueSubscription(): boolean {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.warn(
      'useHasPastDueSubscription() called outside of SubscriptionProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isPastDue;
}

// Function to check if user has a canceled subscription
export function useHasCanceledSubscription(): boolean {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.warn(
      'useHasCanceledSubscription() called outside of SubscriptionProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isCanceled;
}

// Function to check if user has a trialing subscription
export function useHasTrialingSubscription(): boolean {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.warn(
      'useHasTrialingSubscription() called outside of SubscriptionProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isTrialing;
}

// Function to check if user has a paid subscription
export function useHasPaidSubscription(): boolean {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.warn(
      'useHasPaidSubscription() called outside of SubscriptionProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isPaid;
}

// Function to check if user has any subscription
export function useHasAnySubscription(): boolean {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    console.warn(
      'useHasAnySubscription() called outside of SubscriptionProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.hasAny;
}

// SubscriptionActive component
interface SubscriptionActiveProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionActive({
  children,
  fallback,
}: SubscriptionActiveProps) {
  const { subscriptionInfo, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!subscriptionInfo.isActive) {
    return fallback ? fallback : null;
  }

  return <>{children}</>;
}

// SubscriptionPastDue component
interface SubscriptionPastDueProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionPastDue({
  children,
  fallback,
}: SubscriptionPastDueProps) {
  const { subscriptionInfo, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!subscriptionInfo.isPastDue) {
    return fallback ? fallback : null;
  }

  return <>{children}</>;
}

// SubscriptionCanceled component
interface SubscriptionCanceledProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionCanceled({
  children,
  fallback,
}: SubscriptionCanceledProps) {
  const { subscriptionInfo, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!subscriptionInfo.isCanceled) {
    return fallback ? fallback : null;
  }

  return <>{children}</>;
}

// SubscriptionTrialing component
interface SubscriptionTrialingProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionTrialing({
  children,
  fallback,
}: SubscriptionTrialingProps) {
  const { subscriptionInfo, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!subscriptionInfo.isTrialing) {
    return fallback ? fallback : null;
  }

  return <>{children}</>;
}

// SubscriptionPaid component
interface SubscriptionPaidProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SubscriptionPaid({
  children,
  fallback,
}: SubscriptionPaidProps) {
  const { subscriptionInfo, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!subscriptionInfo.isPaid) {
    return fallback ? fallback : null;
  }

  return <>{children}</>;
}

// SubscriptionRequired component - shows upgrade prompt when no paid subscription
interface SubscriptionRequiredProps {
  children: ReactNode;
  upgradeMessage?: string;
  upgradeUrl?: string;
}

export function SubscriptionRequired({
  children,
  upgradeMessage = 'This feature requires a paid subscription',
  upgradeUrl = '/app/settings/billing',
}: SubscriptionRequiredProps) {
  const { subscriptionInfo, loading } = useSubscription();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!subscriptionInfo.isPaid) {
    return (
      <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{upgradeMessage}</p>
          <Link
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
            href={upgradeUrl}
          >
            Subscribe Now
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for conditional rendering based on subscription status
export function useSubscriptionStatus() {
  const { subscriptionInfo, loading } = useSubscription();

  return {
    ...subscriptionInfo,
    loading,
  };
}
