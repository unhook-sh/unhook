'use client';

import { Button } from '@unhook/ui/button';
import { Icons } from '@unhook/ui/custom/icons';
import { useAction } from 'next-safe-action/hooks';
import posthog from 'posthog-js';
import { useCallback, useState } from 'react';
import { createAuthCode } from '../actions';

export function AuthCodeLoginButton({
  disabled,
  loadingText,
  text,
}: {
  disabled?: boolean;
  loadingText?: string;
  text?: string;
}) {
  const [error, setError] = useState<string>();

  const { executeAsync, status } = useAction(createAuthCode);
  const isPending = status === 'executing';
  // const hasSucceeded = status === 'hasSucceeded';

  const onLogin = useCallback(async () => {
    try {
      setError(undefined);
      posthog.capture('auth_code_login_started');
      const result = await executeAsync();

      if (!result?.data) {
        setError('Failed to generate token');
        posthog?.capture('auth_code_login_failed', {
          error: 'no_token_generated',
        });
        return;
      }

      const currentUrl = new URL(window.location.href);
      const redirectUri = currentUrl.searchParams.get('redirectTo');
      const source = currentUrl.searchParams.get('source');

      if (source === 'extension' && redirectUri) {
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

      posthog.capture('auth_code_login_success', {
        hasCsrfToken: !!currentUrl.searchParams.get('csrf'),
        isVSCode: !!redirectUri,
        port: currentUrl.searchParams.get('port'),
      });
    } catch (error) {
      console.error('Failed to generate token:', error);
      setError('Failed to authenticate. Please try again.');
      posthog?.captureException(error);
    }
  }, [executeAsync]);

  return (
    <div className="flex flex-col gap-2">
      {!error && (
        <Button autoFocus disabled={isPending || disabled} onClick={onLogin}>
          {isPending ? (
            <>
              <Icons.Spinner className="mr-2" size="sm" variant="muted" />
              {loadingText}
            </>
          ) : (
            <>
              {/* <Icons.LogIn className="mr-2" size="sm" /> */}
              {text ?? 'Grant Access'}
            </>
          )}
        </Button>
      )}
      {/* <span className="text-sm text-muted-foreground">
        This will generate a secure token valid for 30 days.
      </span> */}
      {error && (
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={onLogin} variant="destructive">
            <Icons.ArrowRight className="mr-2" size="sm" />
            Try Again
          </Button>
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}
      {/* {isPending && (
        <span className="text-sm text-muted-foreground animate-in fade-in">
          You'll be redirected back shortly...
        </span>
      )} */}
      {/* {hasSucceeded && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Icons.CheckCircle2 size="sm" />
            Login successful!
          </div>
        </div>
      )} */}
    </div>
  );
}
