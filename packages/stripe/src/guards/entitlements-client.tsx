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
import type { EntitlementKey, EntitlementsRecord } from './entitlement-types';
import { getEntitlementsAction } from './entitlements-actions';

// Entitlement context
interface EntitlementContextType {
  entitlements: EntitlementsRecord;
  loading: boolean;
  checkEntitlement: (entitlement: EntitlementKey) => boolean;
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(
  undefined,
);

// Entitlement provider component
interface EntitlementProviderProps {
  children: ReactNode;
}

export function EntitlementProvider({ children }: EntitlementProviderProps) {
  const { organization } = useOrganization();
  const [entitlements, setEntitlements] = useState<EntitlementsRecord>(
    {} as EntitlementsRecord,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization) {
      setEntitlements({} as EntitlementsRecord);
      setLoading(false);
      return;
    }

    // Check entitlements using server action
    const checkEntitlements = async () => {
      try {
        const result = await getEntitlementsAction();

        if (result.data?.entitlements) {
          setEntitlements(result.data.entitlements);
        } else {
          setEntitlements({} as EntitlementsRecord);
        }
      } catch (error) {
        console.error('Error checking entitlements:', error);
        setEntitlements({} as EntitlementsRecord);
      } finally {
        setLoading(false);
      }
    };

    checkEntitlements();
  }, [organization]);

  const checkEntitlement = (entitlement: EntitlementKey): boolean => {
    return entitlements[entitlement] || false;
  };

  return (
    <EntitlementContext.Provider
      value={{ checkEntitlement, entitlements, loading }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}

// Hook to use entitlements
export function useEntitlements() {
  const context = useContext(EntitlementContext);
  if (context === undefined) {
    throw new Error(
      'useEntitlements must be used within an EntitlementProvider',
    );
  }
  return context;
}

// Function to check if user is entitled to a specific feature
export function useIsEntitled(entitlement: EntitlementKey): boolean {
  // This is a client-side function that can be used in components
  // It will work when used within the EntitlementProvider context
  const context = useContext(EntitlementContext);
  if (context === undefined) {
    console.warn('entitled() called outside of EntitlementProvider context');
    return false;
  }
  return context.checkEntitlement(entitlement);
}

// Entitled component - similar to Clerk's SignedIn
interface EntitledProps {
  entitlement: EntitlementKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Entitled({ entitlement, children, fallback }: EntitledProps) {
  const { checkEntitlement, loading } = useEntitlements();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!checkEntitlement(entitlement)) {
    return fallback ? fallback : null;
  }

  return <>{children}</>;
}

// NotEntitled component - opposite of Entitled
interface NotEntitledProps {
  entitlement: EntitlementKey;
  children: ReactNode;
}

export function NotEntitled({ entitlement, children }: NotEntitledProps) {
  const { checkEntitlement, loading } = useEntitlements();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (checkEntitlement(entitlement)) {
    return null;
  }

  return <>{children}</>;
}

// EntitlementRequired component - shows upgrade prompt when not entitled
interface EntitlementRequiredProps {
  entitlement: EntitlementKey;
  children: ReactNode;
  upgradeMessage?: string;
  upgradeUrl?: string;
}

export function EntitlementRequired({
  entitlement,
  children,
  upgradeMessage = 'This feature requires a paid plan',
  upgradeUrl = '/app/settings/billing',
}: EntitlementRequiredProps) {
  const { checkEntitlement, loading } = useEntitlements();

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!checkEntitlement(entitlement)) {
    return (
      <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{upgradeMessage}</p>
          <Link
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
            href={upgradeUrl}
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Hook for conditional rendering based on entitlements
export function useEntitlement(entitlement: EntitlementKey) {
  const { checkEntitlement, loading } = useEntitlements();

  return {
    entitled: checkEntitlement(entitlement),
    loading,
  };
}
