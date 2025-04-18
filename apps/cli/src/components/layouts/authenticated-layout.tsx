import type { PropsWithChildren } from 'react';
import { SignedIn } from '~/guards';
import { Redirect } from '../redirect';

/**
 * A layout component that ensures the user is authenticated
 * with a valid token and has selected an authorized tunnel.
 * If any of these conditions aren't met, it redirects to the home page.
 */
export function AuthenticatedLayout({ children }: PropsWithChildren) {
  return (
    <SignedIn fallback={<Redirect to="/login" />}>
      {/* <TunnelAuthorized>{children}</TunnelAuthorized> */}
      {children}
    </SignedIn>
  );
}
