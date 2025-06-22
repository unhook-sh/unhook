'use client';

import { Icons } from '@unhook/ui/custom/icons';
import { cn } from '@unhook/ui/lib/utils';
import { AnimatedBeam } from '@unhook/ui/magicui/animated-beam';
import type React from 'react';
import { forwardRef, useRef } from 'react';
import { Icons as MarketingIcons } from './icons';

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'z-10 flex size-12 items-center justify-center rounded-full border-2 border-border bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]',
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = 'Circle';

export function ThirdBentoAnimation({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        'relative flex h-[500px] w-full items-center justify-center overflow-hidden p-3 md:p-10',
        className,
      )}
      ref={containerRef}
    >
      <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
        <div className="flex flex-col justify-center gap-2">
          <Circle ref={div1Ref}>
            <Icons.Slack variant="muted" />
          </Circle>
          <Circle ref={div2Ref}>
            <Icons.Github variant="muted" />
          </Circle>
          <Circle ref={div3Ref}>
            <Icons.Stripe variant="muted" />
          </Circle>
          <Circle ref={div4Ref}>
            <Icons.Discord variant="muted" />
          </Circle>
          <Circle ref={div5Ref}>
            <Icons.Clerk variant="muted" />
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={div6Ref} className="size-16">
            <MarketingIcons.logo className="size-7 md:size-10" />
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <div
            ref={div7Ref}
            className="text-xs bg-white rounded-full p-2 text-black font-mono border border-border"
          >
            localhost:3000
          </div>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div6Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div6Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div6Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div6Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div6Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div7Ref}
        endXOffset={-62}
      />
    </div>
  );
}
