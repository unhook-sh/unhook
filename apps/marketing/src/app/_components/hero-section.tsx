"use client";

import type { PropsWithChildren } from "react";
import { useRef } from "react";
import Image from "next/image";
import { useInView } from "framer-motion";

import { Button } from "@acme/ui/button";
import { cn } from "@acme/ui/lib/utils";
import { AnimatedShinyText } from "@acme/ui/magicui/animated-shiny-text";
import { BorderBeam } from "@acme/ui/magicui/border-beam";

export function HeroSection(props: PropsWithChildren) {
  return (
    <section
      id="hero"
      className="relative mx-auto mt-32 max-w-[80rem] px-6 text-center md:px-8"
    >
      {props.children}
    </section>
  );
}

export const HeroBadge = (props: PropsWithChildren) => {
  return (
    <div className="backdrop-filter-[12px] group inline-flex h-7 items-center justify-between gap-1 rounded-full border border-black/5 px-3 text-xs text-white ease-in hover:cursor-pointer hover:bg-white/20 motion-safe:translate-y-[-1rem] motion-safe:animate-fade-in motion-safe:opacity-0 motion-safe:transition-all dark:border-white/5 dark:bg-white/10 dark:text-black">
      <AnimatedShinyText className="inline-flex items-center justify-center">
        {props.children}
      </AnimatedShinyText>
    </div>
  );
};

export const HeroTitle = (props: PropsWithChildren) => {
  return (
    <h1 className="text-balance bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text py-6 text-5xl font-medium leading-none tracking-tighter text-transparent [--animation-delay:200ms] motion-safe:translate-y-[-1rem] motion-safe:animate-fade-in motion-safe:opacity-0 dark:from-white dark:to-white/40 sm:text-6xl md:text-7xl lg:text-8xl">
      {props.children}
    </h1>
  );
};

export const HeroSubTitle = (props: PropsWithChildren) => {
  return (
    <p className="mb-12 text-balance text-lg tracking-tight text-gray-400 [--animation-delay:400ms] motion-safe:translate-y-[-1rem] motion-safe:animate-fade-in motion-safe:opacity-0 md:text-xl">
      {props.children}
    </p>
  );
};

export const HeroCta = (props: PropsWithChildren) => {
  return (
    <div className="group gap-1 rounded-full text-white ease-in-out [--animation-delay:600ms] motion-safe:translate-y-[-1rem] motion-safe:animate-fade-in motion-safe:opacity-0 dark:text-black">
      <Button className="rounded-full" size="lg">
        {props.children}
      </Button>
    </div>
  );
};

export const HeroImage = (props: {
  src: string;
  alt: string;
  className?: string;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-100px", once: true });

  return (
    <div
      className={cn(
        "relative mt-[8rem] [--animation-delay:400ms] [perspective:2000px] after:absolute after:inset-0 after:z-50 after:[background:linear-gradient(to_top,hsl(var(--background))_30%,transparent)] motion-safe:animate-fade-up motion-safe:opacity-0",
        props.className,
      )}
      ref={ref}
    >
      <div
        className={cn(
          "rounded-xl border border-white/10 bg-white bg-opacity-[0.01] before:absolute before:bottom-1/2 before:left-0 before:top-0 before:h-full before:w-full before:opacity-0 before:[background-image:linear-gradient(to_bottom,var(--color-one),var(--color-one),transparent_40%)] before:[filter:blur(180px)]",
          {
            "motion-safe:before:animate-image-glow": inView,
          },
        )}
      >
        <BorderBeam
          size={200}
          duration={12}
          delay={11}
          colorFrom="var(--color-one)"
          colorTo="var(--color-two)"
        />
        <Image
          src={props.src}
          alt={props.alt}
          width={1920}
          height={800}
          className="relative h-full w-full rounded-[inherit] border object-contain"
        />
      </div>
    </div>
  );
};
