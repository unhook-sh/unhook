'use client';

import { cn } from '@unhook/ui/lib/utils';
import { motion, type Variants } from 'motion/react';

interface WordFadeInProps {
  words: string;
  className?: string;
  delay?: number;
  variants?: Variants;
}

export function WordFadeIn({
  words,
  delay = 0.15,
  variants = {
    hidden: { opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * delay },
    }),
  },
  className,
}: WordFadeInProps) {
  const _words = words.split(' ');

  return (
    <motion.h1
      variants={variants}
      initial="hidden"
      whileInView={'visible'}
      className={cn(
        'font-display text-center text-4xl font-bold tracking-[-0.02em] text-black drop-shadow-xs dark:text-white md:text-7xl md:leading-[5rem]',
        className,
      )}
    >
      {_words.map((word, i) => (
        <motion.span
          key={`word-${
            // biome-ignore lint/suspicious/noArrayIndexKey: Array index is stable here since we're mapping over a fixed slice of children
            i
          }`}
          variants={variants}
          custom={i}
        >
          {word}{' '}
        </motion.span>
      ))}
    </motion.h1>
  );
}
