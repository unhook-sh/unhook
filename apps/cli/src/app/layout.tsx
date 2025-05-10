import { TRPCReactProvider } from '@unhook/api/client';
import { SubscriptionProvider } from '@unhook/db/supabase/client';

import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import { type FC, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ConnectToWebhook } from '~/components/connect-to-webhook';
import { EventSubscription } from '~/components/event-subscription';
import { Router } from '~/components/router';
import { AuthProvider } from '~/context/auth-context';
import { RouterProvider } from '~/context/router-context';
import { WebhookProvider } from '~/context/webhook-context';
import { env } from '~/env';
import { SignedIn, WebhookAuthorized } from '~/guards';
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
  // const result = api.webhooks.all.useQuery();
  // log('result', result.data);

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
        <WebhookAuthorized>
          <ConnectToWebhook />
          {token && (
            <SubscriptionProvider
              token={token}
              url={env.NEXT_PUBLIC_SUPABASE_URL}
            >
              <EventSubscription />
            </SubscriptionProvider>
          )}
        </WebhookAuthorized>
      </SignedIn>
      <Router />
    </Box>
  );
}

export const Layout: FC = () => {
  const telemetry = useConfigStore.use.telemetry?.() ?? true;
  const webhookId = useConfigStore.use.webhookId();

  return (
    <PostHogOptIn enableTelemetry={telemetry}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <AuthProvider>
          <RouterProvider>
            <PostHogPageView />
            <PostHogIdentifyUser />
            <WebhookProvider initialWebhookId={webhookId}>
              <TRPCReactProvider sourceHeader="cli">
                <AppContent />
              </TRPCReactProvider>
            </WebhookProvider>
          </RouterProvider>
        </AuthProvider>
      </ErrorBoundary>
    </PostHogOptIn>
  );
};
