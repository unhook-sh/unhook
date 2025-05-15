import { useEffect } from 'react';
import { SignedOut } from '~/guards';
import { useAuthStore } from '~/stores/auth-store';
import type { RouteProps } from '~/stores/router-store';
import { useRouterStore } from '~/stores/router-store';
import { LoginPage } from './page';

export function LoginLayout(props: RouteProps) {
  const isSignedIn = useAuthStore.use.isSignedIn();
  const isValidatingSession = useAuthStore.use.isValidatingSession();
  const navigate = useRouterStore.use.navigate();

  useEffect(() => {
    if (isSignedIn && !isValidatingSession) {
      navigate('/');
    }
  }, [isSignedIn, navigate, isValidatingSession]);

  return (
    <SignedOut>
      <LoginPage {...props} />
    </SignedOut>
  );
}
