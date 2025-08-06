'use client';

import { useOrganization } from '@clerk/nextjs';
import { api } from '@unhook/api/react';
import type { AuthCodeType, WebhookType } from '@unhook/db/schema';
import {
  Card,
  CardContent,
  CardDescription,
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

export function WebhookWizard() {
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

    const baseUrl = env.NEXT_PUBLIC_WEBHOOK_BASE_URL || 'https://unhook.sh';
    const url = new URL(`${baseUrl}/${webhook.id}`);
    url.searchParams.set('source', source);
    if (webhook.isPrivate) {
      url.searchParams.set('key', webhook.apiKeyId);
    }
    return url.toString();
  })();

  const handleFirstEventReceived = () => {
    toast.success('🎉 Webhook setup complete!', {
      description: 'You successfully received your first webhook event.',
    });
  };

  return (
    <div className="w-full space-y-6">
      <Card className="w-full relative overflow-hidden">
        <CardHeader className="space-y-1">
          <CardTitle>{STEP_TITLE}</CardTitle>
          <CardDescription>{STEP_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-4">
            {isLoading || isCreatingAuthCode ? (
              <div className="flex items-center justify-center py-8">
                <Icons.Spinner className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : webhook && authCode ? (
              <>
                <WebhookUrlStep source={source} webhookUrl={webhookUrl} />
                <SourceStep onChange={setSource} value={source} />
                <InstallationTabs
                  authCode={authCode.id}
                  source={source}
                  webhookId={webhook.id}
                />
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {webhook && (
        <RealTimeEventStream
          onEventReceived={handleFirstEventReceived}
          webhookId={webhook.id}
        />
      )}
    </div>
  );
}
