import { Text } from 'ink';
import type { FC } from 'react';
import { matchRoute, useRouterStore } from '~/stores/router-store';

// Route rendering component
export const Router: FC = () => {
  const currentPath = useRouterStore.use.currentPath();
  const routes = useRouterStore.use.routes();
  const { route: matchedRoute, params } = matchRoute(currentPath, routes);

  if (routes.length === 0) {
    return null;
  }

  if (!matchedRoute?.component) {
    return (
      <Text color="red">
        404: Page not found {currentPath} {JSON.stringify(routes)}
        {JSON.stringify(params)}
      </Text>
    );
  }

  const CurrentComponent = matchedRoute.component;
  return <CurrentComponent params={params} />;
};
