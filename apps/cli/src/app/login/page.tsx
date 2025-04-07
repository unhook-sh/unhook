import { Box, Text } from 'ink';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Spinner } from '~/components/spinner';
import { useAuthStore } from '~/lib/auth';
import { AuthService } from '~/lib/auth/service';
import type { RouteProps } from '~/lib/router';
import { useRouter } from '~/lib/router';
import { findAvailablePort } from '~/utils/port';
import type { AppRoutePath } from '../routes';

export const LoginPage: FC<RouteProps> = () => {
  const [authService, setAuthService] = useState<AuthService | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [shouldAuthenticate, setShouldAuthenticate] = useState(true);
  const { navigate } = useRouter<AppRoutePath>();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const isLoading = useAuthStore.use.isLoading();
  const setAuth = useAuthStore.use.setAuth();
  const setIsLoading = useAuthStore.use.setIsLoading();

  // Initialize auth service with available port
  useEffect(() => {
    async function initializeAuthService() {
      try {
        const port = await findAvailablePort();
        setAuthService(
          new AuthService({
            webAppUrl: process.env.WEB_APP_URL || 'http://localhost:3000',
            clientPort: port,
          }),
        );
      } catch (error) {
        console.error('Failed to find available port:', error);
        setIsLoading(false);
      }
    }

    void initializeAuthService();
  }, [setIsLoading]);

  // Handle authentication
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
      return;
    }

    if (!shouldAuthenticate || !authService) {
      return;
    }

    async function authenticate() {
      try {
        setIsLoading(true);
        setShouldAuthenticate(false);
        if (!authService) {
          return;
        }

        // Start the authentication process
        const authPromise = authService.authenticate();

        // Wait a bit for the auth URL to be available
        await new Promise((resolve) => setTimeout(resolve, 100));
        setAuthUrl(authService.getAuthUrl());

        // Wait for authentication to complete
        const { token, userId, firstName, lastName, orgId } = await authPromise;
        setAuth({ token, userId, firstName, lastName, orgId });
        navigate('/');
      } catch (error) {
        console.error('Authentication failed:', error);
        setIsLoading(false);
        setAuthUrl(null);
        // Allow retry on failure
        setShouldAuthenticate(true);
      }
    }

    void authenticate();
  }, [
    isAuthenticated,
    navigate,
    setAuth,
    setIsLoading,
    authService,
    shouldAuthenticate,
  ]);

  const handleRetry = () => {
    setShouldAuthenticate(true);
  };

  return (
    <Box flexDirection="column" gap={1}>
      {isLoading && (
        <Box flexDirection="column" gap={1}>
          <Box>
            <Spinner />
            <Text> Opening browser for authentication...</Text>
          </Box>
          {authUrl && (
            <Box flexDirection="column" gap={1}>
              <Text>
                If the browser doesn't open automatically, click here:{' '}
              </Text>
              <Text dimColor underline>
                {authUrl}
              </Text>
            </Box>
          )}
        </Box>
      )}
      {!isLoading && (
        <Box>
          <Text>Press Enter to try again</Text>
        </Box>
      )}
    </Box>
  );
};
