'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEntitlements } from './entitlement-hooks';
import type { EntitlementKey } from './entitlement-types';

// Entitled component - similar to Clerk's SignedIn
interface EntitledProps {
  entitlement: EntitlementKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Entitled({ entitlement, children, fallback }: EntitledProps) {
  const { checkEntitlement, loading } = useEntitlements();

  if (!checkEntitlement(entitlement) || loading) {
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

  if (checkEntitlement(entitlement) || loading) {
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
    return null;
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
