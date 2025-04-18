import { Box, Text } from 'ink';
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
export function SignedIn({ children, fallback }: AuthGuardProps) {
  const isTokenValid = useAuthStore.use.isTokenValid();
  const isValidating = useAuthStore.use.isValidatingToken();
  const isSignedIn = useAuthStore.use.isAuthenticated();

  if (isValidating) {
    return (
      fallback ?? (
        <Box>
          <Text>Validating authentication...</Text>
        </Box>
      )
    );
  }

  return isSignedIn && isTokenValid ? <>{children}</> : null;
}

/**
 * Component that renders its children only when the user is signed out
 */
export function SignedOut({ children, fallback }: AuthGuardProps) {
  const isSignedIn = useAuthStore.use.isAuthenticated();
  const isValidating = useAuthStore.use.isValidatingToken();

  if (isValidating) {
    return (
      fallback ?? (
        <Box>
          <Text>Validating authentication...</Text>
        </Box>
      )
    );
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
  const isSignedIn = useAuthStore.use.isAuthenticated();
  const isTokenValid = useAuthStore.use.isTokenValid();
  const isValidating = useAuthStore.use.isValidatingToken();

  if (isValidating) {
    return (
      fallback ?? (
        <Box>
          <Text>Validating authentication...</Text>
        </Box>
      )
    );
  }

  return isSignedIn && isTokenValid ? (
    <>{children}</>
  ) : (
    <>{signedOutComponent}</>
  );
}
