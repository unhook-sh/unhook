import { TRPCReactProvider } from '@unhook/api/client';
import { SubscriptionProvider } from '@unhook/db/supabase/client';
import { debug } from '@unhook/logger';
import { Box, Text, useInput } from 'ink';
import { type FC, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ConnectToTunnel } from '~/components/connect-to-tunnel';
import { RequestSubscription } from '~/components/request-subscription';
import { Router } from '~/components/router';
import { AuthProvider } from '~/context/auth-context';
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
import { type CliState, useCliStore } from '~/stores/cli-store';
import { useConnectionStore } from '~/stores/connection-store';
import { useRouterStore } from '~/stores/router-store';
import { useTunnelStore } from '~/stores/tunnel-store';
import type { PageProps } from '~/types';
import { useRoutes } from './routes';

const log = debug('unhook:cli:layout');

function Fallback({ error }: { error: Error }) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.
  log('An error occurred:', error);
  captureException(error);

  return (
    <Box>
      <Text color="red">Error</Text>
      <Text color="red">{error.message}</Text>
      {/* <Text color="red">{error.stack}</Text> */}
    </Box>
  );
}

function NavigationHandler() {
  const goBack = useRouterStore.use.goBack();
  const canGoBack = useRouterStore.use.canGoBack()();
  const navigate = useRouterStore.use.navigate();

  useInput((input, key) => {
    if (key.escape && canGoBack) {
      goBack();
    }

    // Add global hotkey handlers
    if (input === '?') {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: '?',
          hokeyName: 'Help',
        },
      });

      navigate('/hotkeys');
    }

    if (input === 'h') {
      capture({
        event: 'hotkey_pressed',
        properties: {
          hotkey: 'h',
          hokeyName: 'Help',
        },
      });
      navigate('/help');
    }
  });

  return null;
}

function RouterProvider({ children }: { children: React.ReactNode }) {
  const routes = useRoutes();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const isValidating = useAuthStore.use.isValidatingToken();
  const isTokenValid = useAuthStore.use.isTokenValid();
  const setRoutes = useRouterStore.use.setRoutes();
  const navigate = useRouterStore.use.navigate();

  useEffect(() => {
    setRoutes(routes);
  }, [routes, setRoutes]);

  useEffect(() => {
    log('RouterProvider useEffect', {
      isAuthenticated,
      isTokenValid,
      isValidating,
    });
    if (isValidating) {
      return; // Wait until validation is complete
    }

    if (isAuthenticated && isTokenValid) {
      log('RouterProvider useEffect: authenticated and token valid');
      navigate('/requests');
    } else {
      log('RouterProvider useEffect: not authenticated or token invalid');
      navigate('/');
    }
  }, [isAuthenticated, isTokenValid, isValidating, navigate]);

  return <>{children}</>;
}

function CliConfigProvider({
  port,
  tunnelId,
  clientId,
  redirect,
  debug,
  version,
  ping,
  children,
}: PageProps & { children: React.ReactNode }) {
  const setCliArgs = useCliStore.use.setCliArgs();

  log('CliConfigProvider received args:', {
    port,
    tunnelId,
    clientId,
    redirect,
  });

  useEffect(() => {
    log('Setting CLI args with tunnelId:', tunnelId);
    setCliArgs({
      port,
      tunnelId,
      clientId,
      redirect,
      debug,
      version,
      ping,
    } as Partial<CliState>);
  }, [port, tunnelId, clientId, redirect, debug, version, ping, setCliArgs]);

  return <>{children}</>;
}

function TunnelProvider({
  children,
  initialTunnelId,
}: { children: React.ReactNode; initialTunnelId: string }) {
  const setSelectedTunnelId = useTunnelStore.use.setSelectedTunnelId();
  const tunnelId = useTunnelStore.use.selectedTunnelId();
  const checkTunnelAuth = useTunnelStore.use.checkTunnelAuth();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const isTokenValid = useAuthStore.use.isTokenValid();

  // Set the tunnel ID directly from props
  useEffect(() => {
    log('Setting tunnel ID directly from props:', initialTunnelId);
    if (initialTunnelId && initialTunnelId !== '') {
      setSelectedTunnelId(initialTunnelId);
    }
  }, [initialTunnelId, setSelectedTunnelId]);

  // Then check auth when we have what we need
  useEffect(() => {
    log('TunnelProvider checking auth with', {
      tunnelId,
      isAuthenticated,
      isTokenValid,
    });
    if (tunnelId && isAuthenticated && isTokenValid) {
      log('Effect-based auth check triggered');
      checkTunnelAuth().catch((error) => {
        log('Failed to check tunnel auth:', error);
      });
    }
  }, [tunnelId, isAuthenticated, isTokenValid, checkTunnelAuth]);

  return <>{children}</>;
}

function AppContent() {
  const dimensions = useDimensions();
  const isConnected = useConnectionStore.use.isConnected();
  const connect = useConnectionStore.use.connect();
  const isAuthenticated = useAuthStore.use.isAuthenticated();
  const isTokenValid = useAuthStore.use.isTokenValid();
  const selectedTunnelId = useTunnelStore.use.selectedTunnelId();
  const pingEnabled = useCliStore.use.ping() !== false;
  const token = useAuthStore.use.token();

  useEffect(() => {
    if (
      !isConnected &&
      selectedTunnelId &&
      isAuthenticated &&
      isTokenValid &&
      pingEnabled
    ) {
      connect();
    }
  }, [
    isConnected,
    selectedTunnelId,
    connect,
    isAuthenticated,
    isTokenValid,
    pingEnabled,
  ]);

  useEffect(() => {
    capture({
      event: 'dimensions_changed',
      properties: {
        width: dimensions.width,
        height: dimensions.height,
      },
    });
  }, [dimensions]);

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
          {/* <Connected> */}
          {token && (
            <SubscriptionProvider
              token={token}
              url={env.NEXT_PUBLIC_SUPABASE_URL}
            >
              <RequestSubscription />
            </SubscriptionProvider>
          )}
          {/* </Connected> */}
        </TunnelAuthorized>
      </SignedIn>
      <Router />
    </Box>
  );
}

export const Layout: FC<PageProps> = (props) => {
  return (
    <PostHogOptIn telemetry={props.telemetry}>
      <ErrorBoundary FallbackComponent={Fallback}>
        <AuthProvider>
          <CliConfigProvider {...props}>
            <RouterProvider>
              <PostHogPageView />
              <PostHogIdentifyUser />
              <TunnelProvider initialTunnelId={props.tunnelId}>
                <TRPCReactProvider sourceHeader="cli">
                  <NavigationHandler />
                  <AppContent />
                </TRPCReactProvider>
              </TunnelProvider>
            </RouterProvider>
          </CliConfigProvider>
        </AuthProvider>
      </ErrorBoundary>
    </PostHogOptIn>
  );
};
