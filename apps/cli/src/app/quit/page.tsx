import { useApp } from 'ink';
import type { FC } from 'react';
import { useEffect } from 'react';
import type { RouteProps } from '~/stores/router-store';

export const QuitPage: FC<RouteProps> = () => {
  const app = useApp();

  useEffect(() => {
    app.exit();
  }, [app]);

  return null;
};
