'use client';

import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
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
import { createAuthCode } from '~/app/(app)/cli-token/actions';
import { createWebhook } from './actions';
import { FromStep } from './from-step';
import { InstallationCommand } from './installation-command';
import { WebhookUrlStep } from './webhook-url-step';

const STEP_TITLE = 'Welcome to Unhook';
const STEP_DESCRIPTION =
  'Your webhook URL is ready! Use it to receive webhooks locally.';

export function WebhookWizard() {
  const [from, setFrom] = useState('');
  const [webhook, setWebhook] = useState<WebhookType | null>(null);
  const [authCode, setAuthCode] = useState<AuthCodeType | null>(null);
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
        const orgName = `${user?.firstName}'s Team`;
        if (user && createOrganization && !organization) {
          const result = await createOrganization({
            name: orgName,
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
    url.searchParams.set('from', from);
    if (webhook.isPrivate) {
      url.searchParams.set('key', webhook.apiKey);
    }
    return url.toString();
  })();

  return (
    <Card className="w-full relative overflow-hidden">
      <CardHeader className="space-y-1">
        <CardTitle>{STEP_TITLE}</CardTitle>
        <CardDescription>{STEP_DESCRIPTION}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="space-y-4">
          {isCreatingWebhook || isCreatingAuthCode ? (
            <div className="flex items-center justify-center py-8">
              <Icons.Spinner className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : webhook && authCode ? (
            <>
              <WebhookUrlStep webhookUrl={webhookUrl} from={from} />
              <FromStep value={from} onChange={setFrom} />
              <InstallationCommand
                authCode={authCode.id}
                webhookId={webhook.id}
                source={from}
              />
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
