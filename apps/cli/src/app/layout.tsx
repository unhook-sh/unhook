import { hostname, platform, release } from 'node:os';
import { Box, Text, measureElement, useInput } from 'ink';
import { type FC, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Ascii } from '~/components/ascii';
import { ConnectionStatus } from '~/components/connection-status';
import { useDimensions } from '~/hooks/use-dimensions';
import { RouteRenderer, RouterProvider, useRouter } from '~/lib/router';
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

function NavigationHandler() {
  const { goBack, canGoBack } = useRouter<AppRoutePath>();

  useInput((input, key) => {
    if (key.escape && canGoBack) {
      goBack();
    }
  });

  return null;
}

export const Layout: FC<PageProps> = ({ port, clientId, version }) => {
  const dimensions = useDimensions();

  const ref = useRef(null);
  const [width, setWidth] = useState(dimensions.width);
  const [height, setHeight] = useState(dimensions.height);

  useEffect(() => {
    if (ref.current) {
      const { width, height } = measureElement(ref.current);
      setWidth(width);
      setHeight(height);
    }
  }, []);

  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <SelectionStoreProvider>
        <RouterProvider<AppRoutePath> routes={routes}>
          <NavigationHandler />
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
        </RouterProvider>
      </SelectionStoreProvider>
    </ErrorBoundary>
  );
};
