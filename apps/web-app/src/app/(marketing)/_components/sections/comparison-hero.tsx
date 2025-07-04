'use client';

import { Badge } from '@unhook/ui/components/badge';
import { Button } from '@unhook/ui/components/button';
import { motion } from 'motion/react';
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
  return (
    <section id="hero" className="w-full py-20 lg:py-32">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: BLUR_FADE_DELAY }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
                aria-label="Unhook Logo"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: BLUR_FADE_DELAY * 2 }}
            className="space-y-4"
          >
            <Badge variant="outline" className="px-4 py-2">
              Comparison Guide
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-primary font-semibold">
              {subtitle}
            </p>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: BLUR_FADE_DELAY * 3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" className="px-8">
              Try Unhook Free
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              View Full Comparison
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
