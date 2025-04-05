import { hostname, platform, release } from 'node:os';
import { Box, Text } from 'ink';
import type { FC } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useDimensions } from '~/hooks/use-dimensions';
import { RouteRenderer, RouterProvider } from '~/lib/router';
import { SelectionStoreProvider } from '~/lib/store';
import type { PageProps } from '~/types';
import type { AppRoutePath } from './routes';
import { routes } from './routes';

function Fallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
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

export const Layout: FC<PageProps> = ({ port, clientId }) => {
  const dimensions = useDimensions();

  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <SelectionStoreProvider>
        <RouterProvider<AppRoutePath> routes={routes}>
          <Box
            flexDirection="column"
            padding={1}
            height={dimensions.rows}
            width={dimensions.columns}
          >
            <Box marginBottom={1}>
              <Text color="cyan">▲ Tunnel CLI</Text>
            </Box>

            <Box marginBottom={1}>
              <Text>
                <Text color="green">✓</Text> Connected to port {port}
              </Text>
            </Box>

            <RouteRenderer />

            <Box marginTop={1} flexDirection="column">
              <Text dimColor>Client ID: {clientId}</Text>
              <Text dimColor>
                Platform: {platform()} {release()}
              </Text>
              <Text dimColor>Hostname: {hostname()}</Text>
            </Box>
          </Box>
        </RouterProvider>
      </SelectionStoreProvider>
    </ErrorBoundary>
  );
};
