'use client';

import { AnimatedBeam } from '@unhook/ui/magicui/animated-beam';
import { BorderBeam } from '@unhook/ui/magicui/border-beam';
import { ShimmerButton } from '@unhook/ui/magicui/shimmer-button';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';
import { siteConfig } from '~/app/(marketing)/_lib/config';

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
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

const VSCodeMockup = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto bg-[#1e1e1e] rounded-lg overflow-hidden shadow-2xl border border-gray-800"
    >
      <BorderBeam size={250} duration={12} delay={9} />

      {/* VS Code Title Bar */}
      <div className="flex items-center justify-between bg-[#323233] px-4 py-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="text-sm text-gray-300 ml-4">
            webhook-app - Visual Studio Code
          </div>
        </div>
        <div className="text-xs text-gray-400">Unhook Extension Active</div>
      </div>

      <div className="flex h-96">
        {/* Sidebar */}
        <div className="w-64 bg-[#252526] border-r border-gray-700 p-4">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className="text-blue-400"
                aria-label="VS Code Icon"
              >
                <title>VS Code Icon</title>
                <path
                  fill="currentColor"
                  d="M11.2 1.04L4.8 0.04C4.64 0.02 4.48 0.06 4.34 0.16L0.34 3.16C0.12 3.32 0 3.58 0 3.86V12.14C0 12.42 0.12 12.68 0.34 12.84L4.34 15.84C4.48 15.94 4.64 15.98 4.8 15.96L11.2 14.96C11.64 14.9 12 14.52 12 14.06V1.94C12 1.48 11.64 1.1 11.2 1.04ZM10 13.5L5.5 14.25V1.75L10 2.5V13.5ZM2 4.5L4 3V13L2 11.5V4.5Z"
                />
              </svg>
              <span className="text-white font-medium">UNHOOK</span>
            </div>
            <div className="text-xs text-gray-400 mb-3">Events (4)</div>
          </div>

          {/* Event List */}
          <div className="space-y-2">
            <motion.div
              ref={div1Ref}
              className="p-2 bg-[#37373d] rounded text-sm text-white cursor-pointer hover:bg-[#404040] transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-green-400">stripe.payment</span>
                <span className="text-xs text-gray-400">200</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">2s ago</div>
            </motion.div>

            <motion.div
              ref={div2Ref}
              className="p-2 bg-[#2d2d30] rounded text-sm text-white cursor-pointer hover:bg-[#404040] transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.3, duration: 0.5 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-blue-400">github.push</span>
                <span className="text-xs text-gray-400">200</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">5s ago</div>
            </motion.div>

            <motion.div
              ref={div3Ref}
              className="p-2 bg-[#2d2d30] rounded text-sm text-white cursor-pointer hover:bg-[#404040] transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2.6, duration: 0.5 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-purple-400">clerk.user</span>
                <span className="text-xs text-red-400">500</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">12s ago</div>
            </motion.div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#1e1e1e] p-4">
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Event Details</div>
            <div className="bg-[#2d2d30] rounded p-4 font-mono text-sm">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3, duration: 0.5 }}
                className="text-green-400"
              >
                {`{
  "event": "payment.succeeded",
  "data": {
    "id": "pi_1234567890",
    "amount": 2000,
    "currency": "usd",
    "status": "succeeded"
  },
  "created": 1640995200
}`}
              </motion.div>
            </div>
          </div>

          <div className="flex space-x-2">
            <motion.button
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.5, duration: 0.5 }}
            >
              Replay Event
            </motion.button>
            <motion.button
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.7, duration: 0.5 }}
            >
              Copy Event
            </motion.button>
          </div>
        </div>
      </div>

      {/* Animated Beams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div2Ref}
        curvature={-75}
        endYOffset={-10}
        duration={3}
      />
    </div>
  );
};

export function VSCodeHeroSection() {
  const { hero } = siteConfig;

  return (
    <section id="hero" className="w-full relative">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-[800px] md:h-[1000px] w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--secondary)_100%)] rounded-b-xl" />
        </div>

        <motion.div
          className="relative z-10 pt-24 max-w-5xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center"
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
              className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-2xl"
              variants={fadeInUpVariants}
            >
              {hero.description}
            </motion.p>
          </motion.div>

          <motion.div
            className="flex flex-col md:flex-row items-center gap-2.5 flex-wrap justify-center"
            variants={fadeInUpVariants}
          >
            <Link href={hero.cta.primary.href}>
              <ShimmerButton className="shadow-2xl">
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                  {hero.cta.primary.text}
                </span>
              </ShimmerButton>
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
        className="w-full mt-16 px-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <VSCodeMockup />
      </motion.div>
    </section>
  );
}
