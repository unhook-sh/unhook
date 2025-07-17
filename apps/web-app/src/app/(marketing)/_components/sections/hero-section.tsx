'use client';

import { ScriptCopyBtn } from '@unhook/ui/magicui/script-copy-btn';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Suspense } from 'react';
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
    transition: {
      delay: 0.4,
      duration: 0.8,
    },
    y: 0,
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

  // biome-ignore assist/source/useSortedKeys: we need to keep the order of the package managers
  const commandMap = {
    npm: 'npm install -g @unhook/cli',
    pnpm: 'pnpm add -g @unhook/cli',
    yarn: 'yarn global add @unhook/cli',
    bun: 'bun add -g @unhook/cli',
  };

  return (
    <section className="w-full relative" id="hero">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-[600px] md:h-[800px] w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--secondary)_100%)] rounded-b-xl" />
        </div>
        <motion.div
          animate="visible"
          className="relative z-10 pt-24 max-w-3xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center"
          initial="hidden"
          variants={staggerContainer}
        >
          <motion.div
            className="border border-border bg-accent rounded-full text-sm h-8 px-3 flex items-center gap-2 hover:bg-accent/50 transition-colors"
            variants={fadeInUpVariants}
          >
            {hero.badgeUrl ? (
              <Link className="flex items-center gap-2" href={hero.badgeUrl}>
                {hero.badgeIcon}
                {hero.badge}
              </Link>
            ) : (
              <>
                {hero.badgeIcon}
                {hero.badge}
              </>
            )}
          </motion.div>
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
            className="flex flex-col items-center gap-6"
            variants={fadeInUpVariants}
          >
            <ScriptCopyBtn
              className="w-full max-w-md"
              codeLanguage="bash"
              commandMap={commandMap}
              darkTheme="none"
              lightTheme="none"
              showMultiplePackageOptions={true}
            />
            <div className="flex flex-col md:flex-row items-center gap-2.5 flex-wrap justify-center">
              <Link
                className="bg-secondary h-9 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-48 px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12] hover:bg-secondary/80 transition-all ease-out active:scale-95"
                href={hero.cta.primary.href}
              >
                {hero.cta.primary.text}
              </Link>
              <Link
                className="h-10 flex items-center justify-center w-48 px-5 text-sm font-normal tracking-wide text-primary rounded-full transition-all ease-out active:scale-95 bg-white dark:bg-background border border-[#E5E7EB] dark:border-[#27272A] hover:bg-white/80 dark:hover:bg-background/80"
                href={hero.cta.secondary.href}
              >
                {hero.cta.secondary.text}
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
      <motion.div
        animate="visible"
        className="w-full"
        initial="hidden"
        variants={terminalVariants}
      >
        <Suspense
          fallback={
            <div className="w-full h-[500px] bg-muted animate-pulse rounded-lg" />
          }
        >
          <HeroTerminalSection />
        </Suspense>
      </motion.div>
    </section>
  );
}
