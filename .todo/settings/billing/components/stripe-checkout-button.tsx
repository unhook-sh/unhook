'use client';

import { Button } from '@unhook/ui/button';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { getStripeCheckoutLink } from '../actions';

interface StripeCheckoutButtonProps {
  orgId: string;
}

export function StripeCheckoutButton({ orgId }: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Generate URLs for the checkout process
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/${orgId}/settings/billing`
      : `http://localhost:3000/${orgId}/settings/billing`;

  const successUrl = `${baseUrl}?checkout=success`;
  const cancelUrl = `${baseUrl}?checkout=cancelled`;

  const { execute } = useAction(getStripeCheckoutLink, {
    onError: () => {
      setIsLoading(false);
    },
    onExecute: () => {
      setIsLoading(true);
    },
    onSuccess: (result) => {
      if (result.data?.success && result.data?.data?.url) {
        window.location.href = result.data.data.url;
      }
      setIsLoading(false);
    },
  });

  const handleUpgrade = () => {
    execute({
      cancelUrl,
      meteredPriceLookupKey: 'pro_metered_events',
      orgId,
      priceLookupKey: 'pro_monthly',
      successUrl,
    });
  };

  return (
    <Button disabled={isLoading} onClick={handleUpgrade}>
      {isLoading ? 'Loading...' : 'Upgrade Now'}
    </Button>
  );
}
