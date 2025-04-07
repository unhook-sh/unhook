import { hostname, platform, release } from 'node:os';
import { TRPCReactProvider } from '@acme/api/client';
import { Box, Text, useInput } from 'ink';
import { type FC, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Ascii } from '~/components/ascii';
import { ConnectionStatus } from '~/components/connection-status';
import { RequestSubscription } from '~/components/request-subscription';
import { useDimensions } from '~/hooks/use-dimensions';
import { useAuthStore } from '~/lib/auth/store';
import { useCliStore } from '~/lib/cli-store';
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
  const { goBack, canGoBack } = useRouter<AppRoutePath>();

  useInput((_, key) => {
    if (key.escape && canGoBack) {
      goBack();
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

function CliArgsProvider({
  port,
  apiKey,
  clientId,
  debug,
  version,
  children,
}: PageProps & { children: React.ReactNode }) {
  const setCliArgs = useCliStore.use.setCliArgs();
  const fetchTunnelByApiKey = useTunnelStore.use.fetchTunnelByApiKey();

  useEffect(() => {
    setCliArgs({ port, apiKey, clientId, debug, version });
  }, [port, apiKey, clientId, debug, version, setCliArgs]);

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
  const clientId = useCliStore.use.clientId();
  const isConnected = useConnectionStore.use.isConnected();
  const connect = useConnectionStore.use.connect();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();
  const apiKey = useCliStore.use.apiKey();

  useEffect(() => {
    if (!isConnected && selectedTunnelId && isAuthenticated) {
      connect();
    }
  }, [isConnected, selectedTunnelId, connect, isAuthenticated]);

  return (
    <Box padding={1} flexDirection="column" minHeight={dimensions.height}>
      <Box marginBottom={1}>
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
        <Text dimColor>
          Platform: {platform()} {release()}
        </Text>
        <Text dimColor>Hostname: {hostname()}</Text>
      </Box>
      <Box marginBottom={1}>
        <ConnectionStatus />
      </Box>

      <RouteRenderer />
    </Box>
  );
}

export const Layout: FC<PageProps> = (props) => {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Router>
        <CliArgsProvider {...props}>
          <TRPCReactProvider sourceHeader="cli">
            <NavigationHandler />
            <RequestSubscription />
            <AppContent />
          </TRPCReactProvider>
        </CliArgsProvider>
      </Router>
    </ErrorBoundary>
  );
};
