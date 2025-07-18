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
import { useCallback, useEffect, useRef, useState } from 'react';
import { createAuthCode } from '~/app/(app)/app/auth-code/actions';
import { env } from '~/env.client';
import { createWebhook } from './actions';
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
  const [hasReceivedFirstEvent, setHasReceivedFirstEvent] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const initializationRef = useRef<Promise<void> | null>(null);

  const { organization } = useOrganization();
  const { createOrganization, setActive } = useOrganizationList();
  const { user } = useUser();

  const { executeAsync: executeCreateWebhook, isPending: isCreatingWebhook } =
    useAction(createWebhook);
  const { executeAsync: executeCreateAuthCode, isPending: isCreatingAuthCode } =
    useAction(createAuthCode);

  const initializeWebhook = useCallback(async () => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing || isInitialized) {
      return;
    }

    // If there's already an initialization in progress, wait for it
    if (initializationRef.current) {
      await initializationRef.current;
      return;
    }

    const initPromise = (async () => {
      try {
        setIsInitializing(true);

        const orgName = user?.firstName
          ? `${user.firstName}'s Team`
          : 'Personal Team';

        let currentOrg = organization;

        // Only create organization if we don't have one and we have the ability to create one
        if (user && createOrganization && !currentOrg) {
          const slug = generateRandomName();
          const result = await createOrganization({
            name: orgName,
            slug,
          });

          if (result) {
            await setActive({
              organization: result.id,
            });
            currentOrg = result;
          }
        }

        // Wait for organization to be available
        if (!currentOrg) {
          throw new Error('Organization not available');
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
      } finally {
        setIsInitializing(false);
        setIsInitialized(true);
      }
    })();

    initializationRef.current = initPromise;
    await initPromise;
    initializationRef.current = null;
  }, [
    user,
    organization,
    createOrganization,
    setActive,
    executeCreateWebhook,
    executeCreateAuthCode,
    isInitializing,
    isInitialized,
  ]);

  useEffect(() => {
    // Only initialize if we have a user and we haven't initialized yet
    if (user && !isInitialized && !isInitializing) {
      initializeWebhook();
    }
  }, [user, isInitialized, isInitializing, initializeWebhook]);

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
