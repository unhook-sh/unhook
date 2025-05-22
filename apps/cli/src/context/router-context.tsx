import { useInput } from 'ink';
import { type FC, useEffect } from 'react';
import { useRoutes } from '~/app/routes';
import { useRouterStore } from '~/stores/router-store';

interface RouterProviderProps {
  children: React.ReactNode;
}

function NavigationHandler() {
  const goBack = useRouterStore.use.goBack();
  const canGoBack = useRouterStore.use.canGoBack()();
  useInput((_, key) => {
    if (key.escape && canGoBack) {
      goBack();
    }

    // Add global hotkey handlers
    // if (input === '?') {
    //   capture({
    //     event: 'hotkey_pressed',
    //     properties: {
    //       hotkey: '?',
    //       hokeyName: 'Help',
    //     },
    //   });

    //   navigate('/hotkeys');
    // }

    // if (input === 'h') {
    //   capture({
    //     event: 'hotkey_pressed',
    //     properties: {
    //       hotkey: 'h',
    //       hokeyName: 'Help',
    //     },
    //   });
    //   navigate('/help');
    // }
  });

  return null;
}

export const RouterProvider: FC<RouterProviderProps> = ({ children }) => {
  const routes = useRoutes();
  const setRoutes = useRouterStore.use.setRoutes();

  useEffect(() => {
    setRoutes(routes);
  }, [routes, setRoutes]);

  return (
    <>
      <NavigationHandler />
      {children}
    </>
  );
};
