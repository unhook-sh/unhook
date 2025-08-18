'use client';

import { SignedIn, SignedOut, useOrganization } from '@clerk/nextjs';
import { IconCheck } from '@tabler/icons-react';
import { MetricLink } from '@unhook/analytics/components';
import {
  SubscriptionActive,
  SubscriptionPastDue,
  useHasActiveSubscription,
  useHasPastDueSubscription,
} from '@unhook/stripe/guards/client';
import { cn } from '@unhook/ui/lib/utils';
import { motion } from 'motion/react';
import { useAction } from 'next-safe-action/hooks';
import posthog from 'posthog-js';
import { memo, useMemo, useState } from 'react';
import type { siteConfig } from '~/app/(marketing)/_lib/config';
import { TEAM_PRICING } from '~/app/(marketing)/_lib/config';
import { createCheckoutSessionAction } from './actions';
import { TeamPriceDisplay } from './team-price-display';
import { TeamSeatsSlider } from './team-seats-slider';

interface PricingCardProps {
  tier: (typeof siteConfig.pricing.pricingItems)[0];
  billingCycle: 'monthly' | 'yearly';
}

const PriceDisplay = ({
  tier,
  billingCycle,
  teamPrice,
  teamSeats,
}: {
  tier: (typeof siteConfig.pricing.pricingItems)[0];
  billingCycle: 'monthly' | 'yearly';
  teamPrice: number;
  teamSeats: number;
}) => {
  if (tier.name === 'Team') {
    return (
      <TeamPriceDisplay
        betaFree={tier.betaFree}
        billingCycle={billingCycle}
        price={teamPrice}
        seats={teamSeats}
      />
    );
  }

  const price = billingCycle === 'yearly' ? tier.yearlyPrice : tier.price;

  if (tier.betaFree) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold line-through text-muted-foreground">
            {price}
          </span>
          <span className="text-4xl font-semibold text-primary">Free</span>
          <span className="text-base text-muted-foreground font-medium">
            /{billingCycle === 'yearly' ? 'month' : 'month'}
          </span>
        </div>
        <span className="mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide">
          during beta
        </span>
      </div>
    );
  }

  return (
    <motion.span
      animate={{ filter: 'blur(0px)', opacity: 1, x: 0 }}
      className="text-4xl font-semibold"
      initial={{
        filter: 'blur(5px)',
        opacity: 0,
        x: billingCycle === 'yearly' ? -10 : 10,
      }}
      key={price}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {price}
    </motion.span>
  );
};

