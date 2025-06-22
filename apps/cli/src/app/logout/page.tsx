import type { FC } from 'react';
import { useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';
import type { RouteProps } from '~/stores/router-store';
import { useRouterStore } from '~/stores/router-store';
export const LogoutPage: FC<RouteProps> = () => {
  const logout = useAuthStore.use.logout();
  const navigate = useRouterStore.use.navigate();

  useEffect(() => {
    void logout();
    navigate('/');
  }, [logout, navigate]);

  return null;
};
