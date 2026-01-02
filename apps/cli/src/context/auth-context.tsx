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
  const authenticateWithApiKey = useAuthStore.use.authenticateWithApiKey();
  const isSignedIn = useAuthStore.use.isSignedIn();
  const navigate = useRouterStore.use.navigate();
  const code = useCliStore.use.code?.();
  const apiKey = useCliStore.use.apiKey?.();
  const nonInteractive = useCliStore.use.nonInteractive?.() ?? false;

  useEffect(() => {
    // Run validation when the component mounts
    const validate = async () => {
      if (isSignedIn) {
        return;
      }
      log('AuthProvider: Running initial token validation');

      // In non-interactive mode, prioritize API key authentication
      if (apiKey) {
        try {
          log('AuthProvider: Attempting API key authentication');
          await authenticateWithApiKey(apiKey);
          return;
        } catch (error) {
          log('AuthProvider: API key authentication failed:', error);
          captureException(error as Error);
          if (nonInteractive) {
            // In non-interactive mode, fail fast if API key doesn't work
            navigate('/login');
            return;
          }
          // Fall through to try other auth methods
        }
      }

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
  }, [
    validateSession,
    code,
    exchangeAuthCode,
    authenticateWithApiKey,
    isSignedIn,
    navigate,
    apiKey,
    nonInteractive,
  ]);

  // Monitor token validation state
  useEffect(() => {
    log('AuthProvider: Token validation state changed', {
      isValidating,
    });
  }, [isValidating]);

  return <>{children}</>;
}
