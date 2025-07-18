'use client';

import { Button } from '@unhook/ui/button';
import { NeonGradientCard } from '@unhook/ui/magicui/neon-gradient-card';
import { ShimmerButton } from '@unhook/ui/magicui/shimmer-button';
import { WordFadeIn } from '@unhook/ui/magicui/word-fade-in';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ComparisonCTAProps {
  competitor: string;
  ctaText: string;
  description: string;
}

export function ComparisonCTA({
  competitor: _competitor,
  ctaText,
  description,
}: ComparisonCTAProps) {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-6">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <NeonGradientCard className="w-full max-w-4xl mx-auto">
            <div className="p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5" />

              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10"
                initial={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Make the Switch Today
                  </span>
                </div>

                <WordFadeIn
                  className="text-3xl md:text-4xl font-bold mb-4"
                  words={`Ready to ${ctaText}?`}
                />

                <motion.p
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 10 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {description}
                </motion.p>

                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <ShimmerButton className="px-8 py-3 text-lg font-semibold">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </ShimmerButton>
                  <Button
                    className="px-8 py-3 text-lg"
                    size="lg"
                    variant="outline"
                  >
                    Schedule Demo
                  </Button>
                </motion.div>

                <motion.div
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-border/50"
                  initial={{ opacity: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg
                      aria-label="Unhook Logo"
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <title>Unhook Logo</title>
                      <path
                        clipRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                    No credit card required
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg
                      aria-label="Unhook Logo"
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <title>Unhook Logo</title>
                      <path
                        clipRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                    Free forever plan available
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg
                      aria-label="Unhook Logo"
                      className="w-4 h-4 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <title>Unhook Logo</title>
                      <path
                        clipRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                    Setup in 2 minutes
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </NeonGradientCard>
        </motion.div>
      </div>
    </section>
  );
}
