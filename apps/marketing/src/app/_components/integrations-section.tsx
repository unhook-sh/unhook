"use client";

import React, { useRef } from "react";
import Image from "next/image";

import { Icons } from "@acme/ui/icons";
import { cn, twx } from "@acme/ui/lib/utils";
import { AnimatedBeam } from "@acme/ui/magicui/animated-beam";
import { DotPattern } from "@acme/ui/magicui/dot-pattern";
import { ShineBorder } from "@acme/ui/magicui/shine-border";

const Circle = twx.div`z-10 flex size-12 items-center justify-center rounded-full border-2 bg-secondary p-3 shadow-md`;

export function IntegrationsSection({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <section
      id="integrations"
      className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 md:px-8 lg:min-w-[1000px]"
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-5xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
          Pitch with Confidence
        </h2>

        <p className="mt-6 text-xl leading-8 text-black/80 dark:text-white">
          Let AI grade your pitch deck and provide you with actionable insights.
        </p>
      </div>
      <ShineBorder
        className={cn(
          "relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-lg border bg-background p-1 md:p-10 md:shadow-xl",
          className,
        )}
        color={["#75a99c", "#84a6d3", "#9e7aff"]}
        ref={containerRef}
      >
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className={cn(
            "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          )}
        />
        <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
          <div className="flex flex-col justify-center">
            <Circle ref={div7Ref} className="gap-2">
              <Icons.User />
              {/* NoodleCorp Inc. */}
            </Circle>
          </div>
          <div className="flex flex-col justify-center">
            <Circle ref={div6Ref} className="size-16 ring-4 ring-[#75a99c]">
              <Image
                src="/logo-bubble.png"
                width={64}
                height={64}
                alt="Pitch Deck"
              />
            </Circle>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <Circle
              ref={div1Ref}
              className="flex w-48 justify-start gap-2 border-green-400 bg-green-900/90 text-white dark:brightness-75"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-green-600/90 p-2 font-semibold text-white">
                7
              </div>
              Solution
            </Circle>
            <Circle
              ref={div2Ref}
              className="flex w-48 justify-start gap-2 border-green-400 bg-green-900/90 text-white dark:brightness-75"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-green-600/90 p-2 font-semibold text-white">
                8
              </div>
              Market Size
            </Circle>
            <Circle
              ref={div3Ref}
              className="flex w-48 justify-start gap-2 border-yellow-400 bg-yellow-900/90 text-white dark:brightness-75"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-yellow-600/90 p-2 font-semibold text-white">
                6
              </div>
              Business Model
            </Circle>
            <Circle
              ref={div4Ref}
              className="flex w-48 justify-start gap-2 border-red-400 bg-red-900/90 text-white dark:brightness-75"
            >
              <div className="p-1">
                <Icons.AlertTriangle
                  variant={"primary"}
                  className={"stroke-white"}
                />
              </div>
              2 Missing Slides
            </Circle>
            <Circle
              ref={div5Ref}
              className="flex w-48 justify-start gap-2 border-blue-400 bg-blue-900/90 text-white dark:brightness-75"
            >
              <div className="p-2">
                <Icons.Eye variant={"primary"} className={"stroke-white"} />
              </div>
              5 Competitors
            </Circle>
          </div>
        </div>

        {/* AnimatedBeams */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div1Ref}
          toRef={div6Ref}
          duration={3}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div2Ref}
          toRef={div6Ref}
          duration={3}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div3Ref}
          toRef={div6Ref}
          duration={3}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div4Ref}
          toRef={div6Ref}
          duration={3}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div5Ref}
          toRef={div6Ref}
          duration={3}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div6Ref}
          toRef={div7Ref}
          duration={3}
        />
      </ShineBorder>
    </section>
  );
}
