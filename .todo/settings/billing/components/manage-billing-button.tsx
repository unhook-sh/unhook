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
    onError: () => {
      setIsLoading(false);
    },
    onExecute: () => {
      setIsLoading(true);
    },
    onSuccess: (result) => {
      if (result.data?.success && result.data?.data?.url) {
        window.open(result.data.data.url, '_blank', 'noopener,noreferrer');
      }
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
      disabled={isLoading}
      onClick={handleManageBilling}
      variant="outline"
    >
      {isLoading ? 'Loading...' : 'Manage Billing'}
    </Button>
  );
}
