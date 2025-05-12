import { debug } from '@unhook/logger';
import { type PropsWithChildren, useEffect } from 'react';
import { captureException } from '~/lib/posthog';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';

const log = debug('unhook:cli:auth-context');

export function AuthProvider({ children }: PropsWithChildren) {
  const validateSession = useAuthStore.use.validateSession();
  const isValidating = useAuthStore.use.isValidatingSession();
  const exchangeAuthCode = useAuthStore.use.exchangeAuthCode();
  const code = useCliStore.use.code?.();

  useEffect(() => {
    // Run validation when the component mounts
    log('AuthProvider: Running initial token validation');
    if (code) {
      exchangeAuthCode(code).catch((error) => {
        log('AuthProvider: Token validation failed:', error);
        captureException(error);
      });
    } else {
      validateSession().catch((error) => {
        log('AuthProvider: Token validation failed:', error);
        captureException(error);
      });
    }
  }, [validateSession, code, exchangeAuthCode]);

  // Monitor token validation state
  useEffect(() => {
    log('AuthProvider: Token validation state changed', {
      isValidating,
    });
  }, [isValidating]);

  return <>{children}</>;
}
