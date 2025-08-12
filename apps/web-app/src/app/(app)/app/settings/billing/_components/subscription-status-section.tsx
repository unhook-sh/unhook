'use client';

import { IconCurrencyDollar, IconInfoCircle } from '@tabler/icons-react';
import { MetricButton } from '@unhook/analytics/components';
import { api } from '@unhook/api/react';
import {
  SubscriptionActive,
  SubscriptionPastDue,
  useHasActiveSubscription,
  useHasPastDueSubscription,
} from '@unhook/stripe/guards/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@unhook/ui/card';
import { Progress } from '@unhook/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@unhook/ui/tooltip';
import { useAction } from 'next-safe-action/hooks';
import { useMemo } from 'react';
import {
  createBillingPortalSessionAction,
  createCheckoutSessionAction,
} from '../actions';

// Usage data hook that fetches real data from the API
function useWebhookUsage() {
  const hasActiveSubscription = useHasActiveSubscription();

  // Fetch usage statistics for the last 30 days (for monthly) or 1 day (for daily)
  const { data: usageStats } = api.apiKeyUsage.stats.useQuery({
    days: hasActiveSubscription ? 30 : 1, // Monthly for team, daily for free
    type: 'webhook-event',
  });

  return useMemo(() => {
    // Calculate total webhook events from the stats
    const totalEvents =
      usageStats?.reduce(
        (sum: number, stat: { type: string; count: number }) => {
          if (stat.type === 'webhook-event') {
            return sum + stat.count;
          }
          return sum;
        },
        0,
      ) ?? 0;

    if (hasActiveSubscription) {
      // Team plan has unlimited usage
      return {
        current: totalEvents,
        description: 'Unlimited webhook events per month', // -1 indicates unlimited
        isUnlimited: true,
        limit: -1,
        period: 'month' as const,
        planName: 'Team Plan',
      };
    }
    // Free plan has 50 events per day
    return {
      current: totalEvents,
      description: '50 webhook events per day',
      isUnlimited: false,
      limit: 50,
      period: 'day' as const,
      planName: 'Free Plan',
    };
  }, [hasActiveSubscription, usageStats]);
}

export function SubscriptionStatusSection() {
  // Safe actions
  const {
    executeAsync: executeCreateBillingPortal,
    status: billingPortalStatus,
  } = useAction(createBillingPortalSessionAction);
  const { executeAsync: executeCreateCheckout, status: checkoutStatus } =
    useAction(createCheckoutSessionAction);
  const subscriptionStatus = api.billing.getSubscriptionStatus.useQuery();

  // Subscription status hooks - must be called at top level
  const hasActiveSubscription = useHasActiveSubscription();
  const hasPastDueSubscription = useHasPastDueSubscription();

  // Usage data
  const usage = useWebhookUsage();

  const isManagingBilling = billingPortalStatus === 'executing';
  const isSubscribing = checkoutStatus === 'executing';

  const handleManageBilling = async () => {
    try {
      await executeCreateBillingPortal();
    } catch (error) {
      console.error('Failed to open billing portal:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      await executeCreateCheckout();
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  return (
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
            <div className="font-medium">Status</div>
            <div className="text-sm text-muted-foreground">
              <SubscriptionActive>Active subscription</SubscriptionActive>
              <SubscriptionPastDue>
                Past due - please update payment method
              </SubscriptionPastDue>
              {!hasActiveSubscription && !hasPastDueSubscription && (
                <>
                  {subscriptionStatus.data?.status === 'canceled' &&
                    'Subscription canceled'}
                  {!subscriptionStatus.data?.status && 'No active subscription'}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SubscriptionActive>
              <div className="flex size-3 rounded-full bg-green-500" />
            </SubscriptionActive>
            <SubscriptionPastDue>
              <div className="flex size-3 rounded-full bg-yellow-500" />
            </SubscriptionPastDue>
            {!hasActiveSubscription && !hasPastDueSubscription && (
              <div className="flex size-3 rounded-full bg-gray-500" />
            )}
          </div>
        </div>

        <SubscriptionActive>
          <div>
            <div className="font-medium">Billing</div>
            <div className="text-sm text-muted-foreground">
              Usage-based billing per webhook event
            </div>
          </div>
        </SubscriptionActive>

        {/* Usage Section */}
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium">Webhook Events Usage</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Webhook events are counted when external services send data
                    to your webhook URLs. Each incoming webhook request counts
                    as one event.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="mt-2 space-y-3">
            {/* Plan Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Plan</span>
              <span className="font-medium">{usage.planName}</span>
            </div>

            {/* Usage Display */}
            {usage.isUnlimited ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Events this month
                  </span>
                  <span className="font-medium">
                    {usage.current.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {usage.description}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Events today ({usage.current} / {usage.limit})
                  </span>
                  <span className="font-medium">
                    {Math.round((usage.current / usage.limit) * 100)}%
                  </span>
                </div>
                <Progress
                  className="h-2"
                  value={(usage.current / usage.limit) * 100}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Resets every {usage.period}</span>
                  {usage.current >= usage.limit * 0.8 && (
                    <span className="text-warning">Approaching limit</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          {hasActiveSubscription || hasPastDueSubscription ? (
            <MetricButton
              disabled={isManagingBilling}
              metric="subscription_status_manage_billing_clicked"
              onClick={handleManageBilling}
              variant="outline"
            >
              <IconCurrencyDollar className="mr-2 size-4" />
              {isManagingBilling ? 'Opening...' : 'Manage Billing'}
            </MetricButton>
          ) : (
            <MetricButton
              disabled={isSubscribing}
              metric="subscription_status_subscribe_clicked"
              onClick={handleSubscribe}
            >
              <IconCurrencyDollar className="mr-2 size-4" />
              {isSubscribing ? 'Redirecting...' : 'Subscribe Now'}
            </MetricButton>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
