'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { MetricLink } from '@unhook/analytics/components';
import { Button } from '@unhook/ui/components/button';
import { cn } from '@unhook/ui/lib/utils';
import { useEffect, useState } from 'react';
import { WebhookWizard } from '../../_components/webhook-wizzard/wizzard';
import { AuthCodeLoginButton } from '../../auth-code/_components/auth-code-login-button';
import { LoadingLogo } from './loading-logo';

export function SetActiveAndRedirect(props: {
  redirectTo?: string;
  source?: string;
}) {
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  });
  const [isFinished, setIsFinished] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    (async () => {
      if (isFinished) return;

      if (!userMemberships || userMemberships.count === 0) {
        console.log('No organization found');
        return null;
      }

      const firstOrganization = userMemberships.data?.[0];

      if (!firstOrganization) {
        console.log('No organization found');
        return null;
      }

      console.log(
        'Setting active organization',
        firstOrganization.organization.id,
      );
      await setActive?.({ organization: firstOrganization.organization.id });

      setIsFinished(true);
    })();
  }, [
    setActive,
    userMemberships.data,
    userMemberships.count,
    userMemberships,
    isFinished,
  ]);

  return (
    <main className="container grid h-full place-items-center mx-auto max-w-xl">
      {!isFinished && <LoadingLogo />}
      {isFinished && (
        <WebhookWizard
          footer={
            <>
              {props.source && (
                <AuthCodeLoginButton
                  disabled={!isSetupComplete}
                  loadingText="Redirecting..."
                  text="Complete Setup"
                />
              )}
              {!props.source && (
                <Button
                  asChild
                  className={cn(
                    !isSetupComplete && 'opacity-50 pointer-events-none w-40',
                  )}
                  disabled={!isSetupComplete}
                  variant="secondary"
                >
                  <MetricLink
                    href={props.redirectTo ?? '/app/dashboard'}
                    metric="onboarding_complete_setup_clicked"
                    properties={{
                      destination: props.redirectTo ?? '/app/dashboard',
                      location: 'onboarding',
                    }}
                  >
                    {isSetupComplete
                      ? 'Complete Setup'
                      : 'Waiting for events...'}
                  </MetricLink>
                </Button>
              )}
            </>
          }
          onSetupComplete={setIsSetupComplete}
          showInstallationTabs={false}
        />
      )}
    </main>
  );
}
