'use client';

import { cn } from '@unhook/ui/lib/utils';
import { motion } from 'motion/react';
import { memo, useMemo, useState } from 'react';
import type { siteConfig } from '~/app/(marketing)/_lib/config';
import { TEAM_PRICING } from '~/app/(marketing)/_lib/config';
import { TeamPriceDisplay } from './team-price-display';
import { TeamSeatsSlider } from './team-seats-slider';

interface PricingCardProps {
  tier: (typeof siteConfig.pricing.pricingItems)[0];
  billingCycle: 'monthly' | 'yearly';
}

export const PricingCard = memo(function PricingCard({
  tier,
  billingCycle,
}: PricingCardProps) {
  const [teamSeats, setTeamSeats] = useState<number>(
    TEAM_PRICING.DEFAULT_SEATS,
  );

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

  const PriceDisplay = () => {
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
          <PriceDisplay />
        </div>
        {tier.name !== 'Team' && (
          <p className="text-sm mt-2">{tier.description}</p>
        )}

        {/* Team seats slider */}
        {tier.name === 'Team' && (
          <TeamSeatsSlider
            billingCycle={billingCycle}
            includedSeats={TEAM_PRICING.INCLUDED_SEATS}
            onSeatsChange={setTeamSeats}
            seats={teamSeats}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <button
          className={`h-10 w-full flex items-center justify-center text-sm font-normal tracking-wide rounded-full px-4 cursor-pointer transition-all ease-out active:scale-95 ${
            tier.isPopular
              ? `${tier.buttonColor} shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)]`
              : `${tier.buttonColor} shadow-[0px_1px_2px_0px_rgba(255,255,255,0.16)_inset,0px_3px_3px_-1.5px_rgba(16,24,40,0.24),0px_1px_1px_-0.5px_rgba(16,24,40,0.20)]`
          }`}
          type="button"
        >
          {tier.betaFree ? 'Create Webhook URL' : tier.buttonText}
        </button>
      </div>
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
                <div className="size-3 flex items-center justify-center">
                  <svg
                    className="block dark:hidden"
                    fill="none"
                    height="7"
                    viewBox="0 0 8 7"
                    width="8"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Checkmark Icon</title>
                    <path
                      d="M1.5 3.48828L3.375 5.36328L6.5 0.988281"
                      stroke="#101828"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>

                  <svg
                    className="hidden dark:block"
                    fill="none"
                    height="7"
                    viewBox="0 0 8 7"
                    width="8"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>Checkmark Icon</title>
                    <path
                      d="M1.5 3.48828L3.375 5.36328L6.5 0.988281"
                      stroke="#FAFAFA"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});
