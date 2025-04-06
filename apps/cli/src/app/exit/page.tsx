import { useApp } from 'ink';
import { useEffect } from 'react';
import type { FC } from 'react';
import type { RouteProps } from '~/lib/router';

export const ExitPage: FC<RouteProps> = () => {
  const app = useApp();

  useEffect(() => {
    app.exit();
  }, [app]);

  return null;
};
