import {} from 'node:os';
import { TRPCReactProvider } from '@unhook/api/client';
import { Box, Text, useInput } from 'ink';
import { type FC, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { RequestSubscription } from '~/components/request-subscription';
import { useDimensions } from '~/hooks/use-dimensions';
import { useAuthStore } from '~/lib/auth/store';
import { type CliState, useCliStore } from '~/lib/cli-store';
import { useConnectionStore } from '~/lib/connection-store';
import { RouteRenderer, RouterProvider, useRouter } from '~/lib/router';
import { useTunnelStore } from '~/lib/tunnel-store';
import type { PageProps } from '~/types';
import type { AppRoutePath } from './routes';
import { useRoutes } from './routes';

function Fallback({ error }: { error: Error }) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.
  console.error('An error occurred:', error);
  return (
    <Box>
      <Text color="red">Error</Text>
      <Text color="red">{error.message}</Text>
    </Box>
  );
}

function NavigationHandler() {
  const { goBack, canGoBack, navigate } = useRouter<AppRoutePath>();

  useInput((input, key) => {
    if (key.escape && canGoBack) {
      goBack();
    }

    // Add global hotkey handlers
    if (input === '?') {
      navigate('/hotkeys');
    }

    if (input === 'h') {
      navigate('/help');
    }
  });

  return null;
}

function Router({ children }: { children: React.ReactNode }) {
  const routes = useRoutes();
  const isAuthenticated = useAuthStore.use.isAuthenticated();

  return (
    <RouterProvider<AppRoutePath>
      routes={routes}
      initialPath={isAuthenticated ? '/requests' : '/'}
      initialHistory={isAuthenticated ? ['/'] : []}
    >
      {children}
    </RouterProvider>
  );
}

function AppConfigProvider({
  port,
  apiKey,
  clientId,
  redirect,
  debug,
  version,
  ping,
  children,
}: PageProps & { children: React.ReactNode }) {
  const setCliArgs = useCliStore.use.setCliArgs();
  const fetchTunnelByApiKey = useTunnelStore.use.fetchTunnelByApiKey();

  useEffect(() => {
    setCliArgs({
      port,
      apiKey,
      clientId,
      redirect,
      debug,
      version,
      ping,
    } as Partial<CliState>);
  }, [port, apiKey, clientId, redirect, debug, version, ping, setCliArgs]);

  useEffect(() => {
    if (apiKey) {
      fetchTunnelByApiKey(apiKey).catch((error) => {
        console.error('Failed to fetch tunnel:', error);
      });
    }
  }, [apiKey, fetchTunnelByApiKey]);

  return <>{children}</>;
}

function AppContent() {
  const dimensions = useDimensions();
  const _clientId = useCliStore.use.clientId();
  const isConnected = useConnectionStore.use.isConnected();
  const connect = useConnectionStore.use.connect();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();
  const _apiKey = useCliStore.use.apiKey();
  const pingEnabled = useCliStore.use.ping() !== false;

  useEffect(() => {
    if (!isConnected && selectedTunnelId && isAuthenticated && pingEnabled) {
      connect();
    }
  }, [isConnected, selectedTunnelId, connect, isAuthenticated, pingEnabled]);

  const _webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/${selectedTunnelId}`;

  return (
    <Box
      padding={1}
      flexDirection="column"
      // HACK to fix flickering https://github.com/vadimdemedes/ink/issues/450#issuecomment-1836274483
      minHeight={dimensions.height}
      // height={dimensions.height}
    >
      {/* <Box marginBottom={1}>
        <Ascii
          text="Unhook"
          width={dimensions.width}
          font="ANSI Shadow"
          color="gray"
        />
      </Box>
      <Box marginBottom={1} flexDirection="column">
        <Text dimColor>Client: {clientId}</Text>
        <Text dimColor>Tunnel: {selectedTunnelId}</Text>
        <Text dimColor>Api Key: {apiKey}</Text>
        <Text dimColor>Webhook URL: {webhookUrl}</Text>
        <Text dimColor>
          Platform: {platform()} {release()}
        </Text>
        <Text dimColor>Hostname: {hostname()}</Text>
      </Box>
      <Box marginBottom={1}>
        <ConnectionStatus />
      </Box> */}

      <RouteRenderer />

      {/* {currentPath !== '/hotkeys' && (
        <Box marginTop={1}>
          <Text dimColor>
            Press <Text color="cyan">?</Text> for keyboard shortcuts
          </Text>
        </Box>
      )} */}
    </Box>
  );
}

export const Layout: FC<PageProps> = (props) => {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Router>
        <AppConfigProvider {...props}>
          <TRPCReactProvider sourceHeader="cli">
            <NavigationHandler />
            <RequestSubscription />
            <AppContent />
          </TRPCReactProvider>
        </AppConfigProvider>
      </Router>
    </ErrorBoundary>
  );
};
