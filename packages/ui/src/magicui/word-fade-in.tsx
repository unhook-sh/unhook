'use client';

import { type Variants, motion } from 'motion/react';

import { cn } from '@acme/ui/lib/utils';

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
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
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
