import { hostname, platform, release } from 'node:os';
import { Box, Text, useInput } from 'ink';
import { type FC, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Ascii } from '~/components/ascii';
import { ConnectionStatus } from '~/components/connection-status';
import { RequestSubscription } from '~/components/request-subscription';
import { useDimensions } from '~/hooks/use-dimensions';
import { AuthStoreProvider } from '~/lib/auth';
import { RouteRenderer, RouterProvider, useRouter } from '~/lib/router';
import { SelectionStoreProvider } from '~/lib/store';
import type { PageProps } from '~/types';
import type { AppRoutePath } from './routes';
import { useRoutes } from './routes';

function Fallback({
  error,
}: {
  error: Error;
}) {
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
    <RouterProvider<AppRoutePath> routes={routes}>{children}</RouterProvider>
  );
}

export const Layout: FC<PageProps> = ({ port, clientId, version }) => {
  const dimensions = useDimensions();
  const ref = useRef(null);

  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <AuthStoreProvider>
        <SelectionStoreProvider>
          <Router>
            <NavigationHandler />
            <RequestSubscription />
            <Box ref={ref} padding={1} flexDirection="column">
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
          </Router>
        </SelectionStoreProvider>
      </AuthStoreProvider>
    </ErrorBoundary>
  );
};
