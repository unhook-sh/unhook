import { debug } from '@unhook/logger';
import { type PropsWithChildren, useEffect } from 'react';
import { captureException } from '~/lib/posthog';
import { useAuthStore } from '~/stores/auth-store';

const log = debug('unhook:cli:auth-context');

export function AuthProvider({ children }: PropsWithChildren) {
  const validateToken = useAuthStore.use.validateToken();
  const isValidating = useAuthStore.use.isValidatingToken();
  const isTokenValid = useAuthStore.use.isTokenValid();

  useEffect(() => {
    // Run validation when the component mounts
    log('AuthProvider: Running initial token validation');
    validateToken().catch((error) => {
      log('AuthProvider: Token validation failed:', error);
      captureException(error);
    });
  }, [validateToken]);

  // Monitor token validation state
  useEffect(() => {
    log('AuthProvider: Token validation state changed', {
      isValidating,
      isTokenValid,
    });
  }, [isValidating, isTokenValid]);

  return <>{children}</>;
}
