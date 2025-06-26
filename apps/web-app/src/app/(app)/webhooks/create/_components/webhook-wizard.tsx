'use client';

import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
import type { AuthCodeType, WebhookType } from '@unhook/db/schema';
import { generateRandomName } from '@unhook/id';
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
import { createAuthCode } from '~/app/(app)/cli-token/actions';
import { createWebhook } from './actions';
import { InstallationCommand } from './installation-command';
import { RealTimeEventStream } from './real-time-event-stream';
import { SourceStep } from './source-step';
import { WebhookUrlStep } from './webhook-url-step';

const STEP_TITLE = 'Welcome to Unhook';
const STEP_DESCRIPTION =
  'Your webhook URL is ready! Use it to receive webhooks locally.';

export function WebhookWizard(props: { authToken?: string }) {
  const { authToken } = props;
  const [source, setSource] = useState('');
  const [webhook, setWebhook] = useState<WebhookType | null>(null);
  const [authCode, setAuthCode] = useState<AuthCodeType | null>(null);
  const [hasReceivedFirstEvent, setHasReceivedFirstEvent] = useState(false);
  const { organization } = useOrganization();
  const { createOrganization, setActive } = useOrganizationList();
  const { user } = useUser();

  const { executeAsync: executeCreateWebhook, isPending: isCreatingWebhook } =
    useAction(createWebhook);
  const { executeAsync: executeCreateAuthCode, isPending: isCreatingAuthCode } =
    useAction(createAuthCode);

  useEffect(() => {
    async function initializeWebhook() {
      try {
        const orgName = user?.firstName
          ? `${user.firstName}'s Team`
          : 'Personal Team';

        if (user && createOrganization && !organization) {
          const slug = generateRandomName();
          const result = await createOrganization({
            name: orgName,
            slug,
          });

          if (result) {
            setActive({
              organization: result.id,
            });
          }
        }

        if (!organization) {
          return;
        }

        const result = await executeCreateWebhook({
          orgName,
        });
        if (result?.data) {
          setWebhook(result.data.webhook);

          const authResult = await executeCreateAuthCode();
          if (!authResult?.data) {
            console.error('Failed to create auth code');
            toast.error('Failed to create auth code', {
              description: 'Please try again.',
            });
          } else {
            setAuthCode(authResult.data.authCode);
            if (result.data.isNew) {
              toast.success('Webhook created', {
                description: 'The webhook has been created successfully.',
              });
            }
          }
        } else {
          toast.error('Failed to create webhook', {
            description: 'Please try again.',
          });
        }
      } catch (error) {
        console.error('Failed to create webhook', error);
        toast.error('Failed to create webhook', {
          description: 'Please try again.',
        });
      }
    }

    initializeWebhook();
  }, [
    executeCreateWebhook,
    executeCreateAuthCode,
    organization,
    createOrganization,
    setActive,
    user,
  ]);

  const webhookUrl = (() => {
    if (!webhook) return '';

    const url = new URL(`https://unhook.sh/${webhook.id}`);
    url.searchParams.set('source', source);
    if (webhook.isPrivate) {
      url.searchParams.set('key', webhook.apiKey);
    }
    return url.toString();
  })();

  const handleFirstEventReceived = () => {
    setHasReceivedFirstEvent(true);
    toast.success('🎉 Webhook setup complete!', {
      description: 'You successfully received your first webhook event.',
    });
  };

  return (
    <div className="w-full space-y-6">
      <Card className="w-full relative overflow-hidden">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{STEP_TITLE}</CardTitle>
              <CardDescription>{STEP_DESCRIPTION}</CardDescription>
            </div>
            {hasReceivedFirstEvent && (
              <div className="flex items-center gap-2 text-green-600">
                <Icons.Check className="size-5" />
                <span className="text-sm font-medium">Setup Complete!</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-4">
            {(isCreatingWebhook || isCreatingAuthCode) &&
            !webhook &&
            !authCode ? (
              <div className="flex items-center justify-center py-8">
                <Icons.Spinner className="size-8 animate-spin text-muted-foreground" />
              </div>
            ) : webhook && authCode ? (
              <>
                <WebhookUrlStep webhookUrl={webhookUrl} source={source} />
                <SourceStep value={source} onChange={setSource} />
                <InstallationCommand
                  authCode={authCode.id}
                  webhookId={webhook.id}
                  source={source}
                />
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {webhook && (
        <RealTimeEventStream
          webhookId={webhook.id}
          onEventReceived={handleFirstEventReceived}
        />
      )}
    </div>
  );
}
