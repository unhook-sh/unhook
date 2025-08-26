'use client';

import { MetricLink } from '@unhook/analytics/components';
import { ScriptCopyBtn } from '@unhook/ui/magicui/script-copy-btn';
import { motion } from 'motion/react';
import posthog from 'posthog-js';
import { Suspense } from 'react';
import { ExtensionDropdown } from '~/app/(marketing)/_components/sections/extension-dropdown';
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
              <MetricLink
                className="flex items-center gap-2"
                href={hero.badgeUrl}
                metric="hero_badge_clicked"
                properties={{
                  badge_text: hero.badge,
                  badge_url: hero.badgeUrl,
                  location: 'hero_section',
                }}
              >
                {hero.badgeIcon}
                {hero.badge}
              </MetricLink>
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
              onCopy={() => {
                posthog.capture('hero_command_copied', {
                  command_type: 'cli_install',
                  location: 'hero_section',
                });
              }}
            />
            <div className="flex flex-col md:flex-row items-center gap-2.5 flex-wrap justify-center">
              <ExtensionDropdown />
              <MetricLink
                className="h-10 flex items-center justify-center w-48 px-5 text-sm font-normal tracking-wide text-primary rounded-full transition-all ease-out active:scale-95 bg-white dark:bg-background border border-[#E5E7EB] dark:border-[#27272A] hover:bg-white/80 dark:hover:bg-background/80"
                href={hero.cta.secondary.href}
                metric="hero_secondary_cta_clicked"
                properties={{
                  cta_text: hero.cta.secondary.text,
                  location: 'hero_section',
                  source: 'marketing_site',
                }}
              >
                {hero.cta.secondary.text}
              </MetricLink>
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
