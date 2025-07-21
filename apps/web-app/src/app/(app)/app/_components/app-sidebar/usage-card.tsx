'use client';

import { useOrganization } from '@clerk/nextjs';
import { IconInfoCircle } from '@tabler/icons-react';
import { api } from '@unhook/api/react';
import {
  useHasActiveSubscription,
  useHasPastDueSubscription,
} from '@unhook/stripe/guards/client';
import { Button } from '@unhook/ui/button';
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
import { createCheckoutSessionAction } from '~/app/(app)/app/settings/billing/actions';

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
        description: 'Unlimited webhook events per month',
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

export function UsageCard() {
  const { organization } = useOrganization();
  const hasActiveSubscription = useHasActiveSubscription();
  const hasPastDueSubscription = useHasPastDueSubscription();

  // Usage data
  const usage = useWebhookUsage();

  // Checkout action
  const { executeAsync: executeCreateCheckout, status: checkoutStatus } =
    useAction(createCheckoutSessionAction);

  const isSubscribing = checkoutStatus === 'executing';

  const handleUpgrade = async () => {
    if (!organization?.id) return;

    try {
      await executeCreateCheckout();
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  // Don't show upgrade button if user already has an active subscription
  if (hasActiveSubscription || hasPastDueSubscription) {
    return null;
  }

  return (
    <Card className="mx-2 border-border/50 bg-card/50 shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">Usage</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Webhook events are counted when external services send data
                    to your webhook URLs.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-xs text-muted-foreground">
            {usage.planName}
          </span>
        </div>
        <CardDescription className="text-xs">
          {usage.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Usage Display */}
          {usage.isUnlimited ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Events this month</span>
                <span className="font-medium">
                  {usage.current.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Events today ({usage.current} / {usage.limit})
                </span>
                <span className="font-medium">
                  {Math.round((usage.current / usage.limit) * 100)}%
                </span>
              </div>
              <Progress
                className="h-1.5"
                value={(usage.current / usage.limit) * 100}
              />
              {usage.current >= usage.limit * 0.8 && (
                <div className="text-xs text-warning">Approaching limit</div>
              )}
            </div>
          )}

          {/* Upgrade Button */}
          <Button
            className="w-full"
            disabled={isSubscribing}
            onClick={handleUpgrade}
            size="sm"
            variant="secondary"
          >
            {isSubscribing ? 'Redirecting...' : 'Upgrade For Unlimited'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
