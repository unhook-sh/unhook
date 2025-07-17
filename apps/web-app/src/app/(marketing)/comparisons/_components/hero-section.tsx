'use client';

import { motion } from 'motion/react';

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function HeroSection() {
  return (
    <section className="w-full py-20 lg:py-32 relative">
      <div className="absolute inset-0">
        <div className="absolute inset-0 -z-10 h-[600px] md:h-[800px] w-full [background:radial-gradient(125%_125%_at_50%_10%,var(--background)_40%,var(--secondary)_100%)] rounded-b-xl" />
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          animate="visible"
          className="text-center space-y-8"
          initial="hidden"
          variants={staggerContainer}
        >
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tighter text-balance text-center text-primary"
            variants={fadeInUpVariants}
          >
            How Unhook Compares
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-primary font-semibold text-balance"
            variants={fadeInUpVariants}
          >
            See why teams choose Unhook over other webhook testing tools
          </motion.p>
          <motion.p
            className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed tracking-tight text-balance"
            variants={fadeInUpVariants}
          >
            Compare Unhook with popular webhook testing tools. See why teams
            choose Unhook for better collaboration and VS Code integration.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
