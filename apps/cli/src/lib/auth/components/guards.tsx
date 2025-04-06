import type { PropsWithChildren } from 'react';
import { useAuth } from '../hooks/use-auth';

interface AuthGuardProps extends PropsWithChildren {
  /**
   * Optional fallback component to show while loading
   */
  fallback?: React.ReactNode;
}

/**
 * Component that renders its children only when the user is signed in
 */
export function SignedIn({ children, fallback }: AuthGuardProps) {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return fallback ?? null;
  }

  return isSignedIn ? <>{children}</> : null;
}

/**
 * Component that renders its children only when the user is signed out
 */
export function SignedOut({ children, fallback }: AuthGuardProps) {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return fallback ?? null;
  }

  return !isSignedIn ? <>{children}</> : null;
}

/**
 * Component that renders different content for authenticated and unauthenticated users
 */
export function AuthGuard({
  children,
  fallback,
  signedOutComponent,
}: AuthGuardProps & {
  /**
   * Component to show when user is not authenticated
   */
  signedOutComponent: React.ReactNode;
}) {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return fallback ?? null;
  }

  return isSignedIn ? <>{children}</> : <>{signedOutComponent}</>;
}
