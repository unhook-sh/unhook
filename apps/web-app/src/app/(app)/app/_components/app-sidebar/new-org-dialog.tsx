'use client';

import { useOrganizationList, useUser } from '@clerk/nextjs';
import { IconLoader2 } from '@tabler/icons-react';
import { MetricButton, MetricLink } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import {
  Entitled,
  NotEntitled,
  useIsEntitled,
} from '@unhook/stripe/guards/client';
import { Button } from '@unhook/ui/components/button';
import { P } from '@unhook/ui/custom/typography';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@unhook/ui/dialog';
import { Input } from '@unhook/ui/input';
import { Label } from '@unhook/ui/label';
import { useEffect, useState } from 'react';
import { env } from '~/env.client';

interface NewOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewOrgDialog({ open, onOpenChange }: NewOrgDialogProps) {
  const [name, setName] = useState('');
  const [webhookName, setWebhookName] = useState('');
  const { setActive, userMemberships } = useOrganizationList({
    userMemberships: true,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const { user } = useUser();
  const isEntitled = useIsEntitled('unlimited_developers');

  // Webhook name validation state
  const [webhookNameValidation, setWebhookNameValidation] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ available: null, checking: false, message: '' });

  const apiUtils = api.useUtils();

  // API mutations
  const { mutateAsync: createOrganization, isPending: isCreatingOrg } =
    api.org.upsert.useMutation();
  const { mutateAsync: createWebhook, isPending: isCreatingWebhook } =
    api.webhooks.create.useMutation();

  const isLoading = isCreatingOrg || isCreatingWebhook;

  // Live URL preview
  const webhookUrl = (() => {
    const baseUrl =
      env.NEXT_PUBLIC_WEBHOOK_BASE_URL ||
      env.NEXT_PUBLIC_API_URL ||
      'https://unhook.sh';
    if (!name) return `${baseUrl}/{org-name}/{webhook-name}`;
    if (!webhookName) return `${baseUrl}/${name}/{webhook-name}`;
    return `${baseUrl}/${name}/${webhookName}`;
  })();

  // Debounced webhook name validation
  const debouncedWebhookNameValidation = (webhookName: string) => {
    if (!webhookName || webhookName.length < 1) {
      setWebhookNameValidation({
        available: null,
        checking: false,
        message: '',
      });
      return;
    }

    // Check format validity immediately
    if (!/^[a-z0-9-]+$/.test(webhookName)) {
      setWebhookNameValidation({
        available: null,
        checking: false,
        message:
          'Webhook name can only contain lowercase letters, numbers, and hyphens',
      });
      return;
    }

    setWebhookNameValidation({
      available: true,
      checking: false,
      message: 'Webhook name format is valid',
    });
  };

