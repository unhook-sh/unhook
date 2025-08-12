'use client';

import { MetricButton } from '@unhook/analytics/components';
import { Badge } from '@unhook/ui/badge';
import { AnimatedShinyText } from '@unhook/ui/magicui/animated-shiny-text';
import { ShimmerButton } from '@unhook/ui/magicui/shimmer-button';
import { WordFadeIn } from '@unhook/ui/magicui/word-fade-in';
import { motion } from 'motion/react';
import posthog from 'posthog-js';
import { BLUR_FADE_DELAY } from '../../_lib/config';

interface ComparisonHeroProps {
  title: string;
  subtitle: string;
  description: string;
  competitorLogo?: React.ReactNode;
}

export function ComparisonHero({
  title,
  subtitle,
  description,
  competitorLogo,
}: ComparisonHeroProps) {
  const handleTryUnhookFreeClick = () => {
    posthog.capture('comparison_hero_try_unhook_free_clicked', {
      location: 'comparison_hero_section',
      source: 'marketing_site',
    });
  };

  const handleViewFullComparisonClick = () => {
    posthog.capture('comparison_hero_view_full_comparison_clicked', {
      location: 'comparison_hero_section',
      source: 'marketing_site',
    });
  };

  return (
    <section
      className="w-full py-20 lg:py-32 relative overflow-hidden"
      id="hero"
    >
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: BLUR_FADE_DELAY, duration: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <svg
                aria-label="Unhook Logo"
                className="text-primary"
                fill="none"
                height="32"
                viewBox="0 0 32 32"
                width="32"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Unhook Logo</title>
                <path
                  d="M16 2L2 8v16c0 8.84 6.11 14.41 14 16 7.89-1.59 14-7.16 14-16V8L16 2z"
                  fill="currentColor"
                />
              </svg>
              <span className="font-bold text-xl">Unhook</span>
            </div>
            <span className="text-2xl text-muted-foreground">vs</span>
            {competitorLogo && (
              <div className="flex items-center">{competitorLogo}</div>
            )}
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: BLUR_FADE_DELAY * 2, duration: 0.5 }}
          >
            <Badge
              className="px-4 py-2 border-primary/20 bg-primary/5"
              variant="outline"
            >
              <AnimatedShinyText className="text-primary">
                Comparison Guide
              </AnimatedShinyText>
            </Badge>

            <WordFadeIn
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
              words={title}
            />

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-xl md:text-2xl text-primary font-semibold"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: BLUR_FADE_DELAY * 3, duration: 0.5 }}
            >
              {subtitle}
            </motion.p>

            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: BLUR_FADE_DELAY * 4, duration: 0.5 }}
            >
              {description}
            </motion.p>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: BLUR_FADE_DELAY * 5, duration: 0.5 }}
          >
            <ShimmerButton
              className="px-8 py-3 text-lg font-semibold"
              onClick={handleTryUnhookFreeClick}
            >
              Try Unhook Free
            </ShimmerButton>
            <MetricButton
              className="px-8"
              metric="comparison_hero_view_full_comparison_clicked"
              onClick={handleViewFullComparisonClick}
              size="lg"
              variant="outline"
            >
              View Full Comparison
            </MetricButton>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
