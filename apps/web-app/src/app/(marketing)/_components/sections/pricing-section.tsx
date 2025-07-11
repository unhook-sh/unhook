'use client';

import { cn } from '@unhook/ui/lib/utils';
import { motion } from 'motion/react';
import { useState } from 'react';
import { SectionHeader } from '~/app/(marketing)/_components/section-header';
import { siteConfig } from '~/app/(marketing)/_lib/config';

interface TabsProps {
  activeTab: 'yearly' | 'monthly';
  setActiveTab: (tab: 'yearly' | 'monthly') => void;
  className?: string;
}

function PricingTabs({ activeTab, setActiveTab, className }: TabsProps) {
  return (
    <div
      className={cn(
        'relative flex w-fit items-center rounded-full border p-0.5 backdrop-blur-sm cursor-pointer h-9 flex-row bg-muted',
        className,
      )}
    >
      {['monthly', 'yearly'].map((tab) => (
        <button
          className={cn(
            'relative z-[1] px-2 h-8 flex items-center justify-center cursor-pointer',
            {
              'z-0': activeTab === tab,
            },
          )}
          key={tab}
          onClick={() => setActiveTab(tab as 'yearly' | 'monthly')}
          type="button"
        >
          {activeTab === tab && (
            <motion.div
              className="absolute inset-0 rounded-full bg-white dark:bg-[#3F3F46]  shadow-md border border-border"
              layoutId="active-tab"
              transition={{
                damping: 25,
                duration: 0.2,
                stiffness: 300,
                type: 'spring',
                velocity: 2,
              }}
            />
          )}
          <span
            className={cn(
              'relative block text-sm font-medium duration-200 shrink-0',
              activeTab === tab ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'yearly' && (
              <span className="ml-2 text-xs font-semibold text-secondary bg-secondary/15 py-0.5 w-[calc(100%+1rem)] px-1 rounded-full">
                -20%
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    'monthly',
  );

  // Update price animation
  const PriceDisplay = ({
    tier,
  }: {
    tier: (typeof siteConfig.pricing.pricingItems)[0];
  }) => {
    const price = billingCycle === 'yearly' ? tier.yearlyPrice : tier.price;

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
        <div className="absolute -top-14 left-1/2 -translate-x-1/2">
          <PricingTabs
            activeTab={billingCycle}
            className="mx-auto"
            setActiveTab={setBillingCycle}
          />
        </div>

        <div className="grid min-[650px]:grid-cols-2 min-[900px]:grid-cols-3 gap-4 w-full max-w-6xl mx-auto px-6">
          {siteConfig.pricing.pricingItems.map((tier) => (
            <div
              className={cn(
                'rounded-xl grid grid-rows-[180px_auto_1fr] relative h-fit min-[650px]:h-full min-[900px]:h-fit',
                tier.isPopular
                  ? 'md:shadow-[0px_61px_24px_-10px_rgba(0,0,0,0.01),0px_34px_20px_-8px_rgba(0,0,0,0.05),0px_15px_15px_-6px_rgba(0,0,0,0.09),0px_4px_8px_-2px_rgba(0,0,0,0.10),0px_0px_0px_1px_rgba(0,0,0,0.08)] bg-accent'
                  : 'bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] border border-border',
              )}
              key={tier.name}
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
                  <PriceDisplay tier={tier} />
                  <span className="ml-2">
                    /{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                <p className="text-sm mt-2">{tier.description}</p>
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
                  {tier.buttonText}
                </button>
              </div>
              <hr className="border-border dark:border-white/20" />
              <div className="p-4">
                {tier.name !== 'Basic' && (
                  <p className="text-sm mb-4">
                    Everything in {tier.name === 'Pro' ? 'Basic' : 'Pro'} +
                  </p>
                )}
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li className="flex items-center gap-2" key={feature}>
                      <div
                        className={cn(
                          'size-5 rounded-full border border-primary/20 flex items-center justify-center',
                          tier.isPopular &&
                            'bg-muted-foreground/40 border-border',
                        )}
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
          ))}
        </div>
      </div>
    </section>
  );
}
