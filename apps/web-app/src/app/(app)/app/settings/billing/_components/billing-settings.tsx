'use client';

import { BillingNotifications } from './billing-notifications';
import { InvoicesSection } from './invoices-section';
import { PricingSection } from './pricing-section';
import { SubscriptionManagementSection } from './subscription-management-section';
import { SubscriptionStatusSection } from './subscription-status-section';

export function BillingSettings() {
  return (
    <div className="space-y-6">
      <BillingNotifications />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <SubscriptionStatusSection />
          <SubscriptionManagementSection />
          <InvoicesSection />
        </div>
        <div>
          <PricingSection />
        </div>
      </div>
    </div>
  );
}
