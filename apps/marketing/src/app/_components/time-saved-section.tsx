"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

import { NumberTicker } from "@acme/ui/magicui/number-ticker";
import { Text } from "@acme/ui/typography";

export function TimeSavedSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 1, margin: "500px", once: true });

  return (
    <section
      ref={ref}
      id="time-saved"
      className="mx-auto flex max-w-screen-lg flex-col gap-24 px-4 md:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-5xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
          Save Time, Raise More
        </h2>

        <p className="mt-6 text-xl leading-8 text-black/80 dark:text-white">
          Spend less time on fundraising and more time on building your product.
        </p>
      </div>
      {inView && (
        <div className="mx-auto flex w-full flex-col justify-between gap-16 lg:flex-row">
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="whitespace-pre-wrap text-8xl font-medium tracking-tighter text-black dark:text-white">
              <NumberTicker value={124} />
            </p>
            <Text>
              Hours saved / raise{" "}
              <Text variant={"muted"} size={"xs"}>
                avg
              </Text>
            </Text>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="whitespace-pre-wrap text-8xl font-medium tracking-tighter text-black dark:text-white">
              $<NumberTicker value={5} />M
            </p>
            <Text>Avg Seed Round</Text>
          </div>
          <div className="flex flex-col items-center justify-center gap-4">
            <p className="whitespace-pre-wrap text-8xl font-medium tracking-tighter text-black dark:text-white">
              +<NumberTicker value={39} />%
            </p>
            <Text>Investor Engagement</Text>
          </div>
        </div>
      )}
    </section>
  );
}
