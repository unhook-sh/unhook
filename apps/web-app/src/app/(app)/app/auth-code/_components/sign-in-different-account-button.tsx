'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import { MetricButton } from '@unhook/analytics/components';
import { useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

export function SignInDifferentAccountButton() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const currentQueryString = searchParams.toString();
  const redirectUrl = `/app/auth-code${
    currentQueryString ? `?${currentQueryString}` : ''
  }`;

  return (
    <MetricButton
      className="w-fit"
      metric="auth_code_sign_in_different_account_clicked"
      onClick={() => {
        // Track user sign out event
        if (user) {
          posthog.capture('user_signed_out', {
            source: 'auth_code_different_account',
            user_id: user.id,
            email: user.emailAddresses[0]?.emailAddress,
          });
        }
        signOut({
          redirectUrl,
        });
      }}
      variant="link"
    >
      Sign in with different account
    </MetricButton>
  );
}
