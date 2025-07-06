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
      const redirectUri = currentUrl.searchParams.get('redirect_uri');

      if (redirectUri) {
        // Handle VS Code OAuth flow
        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.set('code', result.data.authCode.id);
        window.location.href = redirectUrl.href;
      } else {
        // Handle CLI flow
        const port = currentUrl.searchParams.get('port');
        const csrfToken = currentUrl.searchParams.get('csrf');
        const redirectUrl = new URL(`http://localhost:${port ?? 54321}`);
        redirectUrl.searchParams.set('code', result.data.authCode.id);
        redirectUrl.searchParams.set('csrf', csrfToken || '');
        window.location.href = redirectUrl.href;
      }

      posthog?.capture('cli_login_success', {
        isVSCode: !!redirectUri,
        port: currentUrl.searchParams.get('port'),
        hasCsrfToken: !!currentUrl.searchParams.get('csrf'),
      });
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
              Grant Access
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
          You'll be redirected back shortly...
        </span>
      )}
    </div>
  );
}
