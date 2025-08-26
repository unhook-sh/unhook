'use client';

import { useOrganization } from '@clerk/nextjs';
import { api } from '@unhook/api/react';
import type { AuthCodeType, WebhookType } from '@unhook/db/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { toast } from '@unhook/ui/sonner';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { createAuthCode } from '~/app/(app)/app/auth-code/actions';
import { env } from '~/env.client';
import { InstallationTabs } from './installation-tabs';
import { RealTimeEventStream } from './real-time-event-stream';
import { SourceStep } from './source-step';
import { WebhookUrlStep } from './webhook-url-step';

const STEP_TITLE = 'Welcome to Unhook';
const STEP_DESCRIPTION =
  'Your webhook URL is ready! Use it to receive webhooks locally.';

export function WebhookWizard({
  footer,
  showInstallationTabs,
  onSetupComplete,
}: {
  footer?: React.ReactNode;
  showInstallationTabs?: boolean;
  onSetupComplete?: (isComplete: boolean) => void;
}) {
  const [source, setSource] = useState('');
  const [webhook, setWebhook] = useState<WebhookType | null>(null);
  const [authCode, setAuthCode] = useState<AuthCodeType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { organization } = useOrganization();

  const { executeAsync: executeCreateAuthCode, isPending: isCreatingAuthCode } =
    useAction(createAuthCode);
  const { data: webhooks } = api.webhooks.all.useQuery();

  // Initialization effect: runs when organization and webhooks are available
  useEffect(() => {
    if (!organization || !webhooks || webhook || authCode) return;
    const firstWebhook = webhooks[0];
    if (!firstWebhook) return;

    setIsLoading(true);
    setWebhook(firstWebhook);
    executeCreateAuthCode()
      .then((authResult) => {
        if (!authResult?.data) {
          console.error('Failed to create auth code');
          toast.error('Failed to create auth code', {
            description: 'Please try again.',
          });
        } else {
          setAuthCode(authResult.data.authCode);
        }
      })
      .catch((error) => {
        console.error('Failed to create webhook', error);
        toast.error('Failed to create webhook', {
          description: 'Please try again.',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [organization, webhooks, webhook, authCode, executeCreateAuthCode]);

  const webhookUrl = (() => {
    if (!webhook) return '';

    const baseUrl = env.NEXT_PUBLIC_API_URL || 'https://unhook.sh';
    const url = new URL(`${baseUrl}/${webhook.id}`);
    if (source) {
      url.searchParams.set('source', source);
    }
    if (webhook.isPrivate) {
      url.searchParams.set('key', webhook.apiKeyId);
    }
    return url.toString();
  })();

  const handleFirstEventReceived = () => {
    console.log('handleFirstEventReceived');
    onSetupComplete?.(true);
    toast.success('🎉 Webhook setup complete!', {
      description: 'You successfully received your first webhook event.',
    });
  };

  return (
    <div className="w-full space-y-6">
      <Card className="w-full relative overflow-hidden">
        <CardHeader>
          <CardTitle>{STEP_TITLE}</CardTitle>
          {webhook && authCode && !isLoading && !isCreatingAuthCode && (
            <CardDescription>{STEP_DESCRIPTION}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-4">
            {isLoading || isCreatingAuthCode || !webhook || !authCode ? (
              <div className="flex items-center justify-center py-8 gap-2 flex-col">
                <Icons.Spinner className="size-8 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-sm">
                  Generating webhook URL...
                </span>
              </div>
            ) : webhook && authCode ? (
              <>
                <SourceStep onChange={setSource} value={source} />
                <WebhookUrlStep
                  apiUrl={env.NEXT_PUBLIC_API_URL || 'https://unhook.sh'}
                  source={source}
                  webhookName={webhook.id}
                  webhookUrl={webhookUrl}
                />
                {showInstallationTabs && (
                  <InstallationTabs
                    authCode={authCode.id}
                    source={source}
                    webhookUrl={webhook.id}
                  />
                )}
              </>
            ) : null}
          </div>
        </CardContent>
        {webhook && authCode && !isLoading && !isCreatingAuthCode && footer && (
          <CardFooter className="flex justify-end">{footer}</CardFooter>
        )}
      </Card>

      {webhook && authCode && !isLoading && !isCreatingAuthCode && (
        <RealTimeEventStream
          onEventReceived={handleFirstEventReceived}
          webhookUrl={webhookUrl}
        />
      )}
    </div>
  );
}