export const PricingCard = memo(function PricingCard({
  tier,
  billingCycle,
}: PricingCardProps) {
  const [teamSeats, setTeamSeats] = useState<number>(
    TEAM_PRICING.DEFAULT_SEATS,
  );

  const { organization } = useOrganization();

  // Safe action for checkout
  const { executeAsync: executeCreateCheckout, status: checkoutStatus } =
    useAction(createCheckoutSessionAction);

  // Subscription status hooks - must be called at top level
  const hasActiveSubscription = useHasActiveSubscription();
  const hasPastDueSubscription = useHasPastDueSubscription();

  const isSubscribing = checkoutStatus === 'executing';

  // Track pricing card view
  useState(() => {
    posthog.capture('pricing_card_viewed', {
      billing_cycle: billingCycle,
      location: 'pricing_section',
      plan_name: tier.name,
    });
  });

  // Calculate team price
  const teamPrice = useMemo(() => {
    if (tier.name !== 'Team') return 0;

    const additionalSeats = Math.max(
      0,
      teamSeats - TEAM_PRICING.INCLUDED_SEATS,
    );
    const basePrice =
      billingCycle === 'yearly'
        ? TEAM_PRICING.BASE_PRICE_YEARLY
        : TEAM_PRICING.BASE_PRICE_MONTHLY;
    const perSeatPrice =
      billingCycle === 'yearly'
        ? TEAM_PRICING.PRICE_PER_SEAT_YEARLY
        : TEAM_PRICING.PRICE_PER_SEAT_MONTHLY;
    return basePrice + additionalSeats * perSeatPrice;
  }, [teamSeats, billingCycle, tier.name]);

  const handleSubscribe = async () => {
    if (!organization?.id) return;

    // Track subscription attempt
    posthog.capture('subscription_attempted', {
      billing_cycle: billingCycle,
      location: 'pricing_section',
      organization_id: organization.id,
      plan_name: tier.name,
      team_seats: tier.name === 'Team' ? teamSeats : undefined,
    });

    try {
      await executeCreateCheckout({
        billingInterval: billingCycle,
        orgId: organization.id,
        planType: tier.name === 'Team' ? 'team' : 'free',
      });

      // Track successful checkout creation
      posthog.capture('checkout_session_created', {
        billing_cycle: billingCycle,
        location: 'pricing_section',
        organization_id: organization.id,
        plan_name: tier.name,
        team_seats: tier.name === 'Team' ? teamSeats : undefined,
      });
    } catch (error) {
      console.error('Failed to create checkout session:', error);

      // Track checkout failure
      posthog.capture('checkout_session_failed', {
        billing_cycle: billingCycle,
        error: error instanceof Error ? error.message : 'Unknown error',
        location: 'pricing_section',
        organization_id: organization.id,
        plan_name: tier.name,
        team_seats: tier.name === 'Team' ? teamSeats : undefined,
      });
    }
  };

  const handleTeamSeatsChange = (seats: number) => {
    setTeamSeats(seats);

    // Track team seats change
    posthog.capture('team_seats_changed', {
      billing_cycle: billingCycle,
      location: 'pricing_section',
      new_seats: seats,
      plan_name: tier.name,
    });
  };

  const renderButton = () => {
    // For signed out users, show "Create Webhook URL" with link
    return (
      <>
        <SignedOut>
          <MetricLink
            className={`h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95 ${
              tier.isPopular
                ? `${tier.buttonColor} shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]`
                : `${tier.buttonColor} shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]`
            }`}
            href="/app/onboarding"
            metric="pricing_card_create_webhook_url_clicked"
            properties={{
              location: 'pricing_card',
            }}
          >
            Create Webhook URL
          </MetricLink>
        </SignedOut>

        {/* For signed in users */}
        <SignedIn>
          {tier.name === 'Team' ? (
            // Team plan logic
            <>
              <SubscriptionActive>
                <button
                  className={`h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95 ${
                    tier.isPopular
                      ? `${tier.buttonColor} shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]`
                      : `${tier.buttonColor} shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]`
                  }`}
                  disabled={isSubscribing}
                  onClick={handleSubscribe}
                  type="button"
                >
                  {isSubscribing ? 'Redirecting...' : 'Downgrade'}
                </button>
              </SubscriptionActive>
              <SubscriptionPastDue>
                <button
                  className={`h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95 ${
                    tier.isPopular
                      ? `${tier.buttonColor} shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]`
                      : `${tier.buttonColor} shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]`
                  }`}
                  disabled={isSubscribing}
                  onClick={handleSubscribe}
                  type="button"
                >
                  {isSubscribing ? 'Redirecting...' : 'Update Payment'}
                </button>
              </SubscriptionPastDue>
              {!hasActiveSubscription && !hasPastDueSubscription && (
                <button
                  className={`h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95 ${
                    tier.isPopular
                      ? `${tier.buttonColor} shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]`
                      : `${tier.buttonColor} shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]`
                  }`}
                  disabled={isSubscribing}
                  onClick={handleSubscribe}
                  type="button"
                >
                  {isSubscribing
                    ? 'Redirecting...'
                    : tier.betaFree
                      ? 'Create Webhook URL'
                      : 'Upgrade'}
                </button>
              )}
            </>
          ) : (
            // Free plan logic
            <>
              <SubscriptionActive>
                <MetricLink
                  className={`h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95 ${
                    tier.isPopular
                      ? `${tier.buttonColor} shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]`
                      : `${tier.buttonColor} shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]`
                  }`}
                  href="/app/onboarding"
                  metric="pricing_card_create_webhook_url_clicked"
                  properties={{
                    location: 'pricing_card',
                  }}
                >
                  Create Webhook URL
                </MetricLink>
              </SubscriptionActive>
              <SubscriptionPastDue>
                <button
                  className={`h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95 ${
                    tier.isPopular
                      ? `${tier.buttonColor} shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]`
                      : `${tier.buttonColor} shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]`
                  }`}
                  disabled={isSubscribing}
                  onClick={handleSubscribe}
                  type="button"
                >
                  {isSubscribing ? 'Redirecting...' : 'Update Payment'}
                </button>
              </SubscriptionPastDue>
              {!hasActiveSubscription && !hasPastDueSubscription && (
                <MetricLink
                  className={`h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95 ${
                    tier.isPopular
                      ? `${tier.buttonColor} shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]`
                      : `${tier.buttonColor} shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]`
                  }`}
                  href="/app/onboarding"
                  metric="pricing_card_create_webhook_url_clicked"
                  properties={{
                    location: 'pricing_card',
                  }}
                >
                  Create Webhook URL
                </MetricLink>
              )}
            </>
          )}
        </SignedIn>
      </>
    );
  };

  return (
    <div
      className={cn(
        'rounded-xl grid grid-rows-[auto_auto_1fr] relative h-fit min-[650px]:h-full min-[900px]:h-fit',
        tier.isPopular
          ? 'md:shadow-[0px_61px_24px_-10px_rgba(0,0,0,0.01),0px_34px_20px_-8px_rgba(0,0,0,0.05),0px_15px_15px_-6px_rgba(0,0,0,0.09),0px_4px_8px_-2px_rgba(0,0,0,0.10),0px_0px_0px_1px_rgba(0,0,0,0.08)] bg-accent'
          : 'bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] border border-border',
      )}
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm">
          {tier.name}
          {tier.isPopular && (
            <span className="bg-gradient-to-b from-secondary/50 from-[1.92%] to-secondary to-[100%] text-white h-6 inline-flex w-fit items-center justify-center px-2 rounded-full text-sm ml-2 shadow-[0px_6px_6px_-3px_rgba(0,0,0,0.08),0px_3px_3px_-1.5px_rgba(0,0,0,0.08),0px_1px_1px_-0.5px_rgba(0,0,0,0.08),0px_0px_0px_1px_rgba(255,255,255,0.12)_inset,0px_1px_0px_0px_rgba(255,255,255,0.12)_inset]">
              Popular
            </span>
          )}
        </p>
        <div className="flex items-baseline mt-2">
          <PriceDisplay
            billingCycle={billingCycle}
            teamPrice={teamPrice}
            teamSeats={teamSeats}
            tier={tier}
          />
        </div>
        {tier.name !== 'Team' && (
          <p className="text-sm mt-2">{tier.description}</p>
        )}

        {/* Team seats slider */}
        {tier.name === 'Team' && (
          <TeamSeatsSlider
            billingCycle={billingCycle}
            includedSeats={TEAM_PRICING.INCLUDED_SEATS}
            onSeatsChange={handleTeamSeatsChange}
            seats={teamSeats}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">{renderButton()}</div>
      <hr className="border-border dark:border-white/20" />
      <div className="p-4">
        {tier.name !== 'Basic' && tier.name !== 'Free' && (
          <p className="text-sm mb-4">
            Everything in{' '}
            {tier.name === 'Team'
              ? 'Free'
              : tier.name === 'Enterprise'
                ? 'Team'
                : 'Pro'}{' '}
          </p>
        )}
        <ul className="space-y-3">
          {tier.features.map((feature) => (
            <li className="flex items-center gap-2" key={feature}>
              <div
                className={cn(
                  'size-5 rounded-full border border-primary/20 flex items-center justify-center',
                  tier.isPopular && 'bg-muted-foreground/40 border-border',
                  tier.name === 'Team' && 'border-[var(--secondary)]/30',
                )}
                style={
                  tier.name === 'Team'
                    ? {
                        backgroundColor:
                          'color-mix(in srgb, var(--secondary) 20%, transparent)',
                      }
                    : undefined
                }
              >
                <IconCheck className="size-4 text-muted-foreground" />
              </div>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
