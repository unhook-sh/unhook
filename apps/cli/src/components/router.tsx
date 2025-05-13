import { debug } from '@unhook/logger';
import { Text } from 'ink';
import type { FC } from 'react';
import { matchRoute, useRouterStore } from '~/stores/router-store';

const log = debug('unhook:cli:router');

// Route rendering component
export const Router: FC = () => {
  const currentPath = useRouterStore.use.currentPath();
  const routes = useRouterStore.use.routes();
  const history = useRouterStore.use.history();
  const { route: matchedRoute, params } = matchRoute(currentPath, routes);

  if (routes.length === 0) {
    log('No routes', {
      currentPath,
      routes,
      history,
      params,
    });
    return null;
  }

  if (!matchedRoute?.component) {
    log('404: Page not found', {
      matchedRoute,
      currentPath,
      routes,
      history,
      params,
    });
    return <Text color="red">404: Page not found {currentPath}</Text>;
  }

  const CurrentComponent = matchedRoute.component;
  return <CurrentComponent params={params} />;
};
