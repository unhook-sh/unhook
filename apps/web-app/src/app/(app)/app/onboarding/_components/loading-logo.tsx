'use client';

import { motion } from 'motion/react';
import Image from 'next/image';

export function LoadingLogo() {
  return (
    <motion.div
      animate="visible"
      className="flex w-full max-w-[32rem] flex-col items-center gap-8"
      initial="hidden"
      variants={{
        hidden: {
          opacity: 0,
          y: 20,
        },
        visible: {
          opacity: 1,
          transition: {
            duration: 0.6,
            ease: 'easeOut',
            staggerChildren: 0.2,
          },
          y: 0,
        },
      }}
    >
      <motion.div
        className="flex items-center flex-col"
        variants={{
          hidden: {
            opacity: 0,
            scale: 0.9,
            y: 20,
          },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              duration: 0.5,
              ease: 'easeOut',
            },
            y: 0,
          },
        }}
      >
        <motion.div
          animate={['visible', 'loading']}
          className="relative"
          initial="hidden"
          variants={{
            hidden: {
              opacity: 0,
              rotate: -10,
              scale: 0.8,
            },
            loading: {
              rotate: [0, 0, 360, 360, 0],
              // scale: [1, 1.15, 1, 1, 1],
              transition: {
                duration: 4,
                ease: 'easeInOut',
                repeat: Number.POSITIVE_INFINITY,
                times: [0, 0.25, 0.75, 0.9, 1],
              },
            },
            visible: {
              opacity: 1,
              rotate: 0,
              scale: 1,
              transition: {
                duration: 0.8,
                ease: [0.6, -0.05, 0.01, 0.99],
              },
            },
          }}
        >
          <Image
            alt="Unhook Logo"
            className="h-32 w-auto"
            height={128}
            priority
            src="/logo.svg"
            width={120}
          />
        </motion.div>
        <motion.div
          className="text-2xl font-bold mt-4"
          variants={{
            hidden: {
              opacity: 0,
              y: 10,
            },
            visible: {
              opacity: 1,
              transition: {
                duration: 0.5,
                ease: 'easeOut',
              },
              y: 0,
            },
          }}
        >
          Welcome to Unhook
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
