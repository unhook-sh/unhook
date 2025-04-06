import { useEffect } from 'react';
import type { FC } from 'react';
import { useAuth } from '~/lib/auth';
import { useRouter } from '~/lib/router';
import type { RouteProps } from '~/lib/router';
import type { AppRoutePath } from '../routes';

export const LogoutPage: FC<RouteProps> = () => {
  const { logout } = useAuth();
  const { navigate } = useRouter<AppRoutePath>();

  useEffect(() => {
    void logout();
    navigate('/');
  }, [logout, navigate]);

  return null;
};
