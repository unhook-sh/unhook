'use client';

import { motion } from 'motion/react';
import { comparisonMatrix, competitors } from '../_data/competitors';
import { ComparisonMatrix } from './comparison-matrix';
import { CompetitorCard } from './competitor-card';
import { CTASection } from './cta-section';
import { HeroSection } from './hero-section';
import { SectionHeader } from './section-header';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function ComparisonsContent() {
  return (
    <main className="flex flex-col items-center justify-center divide-y divide-border min-h-screen w-full">
      <HeroSection />

      {/* Competitor Cards */}
      <section className="w-full py-12">
        <div className="container mx-auto px-6">
          {/* <SectionHeader
            description="In-depth analysis of how Unhook compares to each major competitor in the webhook testing space."
            title="Detailed Competitor Comparisons"
          /> */}

          <motion.div
            animate="visible"
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            variants={staggerContainer}
          >
            {competitors.map((competitor, index) => (
              <CompetitorCard
                competitor={competitor}
                index={index}
                key={competitor.name}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section className="w-full py-20">
        <div className="container mx-auto px-6">
          <SectionHeader
            description="Quick overview of key features across all webhook testing platforms."
            title="Feature Comparison Matrix"
          />

          <ComparisonMatrix comparisonMatrix={comparisonMatrix} />
        </div>
      </section>

      <CTASection />
    </main>
  );
}
