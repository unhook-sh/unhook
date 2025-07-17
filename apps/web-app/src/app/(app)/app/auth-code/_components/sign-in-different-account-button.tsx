'use client';

import { useClerk } from '@clerk/nextjs';
import { Button } from '@unhook/ui/button';
import { useSearchParams } from 'next/navigation';

export function SignInDifferentAccountButton() {
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const currentQueryString = searchParams.toString();
  const redirectUrl = `/app/auth-code${
    currentQueryString ? `?${currentQueryString}` : ''
  }`;

  return (
    <Button
      className="w-fit"
      onClick={() =>
        signOut({
          redirectUrl,
        })
      }
      variant="link"
    >
      Sign in with different account
    </Button>
  );
}
