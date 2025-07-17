'use client';

import { motion } from 'motion/react';

interface SectionHeaderProps {
  title: string;
  description: string;
}

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

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <motion.div
      animate="visible"
      className="text-center mb-16"
      initial="hidden"
      variants={staggerContainer}
    >
      <motion.h2
        className="text-3xl md:text-4xl font-medium tracking-tighter text-balance text-center mb-4"
        variants={fadeInUpVariants}
      >
        {title}
      </motion.h2>
      <motion.p
        className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance"
        variants={fadeInUpVariants}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
