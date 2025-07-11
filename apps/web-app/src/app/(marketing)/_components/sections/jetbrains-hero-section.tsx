'use client';

import { AnimatedBeam } from '@unhook/ui/magicui/animated-beam';
import { BorderBeam } from '@unhook/ui/magicui/border-beam';
import { ShimmerButton } from '@unhook/ui/magicui/shimmer-button';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRef } from 'react';

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

const JetBrainsMockup = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative w-full max-w-4xl mx-auto bg-[#2B2D30] rounded-lg overflow-hidden shadow-2xl border border-gray-700"
      ref={containerRef}
    >
      <BorderBeam delay={9} duration={12} size={250} />

      {/* JetBrains Title Bar */}
      <div className="flex items-center justify-between bg-[#3C3F41] px-4 py-2 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="text-sm text-gray-300 ml-4">
            webhook-app - IntelliJ IDEA
          </div>
        </div>
        <div className="text-xs text-gray-400">Unhook Plugin Active</div>
      </div>

      <div className="flex h-96">
        {/* Tool Window Sidebar */}
        <div className="w-64 bg-[#313335] border-r border-gray-600 p-4">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <svg
                aria-label="JetBrains Icon"
                className="text-orange-500"
                height="16"
                viewBox="0 0 16 16"
                width="16"
              >
                <title>JetBrains Icon</title>
                <path d="M0 0h16v16H0V0Z" fill="url(#jetbrains-gradient)" />
                <path d="M2 2h5v5H2V2Z" fill="currentColor" />
                <path d="M9 2h5v5H9V2Z" fill="currentColor" />
                <path d="M2 9h5v5H2V9Z" fill="currentColor" />
                <path d="M9 9h5v5H9V9Z" fill="currentColor" />
                <defs>
                  <linearGradient
                    id="jetbrains-gradient"
                    x1="0%"
                    x2="100%"
                    y1="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#FF6B00" />
                    <stop offset="100%" stopColor="#FF8C00" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="text-white font-medium">UNHOOK</span>
            </div>
            <div className="text-xs text-gray-400 mb-3">Webhook Events (4)</div>
          </div>

          {/* Event List */}
          <div className="space-y-2">
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="p-2 bg-[#4C5052] rounded text-sm text-white cursor-pointer hover:bg-[#515658] transition-colors"
              initial={{ opacity: 0, x: -20 }}
              ref={div1Ref}
              transition={{ delay: 2, duration: 0.5 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-green-400">stripe.payment.succeeded</span>
                <span className="text-xs text-gray-400">200</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">2s ago</div>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="p-2 bg-[#3D4143] rounded text-sm text-white cursor-pointer hover:bg-[#515658] transition-colors"
              initial={{ opacity: 0, x: -20 }}
              ref={div2Ref}
              transition={{ delay: 2.3, duration: 0.5 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-blue-400">github.push</span>
                <span className="text-xs text-gray-400">200</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">5s ago</div>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="p-2 bg-[#3D4143] rounded text-sm text-white cursor-pointer hover:bg-[#515658] transition-colors"
              initial={{ opacity: 0, x: -20 }}
              ref={div3Ref}
              transition={{ delay: 2.6, duration: 0.5 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-purple-400">clerk.user.updated</span>
                <span className="text-xs text-red-400">500</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">12s ago</div>
            </motion.div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 bg-[#2B2D30] p-4">
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Event Details</div>
            <div className="bg-[#1E1F22] rounded p-4 font-mono text-sm border border-gray-600">
              <motion.div
                animate={{ opacity: 1 }}
                className="text-green-400"
                initial={{ opacity: 0 }}
                transition={{ delay: 3, duration: 0.5 }}
              >
                {`{
  "event": "payment.succeeded",
  "data": {
    "id": "pi_1234567890",
    "amount": 2000,
    "currency": "usd",
    "status": "succeeded",
    "created": 1640995200
  }
}`}
              </motion.div>
            </div>
          </div>

          <div className="flex space-x-2">
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
              initial={{ opacity: 0, y: 10 }}
              transition={{ delay: 3.5, duration: 0.5 }}
            >
              Replay Event
            </motion.button>
            <motion.button
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              initial={{ opacity: 0, y: 10 }}
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
        curvature={-75}
        duration={3}
        endYOffset={-10}
        fromRef={div1Ref}
        toRef={div2Ref}
      />
    </div>
  );
};

export function JetBrainsHeroSection() {
  return (
    <section className="w-full relative" id="hero">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="absolute inset-0">
          <div className="absolute inset-0 -z-10 h-[800px] md:h-[1000px] w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--secondary)_100%)] rounded-b-xl" />
        </div>

        <motion.div
          animate="visible"
          className="relative z-10 pt-24 max-w-5xl mx-auto h-full w-full flex flex-col gap-10 items-center justify-center"
          initial="hidden"
          variants={staggerContainer}
        >
          <motion.p
            className="border border-border bg-accent rounded-full text-sm h-8 px-3 flex items-center gap-2"
            variants={fadeInUpVariants}
          >
            <svg
              aria-label="JetBrains Icon"
              className="text-orange-500"
              height="16"
              viewBox="0 0 16 16"
              width="16"
            >
              <title>JetBrains Icon</title>
              <rect
                fill="url(#jetbrains-gradient-badge)"
                height="16"
                rx="2"
                width="16"
              />
              <text
                fill="white"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
                x="8"
                y="12"
              >
                JB
              </text>
              <defs>
                <linearGradient
                  id="jetbrains-gradient-badge"
                  x1="0%"
                  x2="100%"
                  y1="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#FF6B00" />
                  <stop offset="100%" stopColor="#FF8C00" />
                </linearGradient>
              </defs>
            </svg>
            Now available for JetBrains IDEs
          </motion.p>

          <motion.div
            className="flex flex-col items-center justify-center gap-5"
            variants={staggerContainer}
          >
            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium tracking-tighter text-balance text-center text-primary"
              variants={fadeInUpVariants}
            >
              Webhook Testing for
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                JetBrains IDEs
              </span>
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-center text-muted-foreground font-medium text-balance leading-relaxed tracking-tight max-w-2xl"
              variants={fadeInUpVariants}
            >
              Debug webhooks directly in IntelliJ IDEA, WebStorm, PyCharm, and
              all JetBrains IDEs. Seamless integration with your development
              workflow.
            </motion.p>
          </motion.div>

          <motion.div
            className="flex flex-col md:flex-row items-center gap-2.5 flex-wrap justify-center"
            variants={fadeInUpVariants}
          >
            <Link href="https://plugins.jetbrains.com/plugin/unhook">
              <ShimmerButton className="shadow-2xl">
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                  Install Plugin
                </span>
              </ShimmerButton>
            </Link>
            <Link
              className="h-10 flex items-center justify-center w-48 px-5 text-sm font-normal tracking-wide text-primary rounded-full transition-all ease-out active:scale-95 bg-white dark:bg-background border border-[#E5E7EB] dark:border-[#27272A] hover:bg-white/80 dark:hover:bg-background/80"
              href="https://docs.unhook.sh/jetbrains"
            >
              View Documentation
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full mt-16 px-4"
        initial={{ opacity: 0, y: 40 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <JetBrainsMockup />
      </motion.div>
    </section>
  );
}
