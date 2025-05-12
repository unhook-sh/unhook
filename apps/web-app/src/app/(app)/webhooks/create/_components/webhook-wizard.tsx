'use client';

import type { AuthCodeType, WebhookType } from '@unhook/db/schema';
import { Button } from '@unhook/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@unhook/ui/components/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@unhook/ui/components/tabs';
import { Icons } from '@unhook/ui/custom/icons';
import { toast } from '@unhook/ui/sonner';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { createAuthCode } from '~/app/(app)/cli-token/actions';
import { createWebhook } from './actions';
import { FromStep } from './from-step';
import { NameStep } from './name-step';
import { PrivateStep } from './private-step';
import { ToStep } from './to-step';
import { WebhookUrlStep } from './webhook-url-step';
import { WelcomeStep } from './welcome-step';

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'name', title: 'Webhook Name' },
  { id: 'private', title: 'Privacy Settings' },
  { id: 'from', title: 'Webhook Source' },
  { id: 'to', title: 'Webhook Destination' },
  { id: 'url', title: 'Your Webhook URL' },
] as const;

function InstallationCommand({
  authCode,
  webhookId,
  from,
}: {
  authCode: string;
  webhookId: string;
  from: string;
}) {
  return (
    <div className="mt-4 space-y-2">
      <Tabs defaultValue="npx" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="npx">npx</TabsTrigger>
          <TabsTrigger value="pnpm">pnpm</TabsTrigger>
          <TabsTrigger value="bun">bun</TabsTrigger>
        </TabsList>
        <TabsContent value="npx" className="mt-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            npx unhook init --webhook {webhookId} --from {from} --code{' '}
            {authCode}
          </code>
        </TabsContent>
        <TabsContent value="pnpm" className="mt-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            pnpm x unhook init --webhook {webhookId} --from {from} --code{' '}
            {authCode}
          </code>
        </TabsContent>
        <TabsContent value="bun" className="mt-2">
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
            bunx unhook init --webhook {webhookId} --from {from} --code{' '}
            {authCode}
          </code>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function WebhookWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [webhook, setWebhook] = useState<WebhookType | null>(null);
  const [authCode, setAuthCode] = useState<AuthCodeType | null>(null);

  const { executeAsync: executeCreateWebhook, status: webhookStatus } =
    useAction(createWebhook);
  const { executeAsync: executeCreateAuthCode, status: authStatus } =
    useAction(createAuthCode);

  const isLoading = webhookStatus === 'executing' || authStatus === 'executing';

  const webhookUrl = (() => {
    if (!webhook) return '';

    const url = new URL(`https://unhook.sh/${webhook.id}`);
    url.searchParams.set('from', from);
    if (webhook.isPrivate) {
      url.searchParams.set('key', webhook.apiKey);
    }
    return url.toString();
  })();

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      if (currentStep === STEPS.length - 2) {
        // Create webhook when moving to the last step
        try {
          const result = await executeCreateWebhook({ name, isPrivate });
          if (result?.data) {
            setWebhook(result.data);

            // Create auth code after webhook is created
            const authResult = await executeCreateAuthCode();
            if (!authResult?.data) {
              console.error('Failed to create auth code');
              toast.error('Failed to create auth code', {
                description: 'Please try again.',
              });
            } else {
              setAuthCode(authResult.data);

              toast.success('Webhook created', {
                description: 'The webhook has been created successfully.',
              });
            }
          } else {
            toast.error('Failed to create webhook', {
              description: 'Please try again.',
            });
            return; // Don't proceed to next step if creation failed
          }
        } catch (error) {
          console.error('Failed to create webhook', error);
          toast.error('Failed to create webhook', {
            description: 'Please try again.',
          });
          return; // Don't proceed to next step if creation failed
        }
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Create Webhook</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`size-6 rounded-full text-xs flex items-center justify-center ${
                    index <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-b pb-3">
            <WelcomeStep />
          </div>

          {currentStep >= 1 && (
            <div className="animate-in slide-in-from-bottom-4 duration-300 border-b pb-3">
              <NameStep value={name} onChange={setName} />
            </div>
          )}

          {currentStep >= 2 && (
            <div className="animate-in slide-in-from-bottom-4 duration-300 border-b pb-3">
              <PrivateStep value={isPrivate} onChange={setIsPrivate} />
            </div>
          )}

          {currentStep >= 3 && (
            <div className="animate-in slide-in-from-bottom-4 duration-300 border-b pb-3">
              <FromStep value={from} onChange={setFrom} />
            </div>
          )}

          {currentStep >= 4 && (
            <div className="animate-in slide-in-from-bottom-4 duration-300 border-b pb-3">
              <ToStep value={to} onChange={setTo} />
            </div>
          )}

          {currentStep >= 5 && (
            <div className="animate-in slide-in-from-bottom-4 duration-300">
              <WebhookUrlStep webhookUrl={webhookUrl} />
              {webhook && authCode && (
                <InstallationCommand
                  authCode={authCode.id}
                  webhookId={webhook.id}
                  from={from}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
            size="sm"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              isLoading ||
              currentStep === STEPS.length - 1 ||
              (currentStep === 1 && !name) ||
              (currentStep === 3 && !from) ||
              (currentStep === 4 && !to)
            }
            size="sm"
          >
            {isLoading ? (
              <>
                <Icons.Spinner className="mr-2 size-4 animate-spin" />
                Creating...
              </>
            ) : currentStep === STEPS.length - 1 ? (
              'Done'
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
