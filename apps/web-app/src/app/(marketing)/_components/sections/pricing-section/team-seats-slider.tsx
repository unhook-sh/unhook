'use client';

import { Slider } from '@unhook/ui/slider';
import { memo } from 'react';
import { TEAM_PRICING } from '~/app/(marketing)/_lib/config';

interface TeamSeatsSliderProps {
  seats: number;
  onSeatsChange: (seats: number) => void;
  billingCycle: 'monthly' | 'yearly';
  includedSeats: number;
}

export const TeamSeatsSlider = memo(function TeamSeatsSlider({
  seats,
  onSeatsChange,
  billingCycle,
  includedSeats,
}: TeamSeatsSliderProps) {
  const handleChange = (value: number[]) => {
    onSeatsChange(value[0] ?? 1);
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Team size</span>
        <span>
          {seats} {seats === 1 ? 'seat' : 'seats'}
        </span>
      </div>
      <Slider
        className="w-full"
        defaultValue={[TEAM_PRICING.DEFAULT_SEATS]}
        max={TEAM_PRICING.MAX_SEATS}
        min={1}
        onValueChange={handleChange}
        step={1}
      />
      <div className="text-xs text-muted-foreground">
        {includedSeats} developer included, $
        {billingCycle === 'yearly'
          ? TEAM_PRICING.PRICE_PER_SEAT_YEARLY
          : TEAM_PRICING.PRICE_PER_SEAT_MONTHLY}
        /additional developer
      </div>
    </div>
  );
});
