import { debug } from '@unhook/logger';
import { type PropsWithChildren, useEffect } from 'react';
import { captureException } from '~/lib/posthog';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';
import { useRouterStore } from '~/stores/router-store';

const log = debug('unhook:cli:auth-context');

export function AuthProvider({ children }: PropsWithChildren) {
  const validateSession = useAuthStore.use.validateSession();
  const isValidating = useAuthStore.use.isValidatingSession();
  const exchangeAuthCode = useAuthStore.use.exchangeAuthCode();
  const isSignedIn = useAuthStore.use.isSignedIn();
  const navigate = useRouterStore.use.navigate();
  const code = useCliStore.use.code?.();

  useEffect(() => {
    // Run validation when the component mounts
    const validate = async () => {
      if (isSignedIn) {
        return;
      }
      log('AuthProvider: Running initial token validation');
      if (code) {
        try {
          await exchangeAuthCode(code);
        } catch (error) {
          log('AuthProvider: Token validation failed:', error);
          captureException(error as Error);
          navigate('/login');
        }
      } else {
        try {
          const isValidated = await validateSession();

          if (!isValidated) {
            navigate('/login');
          }
        } catch (error) {
          log('AuthProvider: Token validation failed:', error);
          captureException(error as Error);
          navigate('/login');
        }
      }
    };

    validate();
  }, [validateSession, code, exchangeAuthCode, isSignedIn, navigate]);

  // Monitor token validation state
  useEffect(() => {
    log('AuthProvider: Token validation state changed', {
      isValidating,
    });
  }, [isValidating]);

  return <>{children}</>;
}
