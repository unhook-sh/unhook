import { debug } from '@unhook/logger';
import { Box, Text, useInput } from 'ink';
import open from 'open';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';

const log = debug('unhook:cli:login-page');

export const LoginPage: FC<RouteProps> = () => {
  // State management
  const [error, setError] = useState<string | null>(null);
  const [isBrowserOpened, setIsBrowserOpened] = useState(false);

  // Store access
  const navigate = useRouterStore.use.navigate();
  // const isSignedIn = useAuthStore.use.isSignedIn();
  const signIn = useAuthStore.use.signIn();
  const authUrl = useAuthStore.use.authUrl();

  // Handle input
  useInput((_, key) => {
    if (key.return && authUrl && !isBrowserOpened) {
      log('Opening browser for authentication');
      void open(authUrl);
      setIsBrowserOpened(true);
    }
  });

  // Open browser when authUrl is available
  useEffect(() => {
    if (authUrl && !isBrowserOpened) {
      log('Opening browser for authentication');
      void open(authUrl);
      setIsBrowserOpened(true);
    }
  }, [authUrl, isBrowserOpened]);

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
        {authUrl && (
          <Box flexDirection="column" gap={1}>
            <Box flexDirection="column" gap={1}>
              <Text>Please go to the link to authenticate the Unhook CLI.</Text>
              <Text>
                If the browser doesn't open automatically, click here:
              </Text>
              <Text dimColor underline>
                {authUrl}
              </Text>
            </Box>
            <Box flexDirection="row" gap={1}>
              <Text>Press Enter to open browser for authentication...</Text>
              {isBrowserOpened && <Text dimColor>Browser opened</Text>}
            </Box>
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
