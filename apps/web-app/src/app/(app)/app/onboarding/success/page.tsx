'use client';

import { MetricLink } from '@unhook/analytics/components';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { Button } from '@unhook/ui/components/button';
import { cn } from '@unhook/ui/lib/utils';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { env } from '~/env.client';
import { RealTimeEventStream } from '../../_components/webhook-wizzard/real-time-event-stream';
import { WebhookUrlStep } from '../../_components/webhook-wizzard/webhook-url-step';
import { AuthCodeLoginButton } from '../../auth-code/_components/auth-code-login-button';

export default function OnboardingSuccessPage() {
  const searchParams = useSearchParams();
  const orgName = searchParams.get('orgName');
  const webhookName = searchParams.get('webhookName');
  const redirectTo = searchParams.get('redirectTo') || undefined;
  const source = searchParams.get('source') || undefined;
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (!orgName || !webhookName) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Access</CardTitle>
            <CardDescription>
              This page requires valid organization and webhook parameters.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please complete the onboarding process first.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/app/onboarding">Go to Onboarding</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const webhookUrl = `${env.NEXT_PUBLIC_API_URL || 'https://unhook.sh'}/${orgName}/${webhookName}`;

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full relative overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl">
                  🎉 Your webhook is ready!
                </CardTitle>
                <CardDescription>
                  Test your webhook and start receiving events from your
                  services.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <WebhookUrlStep webhookUrl={webhookUrl} />
              </CardContent>
              <CardFooter className="flex justify-end">
                {source ? (
                  <AuthCodeLoginButton
                    disabled={!isSetupComplete}
                    loadingText="Redirecting..."
                    text="Complete Setup"
                  />
                ) : (
                  <Button
                    asChild
                    className={cn(
                      !isSetupComplete &&
                        webhookUrl &&
                        'opacity-50 pointer-events-none w-40',
                    )}
                    disabled={!isSetupComplete && !!webhookUrl}
                    variant="secondary"
                  >
                    <MetricLink
                      href={redirectTo ?? '/app/dashboard'}
                      metric="onboarding_complete_setup_clicked"
                      properties={{
                        destination: redirectTo ?? '/app/dashboard',
                        location: 'onboarding',
                      }}
                    >
                      {!webhookUrl
                        ? 'Go to Dashboard'
                        : isSetupComplete
                          ? 'Complete Setup'
                          : 'Waiting for events...'}
                    </MetricLink>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </motion.div>
          {webhookUrl ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <RealTimeEventStream
                onEventReceived={() => {
                  setIsSetupComplete(true);
                }}
                webhookUrl={webhookUrl}
              />
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Manual Setup Required
                  </CardTitle>
                  <CardDescription>
                    Webhook ID not found. You may need to complete setup
                    manually.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    The webhook was created but some setup information is
                    missing. You can proceed to your dashboard to continue.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="secondary">
                    <MetricLink
                      href={redirectTo ?? '/app/dashboard'}
                      metric="onboarding_manual_setup_clicked"
                      properties={{
                        destination: redirectTo ?? '/app/dashboard',
                        location: 'onboarding',
                      }}
                    >
                      Go to Dashboard
                    </MetricLink>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
