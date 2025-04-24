import { debug } from '@unhook/logger';
import { useInput } from 'ink';
import { type FC, useEffect } from 'react';
import { useRoutes } from '~/app/routes';
import { capture } from '~/lib/posthog';
import { useAuthStore } from '~/stores/auth-store';
import { useRouterStore } from '~/stores/router-store';

const log = debug('unhook:cli:router-context');

interface RouterProviderProps {
  children: React.ReactNode;
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

export const RouterProvider: FC<RouterProviderProps> = ({ children }) => {
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
      navigate('/events');
    } else {
      log('RouterProvider useEffect: not authenticated or token invalid');
      navigate('/');
    }
  }, [isAuthenticated, isTokenValid, isValidating, navigate]);

  return (
    <>
      <NavigationHandler />
      {children}
    </>
  );
};