  // Debounce effect for webhook name
  // biome-ignore lint/correctness/useExhaustiveDependencies: don't remove this
  useEffect(() => {
    const timer = setTimeout(() => {
      debouncedWebhookNameValidation(webhookName);
    }, 500);

    return () => clearTimeout(timer);
  }, [webhookName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!user?.id) {
      setErrors(['User not authenticated']);
      return;
    }

    // Check validation status before submitting
    if (webhookNameValidation.available === false) {
      setErrors(['Please fix webhook name validation errors']);
      return;
    }

    try {
      // Use the tRPC API to create a new organization with Stripe integration
      // This will automatically create a Stripe customer, subscribe to the free plan, and create an API key
      const orgResult = await createOrganization({
        name: name,
      });

      if (!orgResult) {
        throw new Error('Failed to create organization');
      }

      console.log('Organization created with Stripe integration:', {
        apiKeyId: orgResult.apiKey?.id,
        orgId: orgResult.org.id,
        orgName: orgResult.org.name,
        stripeCustomerId: orgResult.org.stripeCustomerId,
      });

      // Create webhook with custom ID if provided, using the existing API
      if (webhookName.trim() && orgResult.apiKey?.id) {
        const webhook = await createWebhook({
          apiKeyId: orgResult.apiKey.id,
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
          orgId: orgResult.org.id, // Pass the organization ID we just created
          status: 'active',
        });

        if (!webhook) {
          throw new Error('Failed to create webhook');
        }

        console.log('Custom webhook created:', {
          orgId: orgResult.org.id,
          webhookId: webhook.id,
          webhookName: webhook.name,
        });
      }

      // Set the new organization as active
      if (!setActive) return;

      await setActive({
        organization: orgResult.org.id,
      });

      // Close dialog and reset form
      onOpenChange(false);
      setName('');
      setWebhookName('');
      setErrors([]);

      // Invalidate queries to refresh data
      apiUtils.invalidate();
      userMemberships.revalidate();
    } catch (error) {
      console.error('Failed to complete setup:', error);
      setErrors([
        error instanceof Error
          ? error.message
          : 'Failed to create organization',
      ]);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Organization</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div>
            <Label className="block mb-2" htmlFor="org-name">
              Organization Name
            </Label>
            <Input
              autoFocus
              disabled={isLoading || !isEntitled}
              id="org-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc"
              required
              value={name}
            />
          </div>
          <div>
            <Label className="block mb-2" htmlFor="webhook-id">
              Webhook Name (Optional)
            </Label>
            <Input
              disabled={isLoading || !isEntitled}
              id="webhook-id"
              onChange={(e) => setWebhookName(e.target.value)}
              placeholder="production-webhook"
              value={webhookName}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to use the default webhook name. Use lowercase
              letters, numbers, and hyphens only.
            </p>
            {webhookName && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  Your webhook will be available at:
                </p>
                <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                  {webhookUrl}
                </p>
              </div>
            )}
            {webhookNameValidation.message && (
              <p
                className={`text-xs mt-1 ${
                  webhookNameValidation.available === false
                    ? 'text-destructive'
                    : webhookNameValidation.available === true
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                }`}
              >
                {webhookNameValidation.message}
              </p>
            )}
          </div>
          {/* <div className="flex gap-2 items-center">
            <Checkbox
              checked={enableAutoJoiningByDomain}
              id="auto-join"
              onCheckedChange={(checked) =>
                setEnableAutoJoiningByDomain(!!checked)
              }
            />
            <Label htmlFor="auto-join">
              Allow users to join by domain{' '}
              <span className="text-muted-foreground">
                ({user?.emailAddresses[0]?.emailAddress.split('@')[1]})
              </span>
            </Label>
          </div>
          <div className="flex gap-2 items-center">
            <Checkbox
              checked={membersMustHaveMatchingDomain}
              id="restrict-domain"
              onCheckedChange={(checked) =>
                setMembersMustHaveMatchingDomain(!!checked)
              }
            />
            <Label htmlFor="restrict-domain">
              Only allow users with matching domain{' '}
              <span className="text-muted-foreground">
                ({user?.emailAddresses[0]?.emailAddress.split('@')[1]})
              </span>
            </Label>
          </div> */}
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((error) => (
                <P key={`error-${error}`} variant="destructive">
                  {error}
                </P>
              ))}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <MetricButton
                metric="new_org_dialog_cancel_clicked"
                type="button"
                variant="outline"
              >
                Cancel
              </MetricButton>
            </DialogClose>
            <Entitled entitlement="unlimited_developers">
              <MetricButton
                disabled={isLoading || !name}
                metric="new_org_dialog_create_clicked"
                type="submit"
              >
                {isLoading && (
                  <IconLoader2 className="text-secondary" size="sm" />
                )}
                Create
              </MetricButton>
            </Entitled>
            <NotEntitled entitlement="unlimited_developers">
              <Button asChild>
                <MetricLink
                  href="/app/settings/billing"
                  metric="new_org_dialog_upgrade_clicked"
                  properties={{
                    destination: '/app/settings/billing',
                    location: 'new_org_dialog',
                  }}
                >
                  Upgrade to create organizations
                </MetricLink>
              </Button>
            </NotEntitled>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
