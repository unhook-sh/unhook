import { Box, Text } from 'ink';
import { useInput } from 'ink';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '~/components/spinner';
import { AuthService } from '~/lib/auth/service';
import { useAuthStore } from '~/stores/auth-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';
import { findAvailablePort } from '~/utils/port';

// Authentication states
type AuthState =
  | 'initializing' // Finding port, creating service
  | 'ready' // Ready to start auth flow
  | 'authenticating' // Auth flow in progress
  | 'failed' // Auth failed
  | 'completed'; // Auth completed successfully

export const LoginPage: FC<RouteProps> = () => {
  // State management
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [authService, setAuthService] = useState<AuthService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const authAttemptedRef = useRef(false);

  // Store access
  const navigate = useRouterStore.use.navigate();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const setAuth = useAuthStore.use.setAuth();
  const setIsLoading = useAuthStore.use.setIsLoading();

  // Initialize auth service
  useEffect(() => {
    if (authState !== 'initializing') return;

    async function initializeAuthService() {
      try {
        const port = await findAvailablePort();
        const service = new AuthService({
          webAppUrl: process.env.WEB_APP_URL || 'http://localhost:3000',
          clientPort: port,
        });
        setAuthService(service);
        setAuthState('ready');
      } catch (error) {
        setError(`Failed to initialize: ${(error as Error).message}`);
        setAuthState('failed');
        setIsLoading(false);
      }
    }

    void initializeAuthService();
  }, [authState, setIsLoading]);

  // Start authentication when ready
  useEffect(() => {
    // Skip if not in ready state or already attempted
    if (authState !== 'ready' || authAttemptedRef.current || !authService) {
      return;
    }

    // If already authenticated, navigate away
    if (isAuthenticated) {
      navigate('/');
      return;
    }

    async function startAuthentication() {
      if (!authService) return; // Safety check

      try {
        authAttemptedRef.current = true;
        setIsLoading(true);
        setAuthState('authenticating');

        const user = await authService.authenticate();

        setAuth({
          user: user.user,
          token: user.token,
          orgId: user.orgId,
        });

        setAuthState('completed');
        navigate('/');
      } catch (error) {
        setError(`Authentication failed: ${(error as Error).message}`);
        setAuthState('failed');
        setIsLoading(false);
        // Reset attempt flag to allow retry
        authAttemptedRef.current = false;
      }
    }

    void startAuthentication();
  }, [
    authState,
    authService,
    isAuthenticated,
    navigate,
    setAuth,
    setIsLoading,
  ]);

  // Handle retry with Enter key
  useInput((input, key) => {
    if (authState === 'failed' && key.return) {
      setError(null);
      setAuthState('ready');
    }
  });

  // Render based on current state
  return (
    <Box flexDirection="column" gap={1}>
      {(authState === 'initializing' || authState === 'authenticating') && (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Spinner />
            <Text>
              {authState === 'initializing'
                ? ' Initializing authentication...'
                : ' Opening browser for authentication...'}
            </Text>
          </Box>
          {authState === 'authenticating' && authService?.getAuthUrl() && (
            <Box flexDirection="column" gap={1}>
              <Text>
                If the browser doesn't open automatically, click here:{' '}
              </Text>
              <Text dimColor underline>
                {authService.getAuthUrl()}
              </Text>
            </Box>
          )}
        </Box>
      )}

      {authState === 'failed' && (
        <Box flexDirection="column" gap={1}>
          <Text color="red">{error}</Text>
          <Text>Press Enter to try again</Text>
        </Box>
      )}
    </Box>
  );
};
