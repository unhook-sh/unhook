'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useSubscription } from './subscription-hooks';

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

  if (!subscriptionInfo.isActive || loading) {
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

  if (!subscriptionInfo.isPastDue || loading) {
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

  if (!subscriptionInfo.isCanceled || loading) {
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

  if (!subscriptionInfo.isTrialing || loading) {
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

  if (!subscriptionInfo.isPaid || loading) {
    return fallback ? fallback : null;
  }

  return <>{children}</>;
}

// SubscriptionRequired component - shows upgrade prompt when not active
interface SubscriptionRequiredProps {
  children: ReactNode;
  upgradeMessage?: string;
  upgradeUrl?: string;
}

export function SubscriptionRequired({
  children,
  upgradeMessage = 'This feature requires an active subscription',
  upgradeUrl = '/app/settings/billing',
}: SubscriptionRequiredProps) {
  const { subscriptionInfo, loading } = useSubscription();

  if (loading) {
    return null;
  }

  if (!subscriptionInfo.isActive) {
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
