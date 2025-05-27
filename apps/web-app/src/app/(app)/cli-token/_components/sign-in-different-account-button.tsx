'use client';

import { useClerk } from '@clerk/nextjs';
import { Button } from '@unhook/ui/button';
import { useSearchParams } from 'next/navigation';

export function SignInDifferentAccountButton() {
  const { signOut } = useClerk();
  const searchParams = useSearchParams();
  const currentQueryString = searchParams.toString();
  const redirectUrl = `/cli-token${
    currentQueryString ? `?${currentQueryString}` : ''
  }`;

  return (
    <Button
      variant="link"
      onClick={() =>
        signOut({
          redirectUrl,
        })
      }
      className="w-fit"
    >
      Sign in with different account
    </Button>
  );
}
