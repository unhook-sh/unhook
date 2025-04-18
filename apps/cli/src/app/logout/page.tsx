import { useEffect } from 'react';
import type { FC } from 'react';
import { useAuth } from '~/hooks/use-auth';
import { useRouterStore } from '~/stores/router-store';
import type { RouteProps } from '~/stores/router-store';

export const LogoutPage: FC<RouteProps> = () => {
  const { logout } = useAuth();
  const navigate = useRouterStore.use.navigate();

  useEffect(() => {
    void logout();
    navigate('/');
  }, [logout, navigate]);

  return null;
};
