'use client';

import { Button } from '@unhook/ui/components/button';
import { cn } from '@unhook/ui/lib/utils';
import { CheckIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'default' | 'outline' | 'secondary';
  highlight?: boolean;
  href: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Self-Hosted',
    price: '$0',
    description: 'Perfect for individual developers and open source projects',
    features: [
      'Unlimited webhooks',
      'Self-hosted deployment',
      'Basic monitoring',
      'Community support',
      'Open source',
    ],
    buttonText: 'Get Started',
    buttonVariant: 'outline',
    href: 'https://github.com/unhook-sh/unhook',
  },
  {
    name: 'Team',
    price: '$49',
    description: 'For growing teams that need collaboration features',
    features: [
      'Everything in Self-Hosted',
      '1 user included',
      '$5 per additional team member',
      'Shared webhook URLs',
      'Team management',
      'Priority support',
      'Advanced monitoring & analytics',
      'Custom domains',
    ],
    buttonText: 'Start Free Trial',
    buttonVariant: 'default',
    highlight: true,
    href: '/webhooks/create?utm_source=pricing&utm_medium=team',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For teams with 25+ members and advanced requirements',
    features: [
      'Everything in Team',
      'Unlimited users',
      'SSO/SAML authentication',
      'Advanced security & compliance',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantees',
      'On-premise deployment option',
    ],
    buttonText: 'Schedule Call',
    buttonVariant: 'secondary',
    href: 'https://cal.com/unhook/enterprise-demo',
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>(
    'monthly',
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Start free with self-hosting, or upgrade for team collaboration
            features. No credit card required.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <span
            className={cn(
              'text-sm font-medium',
              billingPeriod === 'monthly'
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingPeriod(
                billingPeriod === 'monthly' ? 'yearly' : 'monthly',
              )
            }
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            type="button"
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
                billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <span
            className={cn(
              'text-sm font-medium',
              billingPeriod === 'yearly'
                ? 'text-primary'
                : 'text-muted-foreground',
            )}
          >
            Yearly (save 20%)
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'relative rounded-2xl border bg-card p-8 shadow-sm',
                tier.highlight && 'border-primary shadow-lg',
              )}
            >
              {tier.highlight && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className="flex flex-col h-full">
                <div>
                  <h3 className="text-xl font-semibold text-primary">
                    {tier.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight text-primary">
                      {tier.price === 'Custom'
                        ? tier.price
                        : tier.price === '$0'
                        ? '$0'
                        : billingPeriod === 'yearly'
                        ? `$${Math.round(
                            parseInt(tier.price.slice(1)) * 12 * 0.8,
                          )}`
                        : tier.price}
                    </span>
                    {tier.price !== 'Custom' && tier.price !== '$0' && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        /{billingPeriod === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mt-8 space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="ml-3 text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={tier.buttonVariant}
                  className="mt-8 w-full"
                  asChild
                >
                  <Link href={tier.href}>{tier.buttonText}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-primary">
            Frequently asked questions
          </h2>

          <div className="mt-12 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-primary">
                What's included in the free tier?
              </h3>
              <p className="mt-2 text-muted-foreground">
                The self-hosted version includes all core webhook testing
                features. You can run it on your own infrastructure with
                unlimited webhooks and basic monitoring.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary">
                How does team pricing work?
              </h3>
              <p className="mt-2 text-muted-foreground">
                The Team plan starts at $49/month (or $470/year with 20%
                discount) with 1 user included. Each additional team member is
                $5/month. For example, a team of 10 would pay $49 + (9 × $5) =
                $94/month.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary">
                When should I consider Enterprise?
              </h3>
              <p className="mt-2 text-muted-foreground">
                If your team has 25+ members or needs advanced features like
                SSO, custom integrations, or SLA guarantees, the Enterprise plan
                is the best fit. Contact us for custom pricing.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary">
                Can I switch between plans?
              </h3>
              <p className="mt-2 text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes
                take effect immediately and are prorated.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary">
                Do you offer a free trial?
              </h3>
              <p className="mt-2 text-muted-foreground">
                Yes, the Team plan includes a 14-day free trial. No credit card
                required. You can also use the self-hosted version indefinitely
                for free.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
