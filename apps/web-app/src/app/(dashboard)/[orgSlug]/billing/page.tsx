import { auth } from '@clerk/nextjs/server';
import { db } from '@unhook/db/client';
import { Orgs } from '@unhook/db/schema';
import { Button } from '@unhook/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { Icons } from '@unhook/ui/custom/icons';
import { H2, P } from '@unhook/ui/custom/typography';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import {
  createBillingPortalSessionAction,
  createCheckoutSessionAction,
} from './actions';

interface BillingPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({
  params,
  searchParams,
}: BillingPageProps) {
  const { orgSlug } = await params;
  const { success, canceled } = await searchParams;
  const { orgId } = await auth();

  if (!orgId) {
    redirect('/sign-in');
  }

  // Get organization details
  const org = await db.query.Orgs.findFirst({
    where: eq(Orgs.clerkOrgId, orgId),
  });

  if (!org) {
    redirect('/');
  }

  const hasActiveSubscription = org.stripeSubscriptionStatus === 'active';
  const hasPastDueSubscription = org.stripeSubscriptionStatus === 'past_due';
  const hasCanceledSubscription = org.stripeSubscriptionStatus === 'canceled';

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <H2>Billing</H2>
        <P className="text-muted-foreground">
          Manage your subscription and billing details
        </P>
      </div>

      {success && (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="flex items-center gap-2 pt-6">
            <Icons.CheckCircle2 className="size-5 text-green-600" />
            <P>Your subscription has been successfully activated!</P>
          </CardContent>
        </Card>
      )}

      {canceled && (
        <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-2 pt-6">
            <Icons.AlertCircle className="size-5 text-yellow-600" />
            <P>Subscription setup was canceled. You can try again anytime.</P>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Your current subscription plan and usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <P className="font-medium">Status</P>
                <P className="text-sm text-muted-foreground">
                  {hasActiveSubscription && 'Active subscription'}
                  {hasPastDueSubscription &&
                    'Past due - please update payment method'}
                  {hasCanceledSubscription && 'Subscription canceled'}
                  {!org.stripeSubscriptionStatus && 'No active subscription'}
                </P>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveSubscription && (
                  <div className="flex size-3 rounded-full bg-green-500" />
                )}
                {hasPastDueSubscription && (
                  <div className="flex size-3 rounded-full bg-yellow-500" />
                )}
                {(hasCanceledSubscription || !org.stripeSubscriptionStatus) && (
                  <div className="flex size-3 rounded-full bg-gray-500" />
                )}
              </div>
            </div>

            {hasActiveSubscription && (
              <div>
                <P className="font-medium">Billing</P>
                <P className="text-sm text-muted-foreground">
                  Usage-based billing per webhook event
                </P>
              </div>
            )}

            <div className="pt-4">
              {hasActiveSubscription || hasPastDueSubscription ? (
                <form
                  action={async () => {
                    'use server';
                    await createBillingPortalSessionAction(org.id);
                  }}
                >
                  <Button type="submit" variant="outline">
                    <Icons.DollarSign className="mr-2 size-4" />
                    Manage Billing
                  </Button>
                </form>
              ) : (
                <form
                  action={async () => {
                    'use server';
                    await createCheckoutSessionAction(org.id);
                  }}
                >
                  <Button type="submit">
                    <Icons.DollarSign className="mr-2 size-4" />
                    Subscribe Now
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>
              Simple usage-based pricing for your webhook events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <P>Webhook Events</P>
                <P className="font-mono">$0.001 per event</P>
              </div>
              <div className="border-t pt-4">
                <P className="text-sm text-muted-foreground">
                  You only pay for what you use. Each webhook event received is
                  metered and billed at the end of your billing cycle.
                </P>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasActiveSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
              <CardDescription>
                Your webhook event usage for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <P className="text-sm text-muted-foreground">
                Usage information will be available in your Stripe billing
                portal.
              </P>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
