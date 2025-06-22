import type { PropsWithChildren } from 'react';
import { useAuthStore } from '../stores/auth-store';

interface AuthGuardProps extends PropsWithChildren {
  /**
   * Optional fallback component to show while loading
   */
  fallback?: React.ReactNode;
}

/**
 * Component that renders its children only when the user is signed in
 * and has a valid token
 */
export function SignedIn({ children }: AuthGuardProps) {
  const isSignedIn = useAuthStore.use.isSignedIn();

  return isSignedIn ? children : null;
}

/**
 * Component that renders its children only when the user is signed out
 */
export function SignedOut({ children }: AuthGuardProps) {
  const isSignedIn = useAuthStore.use.isSignedIn();

  return !isSignedIn ? children : null;
}

/**
 * Component that renders its children only when the user is signed out
 */
export function ValidatingSession({ children }: AuthGuardProps) {
  const isValidating = useAuthStore.use.isValidatingSession();

  return isValidating ? children : null;
}

/**
 * Component that renders its children only when the user is signed out
 */
export function ValidatedSession({ children }: AuthGuardProps) {
  const isValidating = useAuthStore.use.isValidatingSession();

  return isValidating ? null : children;
}
