import { TRPCReactProvider } from '@unhook/api/client';
import { SubscriptionProvider } from '@unhook/db/supabase/client';
import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import { type FC, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ConnectToTunnel } from '~/components/connect-to-tunnel';
import { EventSubscription } from '~/components/event-subscription';
import { Router } from '~/components/router';
import { AuthProvider } from '~/context/auth-context';
import { RouterProvider } from '~/context/router-context';
import { TunnelProvider } from '~/context/tunnel-context';
import { env } from '~/env';
import { SignedIn, TunnelAuthorized } from '~/guards';
import { useDimensions } from '~/hooks/use-dimensions';
import {
  PostHogIdentifyUser,
  PostHogOptIn,
  PostHogPageView,
  capture,
  captureException,
} from '~/lib/posthog';
import { useAuthStore } from '~/stores/auth-store';
import { useConfigStore } from '~/stores/config-store';
const log = debug('unhook:cli:layout');

function ErrorFallback({ error }: { error: Error }) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.
  log('An error occurred:', error);
  captureException(error);

  return (
    <Box>
      <Text color="red">Error</Text>
      <Text color="red">{error.message}</Text>
    </Box>
  );
}

function AppContent() {
  const dimensions = useDimensions();
  const token = useAuthStore.use.token();
  const isValidating = useAuthStore.use.isValidatingSession();

  useEffect(() => {
    capture({
      event: 'dimensions_changed',
      properties: {
        width: dimensions.width,
        height: dimensions.height,
      },
    });
  }, [dimensions]);

  if (isValidating) {
    return (
      <Box>
        <Text>Validating session...</Text>
      </Box>
    );
  }

  return (
    <Box
      padding={1}
      flexDirection="column"
      // HACK to fix flickering https://github.com/vadimdemedes/ink/issues/450#issuecomment-1836274483
      minHeight={dimensions.height}
    >
      <SignedIn>
        <TunnelAuthorized>
          <ConnectToTunnel />
          {token && (
            <SubscriptionProvider
              token={token}
              url={env.NEXT_PUBLIC_SUPABASE_URL}
            >
              <EventSubscription />
            </SubscriptionProvider>
          )}
        </TunnelAuthorized>
      </SignedIn>
      <Router />
    </Box>
  );
}

export const Layout: FC = () => {
  const telemetry = useConfigStore.use.telemetry?.() ?? true;
  const tunnelId = useConfigStore.use.tunnelId();

  return (
    <PostHogOptIn enableTelemetry={telemetry}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <AuthProvider>
          <RouterProvider>
            <PostHogPageView />
            <PostHogIdentifyUser />
            <TunnelProvider initialTunnelId={tunnelId}>
              <TRPCReactProvider sourceHeader="cli">
                <AppContent />
              </TRPCReactProvider>
            </TunnelProvider>
          </RouterProvider>
        </AuthProvider>
      </ErrorBoundary>
    </PostHogOptIn>
  );
};
