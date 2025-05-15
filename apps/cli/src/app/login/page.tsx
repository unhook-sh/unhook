import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Spinner } from '~/components/spinner';
import { useAuthStore } from '~/stores/auth-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';

const log = debug('unhook:cli:login-page');

export const LoginPage: FC<RouteProps> = () => {
  // State management
  const [error, setError] = useState<string | null>(null);

  // Store access
  const navigate = useRouterStore.use.navigate();
  // const isSignedIn = useAuthStore.use.isSignedIn();
  const signIn = useAuthStore.use.signIn();
  const authUrl = useAuthStore.use.authUrl();

  // Start authentication when ready
  useEffect(() => {
    async function startAuthentication() {
      try {
        await signIn();

        navigate('/');
      } catch (error) {
        setError(`Authentication failed: ${(error as Error).message}`);
      }
    }

    log('Starting authentication');
    void startAuthentication();
  }, [navigate, signIn]);

  // Render based on current state
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" gap={1}>
          <Spinner />
          <Text>Opening browser for authentication...</Text>
          <Text dimColor>Copied to clipboard</Text>
        </Box>
        {authUrl && (
          <Box flexDirection="column" gap={1}>
            <Text>
              Copied to clipboard. If the browser doesn't open automatically,
              click here.
            </Text>
            <Text dimColor underline>
              {authUrl}
            </Text>
          </Box>
        )}
      </Box>

      {error && (
        <Box flexDirection="column" gap={1}>
          <Text color="red">{error}</Text>
          <Text>Press Enter to try again</Text>
        </Box>
      )}
    </Box>
  );
};
