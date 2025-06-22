import { TRPCReactProvider } from '@unhook/api/react';

import { debug } from '@unhook/logger';
import { Box, Text } from 'ink';
import { type FC, useEffect, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Ascii } from '~/components/ascii';
import { ConnectToWebhook } from '~/components/connect-to-webhook';
import { EventSubscription } from '~/components/event-subscription';
import { Router } from '~/components/router';
import { AuthProvider } from '~/context/auth-context';
import { RouterProvider } from '~/context/router-context';
import { WebhookProvider } from '~/context/webhook-context';
import {
  SignedIn,
  WebhookAuthorized,
  WebhookChecking,
  WebhookUnauthorized,
} from '~/guards';
import { useDimensions } from '~/hooks/use-dimensions';
import {
  capture,
  captureException,
  PostHogIdentifyUser,
  PostHogOptIn,
  PostHogPageView,
} from '~/lib/posthog';
import { useAuthStore } from '~/stores/auth-store';
import { useCliStore } from '~/stores/cli-store';
import { useConfigStore } from '~/stores/config-store';
import { useRouterStore } from '~/stores/router-store';

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
  const token = useAuthStore.use.authToken();
  const isValidating = useAuthStore.use.isValidatingSession();
  const webhookId = useConfigStore.use.webhookId();
  const navigate = useRouterStore.use.navigate();
  const command = useCliStore.use.command?.();
  const currentPath = useRouterStore.use.currentPath();
  const hasNavigatedToCommand = useRef(false);

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
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Ascii
            text="Unhook"
            width={dimensions.width}
            font="ANSI Shadow"
            color="gray"
          />
        </Box>
        <Text>Validating session...</Text>
      </Box>
    );
  }

  if (!webhookId && currentPath !== '/init' && currentPath !== '/login') {
    log('No webhook ID, navigating to /init');
    navigate('/init', { resetHistory: true });
  } else if (
    command &&
    currentPath !== command &&
    currentPath !== '/login' &&
    !hasNavigatedToCommand.current
  ) {
    log('Navigating to command:', command);
    hasNavigatedToCommand.current = true;
    navigate(command, { resetHistory: true });
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
            <Box flexDirection="column" gap={1}>
              <EventSubscription />
            </Box>
          )}
        </WebhookAuthorized>
        <WebhookUnauthorized>
          <Text>You are not authorized to use this webhook.</Text>
        </WebhookUnauthorized>
        <WebhookChecking>
          <Text>Verifying webhook...</Text>
        </WebhookChecking>
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
