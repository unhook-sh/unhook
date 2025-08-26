'use client';

import { MetricButton, MetricLink } from '@unhook/analytics/components';
import { MagicCard } from '@unhook/ui/magicui/magic-card';
import { motion } from 'motion/react';

export function CTASection() {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-6">
        <motion.div
          animate="visible"
          className="group"
          initial="hidden"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          whileHover={{
            scale: 1.01,
            transition: { duration: 0.2, ease: 'easeOut' },
            y: -2,
          }}
        >
          <MagicCard
            className="p-12 transition-all duration-300 group-hover:shadow-lg"
            gradientColor="var(--muted)"
            gradientFrom="var(--primary)"
            gradientOpacity={0.6}
            gradientTo="var(--secondary)"
          >
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-balance text-center mb-4">
                Ready to See the Difference?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
                Join developers who've made the switch to better webhook testing
                with team collaboration and VS Code integration.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <MetricButton
                  asChild
                  className="rounded-full"
                  metric="comparisons_cta_create_webhook_url_clicked"
                  properties={{
                    location: 'comparisons_cta',
                  }}
                  size="lg"
                  variant="secondary"
                >
                  <MetricLink
                    href="/app/onboarding?utm_source=marketing-site&utm_medium=comparisons-cta"
                    metric="comparisons_cta_create_webhook_url_clicked"
                    properties={{
                      location: 'comparisons_cta',
                    }}
                  >
                    Install Extension
                  </MetricLink>
                </MetricButton>
                <MetricButton
                  asChild
                  className="rounded-full"
                  metric="comparisons_cta_schedule_demo_clicked"
                  properties={{
                    location: 'comparisons_cta',
                  }}
                  size="lg"
                  variant="outline"
                >
                  <MetricLink
                    href="https://cal.com/seawatts/30min"
                    metric="comparisons_cta_schedule_demo_clicked"
                    properties={{
                      location: 'comparisons_cta',
                    }}
                  >
                    Schedule Demo
                  </MetricLink>
                </MetricButton>
              </div>
            </div>
          </MagicCard>
        </motion.div>
      </div>
    </section>
  );
}
