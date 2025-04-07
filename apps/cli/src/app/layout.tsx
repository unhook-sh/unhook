import { hostname, platform, release } from 'node:os';
import { Box, Text, useInput } from 'ink';
import { type FC, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Ascii } from '~/components/ascii';
import { ConnectionStatus } from '~/components/connection-status';
import { RequestSubscription } from '~/components/request-subscription';
import { useDimensions } from '~/hooks/use-dimensions';
import { useCliStore } from '~/lib/cli-store';
import { RouteRenderer, RouterProvider, useRouter } from '~/lib/router';
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

  return (
    <RouterProvider<AppRoutePath>
      routes={routes}
      initialPath="/requests"
      initialHistory={['/']} // This is how we can hit go back to the menu after requests are already there
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

  useEffect(() => {
    setCliArgs({ port, apiKey, clientId, debug, version });
  }, [port, apiKey, clientId, debug, version, setCliArgs]);

  return <>{children}</>;
}

function AppContent() {
  const dimensions = useDimensions();
  const clientId = useCliStore.use.clientId();
  const port = useCliStore.use.port();

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
        <Text dimColor>Client ID: {clientId}</Text>
        <Text dimColor>
          Platform: {platform()} {release()}
        </Text>
        <Text dimColor>Hostname: {hostname()}</Text>
      </Box>
      <Box marginBottom={1}>
        <ConnectionStatus port={port} />
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
          <NavigationHandler />
          <RequestSubscription />
          <AppContent />
        </CliArgsProvider>
      </Router>
    </ErrorBoundary>
  );
};
