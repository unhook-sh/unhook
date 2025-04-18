import { debug } from '@unhook/logger';
import { type PropsWithChildren, useEffect } from 'react';
import { useAuthStore } from '~/stores/auth-store';

const log = debug('unhook:cli:auth-context');

export function AuthProvider({ children }: PropsWithChildren) {
  const validateToken = useAuthStore.use.validateToken();

  useEffect(() => {
    // Run validation when the component mounts or token changes
    validateToken().catch(log);
  }, [validateToken]);

  return <>{children}</>;
}
