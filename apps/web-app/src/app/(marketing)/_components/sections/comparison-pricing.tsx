'use client';

import { MetricButton } from '@unhook/analytics/components';
import { Badge } from '@unhook/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@unhook/ui/card';
import { BorderBeam } from '@unhook/ui/magicui/border-beam';
import { NeonGradientCard } from '@unhook/ui/magicui/neon-gradient-card';
import { ShimmerButton } from '@unhook/ui/magicui/shimmer-button';
import { Check, Star } from 'lucide-react';
import { motion } from 'motion/react';
import posthog from 'posthog-js';

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
  const handleUnhookCTAClick = (planName: string, planPrice: string) => {
    posthog.capture('comparison_pricing_unhook_cta_clicked', {
      competitor: competitor,
      location: 'comparison_pricing_section',
      plan_name: planName,
      plan_price: planPrice,
      source: 'marketing_site',
    });
  };

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
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg
                  aria-label="Unhook Logo"
                  className="w-8 h-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Unhook Logo</title>
                  <path
                    d="M12 2L2 8v16c0 8.84 6.11 14.41 14 16 7.89-1.59 14-7.16 14-16V8L12 2z"
                    fill="currentColor"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-primary">Unhook</h3>
              </div>
              <p className="text-muted-foreground">
                Built for teams and collaboration
              </p>
            </motion.div>

            <div className="space-y-6">
              {unhookPricing.map((plan, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  key={plan.name}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  {plan.popular ? (
                    <NeonGradientCard className="w-full relative">
                      <div className="p-6">
                        <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground">
                          <Star className="w-4 h-4 mr-1" />
                          Most Popular
                        </Badge>
                        <PricingPlanContent
                          isPopular={true}
                          onCTAClick={() =>
                            handleUnhookCTAClick(plan.name, plan.price)
                          }
                          plan={plan}
                        />
                      </div>
                    </NeonGradientCard>
                  ) : (
                    <Card className="relative">
                      <CardContent className="p-6">
                        <PricingPlanContent
                          isPopular={false}
                          onCTAClick={() =>
                            handleUnhookCTAClick(plan.name, plan.price)
                          }
                          plan={plan}
                        />
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Competitor Pricing */}
          <div>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold mb-2">{competitor}</h3>
              <p className="text-muted-foreground">
                Individual-focused pricing
              </p>
            </motion.div>

            <div className="space-y-6">
              {competitorPricing.map((plan, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  key={plan.name}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className="opacity-75 relative">
                    <CardContent className="p-6">
                      <div className="flex items-baseline gap-2 mb-4">
                        <h4 className="text-xl font-semibold text-muted-foreground">
                          {plan.name}
                        </h4>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-muted-foreground">
                            {plan.price}
                          </span>
                          {plan.period !== 'forever' && (
                            <span className="text-muted-foreground">
                              /{plan.period}
                            </span>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature) => (
                          <li className="flex items-start gap-3" key={feature}>
                            <Check className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <MetricButton
                        className="w-full"
                        disabled
                        metric="comparison_pricing_competitor_plan_clicked"
                        variant="outline"
                      >
                        {competitor} Plan
                      </MetricButton>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-16"
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="relative overflow-hidden">
            <BorderBeam
              colorFrom="hsl(var(--primary))"
              colorTo="hsl(var(--primary))"
              duration={12}
              size={250}
            />
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Why Unhook Offers Better Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.9 }}
                >
                  <h4 className="font-semibold mb-2 text-primary">
                    No Hidden Fees
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Custom domains included, no per-domain charges
                  </p>
                </motion.div>
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: 1.0 }}
                >
                  <h4 className="font-semibold mb-2 text-primary">
                    Team-First Pricing
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Pay per team, not per individual developer
                  </p>
                </motion.div>
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: 1.1 }}
                >
                  <h4 className="font-semibold mb-2 text-primary">
                    More Features
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    VS Code integration, AI testing, and collaboration tools
                  </p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

interface PricingPlanContentProps {
  plan: PricingPlan;
  isPopular: boolean;
  onCTAClick: () => void;
}

function PricingPlanContent({
  plan,
  isPopular,
  onCTAClick,
}: PricingPlanContentProps) {
  return (
    <>
      <div className="flex items-baseline gap-2 mb-4">
        <h4 className="text-xl font-semibold">{plan.name}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{plan.price}</span>
          {plan.period !== 'forever' && (
            <span className="text-muted-foreground">/{plan.period}</span>
          )}
        </div>
      </div>
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature) => (
          <li className="flex items-start gap-3" key={feature}>
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      {isPopular ? (
        <ShimmerButton className="w-full" onClick={onCTAClick}>
          {plan.price === '$0'
            ? 'Start Free'
            : plan.price === 'Custom'
              ? 'Contact Sales'
              : 'Start Trial'}
        </ShimmerButton>
      ) : (
        <MetricButton
          className="w-full"
          metric="comparison_pricing_competitor_cta_clicked"
          onClick={onCTAClick}
          variant={plan.price === '$0' ? 'outline' : 'default'}
        >
          {plan.price === '$0'
            ? 'Start Free'
            : plan.price === 'Custom'
              ? 'Contact Sales'
              : 'Start Trial'}
        </MetricButton>
      )}
    </>
  );
}
