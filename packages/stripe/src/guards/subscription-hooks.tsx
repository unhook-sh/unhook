'use client';

import { useContext } from 'react';
import { StripeContext } from './provider';

// Hook to use subscription info
export function useSubscription() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a StripeProvider');
  }
  return {
    loading: context.loading,
    subscriptionInfo: context.subscriptionInfo,
  };
}

// Function to check if user has an active subscription
export function useHasActiveSubscription(): boolean {
  const context = useContext(StripeContext);
  if (context === undefined) {
    console.warn(
      'useHasActiveSubscription() called outside of StripeProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isActive;
}

// Function to check if user has a past due subscription
export function useHasPastDueSubscription(): boolean {
  const context = useContext(StripeContext);
  if (context === undefined) {
    console.warn(
      'useHasPastDueSubscription() called outside of StripeProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isPastDue;
}

// Function to check if user has a canceled subscription
export function useHasCanceledSubscription(): boolean {
  const context = useContext(StripeContext);
  if (context === undefined) {
    console.warn(
      'useHasCanceledSubscription() called outside of StripeProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isCanceled;
}

// Function to check if user has a trialing subscription
export function useHasTrialingSubscription(): boolean {
  const context = useContext(StripeContext);
  if (context === undefined) {
    console.warn(
      'useHasTrialingSubscription() called outside of StripeProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isTrialing;
}

// Function to check if user has a paid subscription
export function useHasPaidSubscription(): boolean {
  const context = useContext(StripeContext);
  if (context === undefined) {
    console.warn(
      'useHasPaidSubscription() called outside of StripeProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.isPaid;
}

// Function to check if user has any subscription
export function useHasAnySubscription(): boolean {
  const context = useContext(StripeContext);
  if (context === undefined) {
    console.warn(
      'useHasAnySubscription() called outside of StripeProvider context',
    );
    return false;
  }
  return context.subscriptionInfo.hasAny;
}

// Hook to get subscription status
export function useSubscriptionStatus() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    console.warn(
      'useSubscriptionStatus() called outside of StripeProvider context',
    );
    return null;
  }
  return context.subscriptionInfo.status;
}
