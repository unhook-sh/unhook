'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { HeroTerminalSection } from '~/app/(marketing)/_components/sections/hero-terminal-section';
import { siteConfig } from '~/app/(marketing)/_lib/config';

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const terminalVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.4,
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export function HeroSection() {
  const { hero } = siteConfig;

  return (
    <section id="hero" className="w-full relative">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-[600px] md:h-[800px] w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--secondary)_100%)] rounded-b-xl" />
        </div>
        <motion.div
          className="relative z-10 pt-24 max-w-3xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            className="border border-border bg-accent rounded-full text-sm h-8 px-3 flex items-center gap-2"
            variants={fadeInUpVariants}
          >
            {hero.badgeIcon}
            {hero.badge}
          </motion.p>
          <motion.div
            className="flex flex-col items-center justify-center gap-5"
            variants={staggerContainer}
          >
            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance text-center text-primary"
              variants={fadeInUpVariants}
            >
              {hero.title}
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight"
              variants={fadeInUpVariants}
            >
              {hero.description}
            </motion.p>
          </motion.div>
          <motion.div
            className="flex flex-col md:flex-row items-center gap-2.5 flex-wrap justify-center"
            variants={fadeInUpVariants}
          >
            <Link
              href={hero.cta.primary.href}
              className="bg-secondary h-9 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-48 px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12] hover:bg-secondary/80 transition-all ease-out active:scale-95"
            >
              {hero.cta.primary.text}
            </Link>
            <Link
              href={hero.cta.secondary.href}
              className="h-10 flex items-center justify-center w-48 px-5 text-sm font-normal tracking-wide text-primary rounded-full transition-all ease-out active:scale-95 bg-white dark:bg-background border border-[#E5E7EB] dark:border-[#27272A] hover:bg-white/80 dark:hover:bg-background/80"
            >
              {hero.cta.secondary.text}
            </Link>
          </motion.div>
        </motion.div>
      </div>
      <motion.div
        className="w-full"
        variants={terminalVariants}
        initial="hidden"
        animate="visible"
      >
        <HeroTerminalSection />
      </motion.div>
    </section>
  );
}
