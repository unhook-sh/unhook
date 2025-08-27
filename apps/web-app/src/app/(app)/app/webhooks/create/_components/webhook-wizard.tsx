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
import { Button } from '@unhook/ui/components/button';
import { Icons } from '@unhook/ui/custom/icons';
import { toast } from '@unhook/ui/sonner';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { createAuthCode } from '~/app/(app)/app/auth-code/actions';
import { env } from '~/env.client';
import { InstallationTabs } from './installation-tabs';
import { RealTimeEventStream } from './real-time-event-stream';
import { SourceStep } from './source-step';
import { UnhookConfigStep } from './unhook-config-step';
import { WebhookUrlStep } from './webhook-url-step';

const STEP_TITLE = 'Welcome to Unhook';
const STEP_DESCRIPTION =
  'Your webhook URL is ready! Use it to receive webhooks locally.';

interface WebhookWizardProps {
  orgName?: string;
}

export function WebhookWizard({ orgName }: WebhookWizardProps) {
  const [source, setSource] = useState('');
  const [webhook, setWebhook] = useState<WebhookType | null>(null);
  const [authCode, setAuthCode] = useState<AuthCodeType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookName, setWebhookName] = useState('');

  const { organization } = useOrganization();

  const { executeAsync: executeCreateAuthCode, isPending: isCreatingAuthCode } =
    useAction(createAuthCode);
  const { data: webhooks } = api.webhooks.all.useQuery();
  const { mutateAsync: createWebhook } = api.webhooks.create.useMutation();

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
    const url = new URL(`${baseUrl}/${orgName || 'org'}/${webhook.name}`);
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
            {!webhook ? (
              // Show webhook ID input form
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">
                    Choose Your Webhook Name
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {orgName
                      ? `Your webhook will be available at: https://unhook.sh/${orgName}/{webhook-name}`
                      : 'Enter a unique name for your webhook'}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium" htmlFor="webhookName">
                    Webhook Name
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    id="webhookName"
                    onChange={(e) => setWebhookName(e.target.value)}
                    pattern="[a-z0-9-]+"
                    placeholder="e.g., production-webhook"
                    title="Only lowercase letters, numbers, and hyphens allowed"
                    type="text"
                    value={webhookName}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use lowercase letters, numbers, and hyphens only. This will
                    be part of your webhook URL.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    className="min-w-32"
                    disabled={
                      !webhookName.trim() ||
                      !/^[a-z0-9-]+$/.test(webhookName.trim()) ||
                      isLoading
                    }
                    onClick={async () => {
                      if (!webhookName.trim()) {
                        toast.error('Please enter a webhook name');
                        return;
                      }
                      if (!/^[a-z0-9-]+$/.test(webhookName.trim())) {
                        toast.error(
                          'Webhook name can only contain lowercase letters, numbers, and hyphens',
                        );
                        return;
                      }

                      setIsLoading(true);
                      try {
                        // Create webhook with custom ID
                        const newWebhook = await createWebhook({
                          config: {
                            headers: {},
                            requests: {},
                            storage: {
                              maxRequestBodySize: 1024 * 1024,
                              maxResponseBodySize: 1024 * 1024,
                              storeHeaders: true,
                              storeRequestBody: true,
                              storeResponseBody: true,
                            },
                          },
                          id: webhookName.trim(),
                          name: webhookName.trim(),
                          status: 'active',
                        });

                        if (newWebhook) {
                          setWebhook(newWebhook);
                          toast.success('Webhook created successfully!');
                        } else {
                          throw new Error('Failed to create webhook');
                        }
                      } catch (error) {
                        console.error('Failed to create webhook:', error);
                        toast.error('Failed to create webhook', {
                          description:
                            error instanceof Error
                              ? error.message
                              : 'Please try again.',
                        });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Icons.Spinner className="size-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Webhook'
                    )}
                  </Button>
                </div>
              </div>
            ) : isLoading || isCreatingAuthCode ? (
              <div className="flex items-center justify-center py-8">
                <Icons.Spinner className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : webhook && authCode ? (
              <>
                <WebhookUrlStep
                  orgName={orgName}
                  source={source}
                  webhookName={webhook.name}
                  webhookUrl={webhookUrl}
                />
                <SourceStep onChange={setSource} value={source} />
                <InstallationTabs
                  authCode={authCode.id}
                  source={source}
                  webhookUrl={webhookUrl}
                />
                <UnhookConfigStep
                  orgName={orgName}
                  source={source}
                  webhookName={webhook.name}
                  webhookUrl={webhookUrl}
                />
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {webhook && (
        <RealTimeEventStream
          onEventReceived={handleFirstEventReceived}
          webhookUrl={webhookUrl}
        />
      )}
    </div>
  );
}
