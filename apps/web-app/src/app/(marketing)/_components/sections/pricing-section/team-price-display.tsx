'use client';

import { memo } from 'react';

interface TeamPriceDisplayProps {
  price: number;
  seats: number;
  billingCycle: 'monthly' | 'yearly';
  betaFree?: boolean;
}

export const TeamPriceDisplay = memo(function TeamPriceDisplay({
  price,
  seats,
  billingCycle,
  betaFree,
}: TeamPriceDisplayProps) {
  if (betaFree) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold line-through text-muted-foreground">
            ${price}
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
    <div className="flex flex-col items-center">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-semibold">${price}</span>
        <span className="text-base text-muted-foreground font-medium">
          /{billingCycle === 'yearly' ? 'month' : 'month'}
        </span>
      </div>
      <div className="mt-2 text-sm text-muted-foreground self-start">
        for {seats} {seats === 1 ? 'seat' : 'seats'}
      </div>
    </div>
  );
});
