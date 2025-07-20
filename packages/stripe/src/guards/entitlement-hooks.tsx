'use client';

import { useContext } from 'react';
import type { EntitlementKey, EntitlementsRecord } from './entitlement-types';
import { StripeContext } from './provider';

// Hook to use entitlements
export function useEntitlements() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useEntitlements must be used within a StripeProvider');
  }
  return {
    checkEntitlement: context.checkEntitlement,
    entitlements: context.entitlements as EntitlementsRecord,
    loading: context.loading,
  };
}

// Function to check if user is entitled to a specific feature
export function useIsEntitled(entitlement: EntitlementKey): boolean {
  const context = useContext(StripeContext);
  if (context === undefined) {
    console.warn('useIsEntitled() called outside of StripeProvider context');
    return false;
  }
  return context.loading ? false : context.checkEntitlement(entitlement);
}
