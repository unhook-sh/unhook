import { debug } from '@unhook/logger';
import { Box, Text, useInput } from 'ink';
import open from 'open';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';
import { type RouteProps, useRouterStore } from '~/stores/router-store';

const log = debug('unhook:cli:login-page');

export const LoginPage: FC<RouteProps> = () => {
  // State management
  const [error, setError] = useState<string | null>(null);
  const [isBrowserOpened, setIsBrowserOpened] = useState(false);

  // Store access
  const navigate = useRouterStore.use.navigate();
  const signIn = useAuthStore.use.signIn();
  const authenticateWithApiKey = useAuthStore.use.authenticateWithApiKey();
  const authUrl = useAuthStore.use.authUrl();
  const nonInteractive = useCliStore.use.nonInteractive?.() ?? false;
  const apiKey = useCliStore.use.apiKey?.();
  const code = useCliStore.use.code?.();

  // Handle input (only in interactive mode)
  useInput((_, key) => {
    if (!nonInteractive && key.return && authUrl && !isBrowserOpened) {
      log('Opening browser for authentication');
      void open(authUrl);
      setIsBrowserOpened(true);
    }
  });

  // Open browser when authUrl is available (only in interactive mode)
  useEffect(() => {
    if (!nonInteractive && authUrl && !isBrowserOpened) {
      log('Opening browser for authentication');
      void open(authUrl);
      setIsBrowserOpened(true);
    }
  }, [authUrl, isBrowserOpened, nonInteractive]);

  // Start authentication when ready
  useEffect(() => {
    async function startAuthentication() {
      // In non-interactive mode, handle authentication differently
      if (nonInteractive) {
        if (apiKey) {
          try {
            log('Authenticating with API key in non-interactive mode');
            await authenticateWithApiKey(apiKey);
            navigate('/');
            return;
          } catch (error) {
            setError(
              `API key authentication failed: ${(error as Error).message}`,
            );
            return;
          }
        }

        if (code) {
          try {
            log('Exchanging auth code in non-interactive mode');
            const exchangeAuthCode = useAuthStore.getState().exchangeAuthCode;
            await exchangeAuthCode(code);
            navigate('/');
            return;
          } catch (error) {
            setError(`Auth code exchange failed: ${(error as Error).message}`);
            return;
          }
        }

        // No authentication method available in non-interactive mode
        setError(
          'Authentication required in non-interactive mode. Please provide either --api-key or --code flag, or set UNHOOK_API_KEY environment variable.',
        );
        if (authUrl) {
          log('Auth URL available for manual copy:', authUrl);
        }
        return;
      }

      // Interactive mode: normal OAuth flow
      try {
        await signIn();
        navigate('/');
      } catch (error) {
        setError(`Authentication failed: ${(error as Error).message}`);
      }
    }

    log('Starting authentication');
    void startAuthentication();
  }, [
    navigate,
    signIn,
    nonInteractive,
    apiKey,
    code,
    authenticateWithApiKey,
    authUrl,
  ]);

  // Render based on current state
  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column" gap={1}>
        {authUrl && (
          <Box flexDirection="column" gap={1}>
            <Box flexDirection="column" gap={1}>
              <Text>Please go to the link to authenticate the Unhook CLI.</Text>
              {nonInteractive ? (
                <Box flexDirection="column" gap={1}>
                  <Text>
                    In non-interactive mode, copy this URL and open it manually:
                  </Text>
                  <Text dimColor underline>
                    {authUrl}
                  </Text>
                </Box>
              ) : (
                <>
                  <Text>
                    If the browser doesn't open automatically, click here:
                  </Text>
                  <Text dimColor underline>
                    {authUrl}
                  </Text>
                  <Box flexDirection="row" gap={1}>
                    <Text>
                      Press Enter to open browser for authentication...
                    </Text>
                    {isBrowserOpened && <Text dimColor>Browser opened</Text>}
                  </Box>
                </>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {error && (
        <Box flexDirection="column" gap={1}>
          <Text color="red">{error}</Text>
          {!nonInteractive && <Text>Press Enter to try again</Text>}
        </Box>
      )}
    </Box>
  );
};
