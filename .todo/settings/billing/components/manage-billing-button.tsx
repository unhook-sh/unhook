'use client';

import { Button } from '@unhook/ui/button';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { getStripePortalLink } from '../actions';

interface ManageBillingButtonProps {
  orgId: string;
}

export function ManageBillingButton({ orgId }: ManageBillingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { execute } = useAction(getStripePortalLink, {
    onExecute: () => {
      setIsLoading(true);
    },
    onSuccess: (result) => {
      if (result.data?.success && result.data?.data?.url) {
        window.open(result.data.data.url, '_blank', 'noopener,noreferrer');
      }
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  const handleManageBilling = () => {
    execute({
      orgId,
      returnUrl: window.location.href,
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleManageBilling}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : 'Manage Billing'}
    </Button>
  );
}
