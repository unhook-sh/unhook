'use client';

import { Badge } from '@unhook/ui/components/badge';
import { Button } from '@unhook/ui/components/button';
import { Check } from 'lucide-react';

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
}

interface ComparisonPricingProps {
  unhookPricing: PricingPlan[];
  competitorPricing: PricingPlan[];
  competitor: string;
}

export function ComparisonPricing({
  unhookPricing,
  competitorPricing,
  competitor,
}: ComparisonPricingProps) {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pricing Comparison
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Compare pricing plans and get more value with Unhook's team-friendly
            approach.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Unhook Pricing */}
          <div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-primary mb-2">Unhook</h3>
              <p className="text-muted-foreground">
                Built for teams and collaboration
              </p>
            </div>
            <div className="space-y-6">
              {unhookPricing.map((plan) => (
                <div
                  key={plan.name}
                  className={`bg-card border rounded-lg p-6 relative ${
                    plan.popular ? 'border-primary ring-2 ring-primary/20' : ''
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}
                  <div className="flex items-baseline gap-2 mb-4">
                    <h4 className="text-xl font-semibold">{plan.name}</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period !== 'forever' && (
                        <span className="text-muted-foreground">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.price === '$0'
                      ? 'Start Free'
                      : plan.price === 'Custom'
                        ? 'Contact Sales'
                        : 'Start Trial'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Competitor Pricing */}
          <div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">{competitor}</h3>
              <p className="text-muted-foreground">
                Individual-focused pricing
              </p>
            </div>
            <div className="space-y-6">
              {competitorPricing.map((plan) => (
                <div
                  key={plan.name}
                  className="bg-card border rounded-lg p-6 opacity-75"
                >
                  <div className="flex items-baseline gap-2 mb-4">
                    <h4 className="text-xl font-semibold">{plan.name}</h4>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      {plan.period !== 'forever' && (
                        <span className="text-muted-foreground">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" disabled>
                    {competitor} Plan
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Why Unhook Offers Better Value
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <h4 className="font-semibold mb-2">No Hidden Fees</h4>
                <p className="text-sm text-muted-foreground">
                  Custom domains included, no per-domain charges
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Team-First Pricing</h4>
                <p className="text-sm text-muted-foreground">
                  Pay per team, not per individual developer
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">More Features</h4>
                <p className="text-sm text-muted-foreground">
                  VS Code integration, AI testing, and collaboration tools
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
