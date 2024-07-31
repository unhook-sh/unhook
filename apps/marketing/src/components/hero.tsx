"use client";

import type { Variants } from "framer-motion";
import type { PropsWithChildren } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { Button } from "@acme/ui/button";
import { BorderBeam } from "@acme/ui/magicui/border-beam";

export function Hero(props: PropsWithChildren) {
  return (
    <motion.section
      initial="offscreen"
      viewport={{ amount: 0.8, once: true }}
      whileInView="onscreen"
      variants={{
        onscreen: {
          transition: {
            delayChildren: 0.25,
            staggerChildren: 0.25,
          },
        },
      }}
      className="relative mx-auto mt-32 max-w-[80rem] px-6 text-center md:px-8"
    >
      {props.children}
    </motion.section>
  );
}

export const fadeInVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: -10,
  },
  onscreen: {
    opacity: 1,
    transition: {
      duration: 1,
    },
    y: 0,
  },
};

export const HeroTitle = (props: PropsWithChildren) => {
  return (
    <motion.h1
      variants={fadeInVariants}
      className="text-balance bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-transparent dark:from-white dark:to-white/40 sm:text-6xl md:text-7xl lg:text-8xl"
    >
      {props.children}
    </motion.h1>
  );
};

export const HeroSubTitle = (props: PropsWithChildren) => {
  return (
    <motion.p
      variants={fadeInVariants}
      className="mx-auto mb-12 max-w-xl text-balance text-lg tracking-tight text-gray-400 md:text-xl"
    >
      {props.children}
    </motion.p>
  );
};

export const HeroCta = (props: PropsWithChildren) => {
  return (
    <motion.div variants={fadeInVariants}>
      <Button className="rounded-lg">{props.children}</Button>
    </motion.div>
  );
};

export const HeroImage = (props: { src: string; alt: string }) => {
  return (
    <div className="relative">
      <motion.div
        variants={fadeInVariants}
        className="relative mx-auto my-24 flex h-[400px] w-1/2 flex-col items-center justify-center rounded-lg border md:shadow-xl"
      >
        <Image src={props.src} fill alt={props.alt} />
        <BorderBeam size={250} duration={12} delay={9} />
      </motion.div>
      <div className="absolute inset-0 z-10 rounded-lg bg-gradient-to-t from-background from-0% to-background/40" />
    </div>
  );
};
