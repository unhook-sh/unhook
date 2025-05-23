'use client';

import { usePostHog } from '@unhook/analytics/posthog/client';
import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import { useAction } from 'next-safe-action/hooks';
import { useCallback, useState } from 'react';
import { createAuthCode } from '../actions';

export function CliLoginButton() {
  const [error, setError] = useState<string>();
  const posthog = usePostHog();

  const { executeAsync, status } = useAction(createAuthCode);
  const isPending = status === 'executing';

  const onLogin = useCallback(async () => {
    try {
      setError(undefined);
      posthog?.capture('cli_login_started');
      const result = await executeAsync();

      if (!result?.data) {
        setError('Failed to generate token');
        posthog?.capture('cli_login_failed', {
          error: 'no_token_generated',
        });
        return;
      }

      const currentUrl = new URL(window.location.href);
      const port = currentUrl.searchParams.get('port');
      const csrfToken = currentUrl.searchParams.get('csrf');

      // Get the redirect URL from search params, defaulting to current URL if not provided
      const redirectUrl = new URL(`http://localhost:${port ?? 54321}`);

      // Add the token to the redirect URL
      redirectUrl.searchParams.set('code', result.data.authCode.id);
      redirectUrl.searchParams.set('csrf', csrfToken || '');

      posthog?.capture('cli_login_success', {
        port,
        hasCsrfToken: !!csrfToken,
      });

      // If we have a redirect URL in the search params, redirect to it
      window.location.href = redirectUrl.href;
      return;
    } catch (error) {
      console.error('Failed to generate token:', error);
      setError('Failed to authenticate. Please try again.');
      posthog?.captureException(error);
    }
  }, [executeAsync, posthog]);

  return (
    <div className="flex flex-col gap-2">
      {!error && (
        <Button onClick={onLogin} disabled={isPending} autoFocus>
          {isPending ? (
            <>
              <Icons.Spinner size="sm" variant="muted" className="mr-2" />
              Authenticating...
            </>
          ) : (
            <>
              <Icons.LogIn size="sm" className="mr-2" />
              Login to CLI
            </>
          )}
        </Button>
      )}
      <span className="text-sm text-muted-foreground">
        This will generate a secure token valid for 30 days.
      </span>
      {error && (
        <div className="flex flex-col gap-2">
          <Button onClick={onLogin} variant="destructive" className="w-full">
            <Icons.ArrowRight size="sm" className="mr-2" />
            Try Again
          </Button>
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}
      {isPending && (
        <span className="text-sm text-muted-foreground animate-in fade-in">
          You'll be redirected back to the CLI shortly...
        </span>
      )}
    </div>
  );
}
