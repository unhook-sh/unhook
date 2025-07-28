'use client';

import { useState } from 'react';
import { SectionHeader } from '~/app/(marketing)/_components/section-header';
import { siteConfig } from '~/app/(marketing)/_lib/config';
import { PricingCard } from './pricing-card';
import { PricingTabs } from './pricing-tabs';

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    'yearly',
  );

  return (
    <section
      className="flex flex-col items-center justify-center gap-10 pb-10 w-full relative"
      id="pricing"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          {siteConfig.pricing.title}
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          {siteConfig.pricing.description}
        </p>
      </SectionHeader>
      <div className="relative w-full h-full">
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-full">
          <PricingTabs
            activeTab={billingCycle}
            className="mx-auto"
            setActiveTab={setBillingCycle}
          />
        </div>

        <div className="grid min-[650px]:grid-cols-2 min-[900px]:grid-cols-3 gap-4 w-full max-w-6xl mx-auto px-6">
          {siteConfig.pricing.pricingItems.map((tier) => (
            <PricingCard
              billingCycle={billingCycle}
              key={tier.name}
              tier={tier}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
