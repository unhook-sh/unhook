'use client';

import { BillingNotifications } from './billing-notifications';
import { InvoicesSection } from './invoices-section';
import { PricingSection } from './pricing-section';
import { SubscriptionStatusSection } from './subscription-status-section';

interface BillingSettingsProps {
  org: {
    id: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionStatus?: string | null;
  };
  success?: string;
  canceled?: string;
}

export function BillingSettings({
  org,
  success,
  canceled,
}: BillingSettingsProps) {
  return (
    <div>
      <BillingNotifications canceled={canceled} success={success} />

      <div className="flex-1 xl:max-w-1/2 space-y-6">
        <SubscriptionStatusSection org={org} />
        <InvoicesSection org={org} />
      </div>
      <div className="flex-1">
        <PricingSection />
      </div>
    </div>
  );
}
