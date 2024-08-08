"use client";

import React from "react";
import Image from "next/image";

import { Globe } from "@acme/ui/magicui/globe";

const investors = [
  "first-round",
  "andreessen-horowitz",
  "sequoia-capital",
  "benchmark",
  "bessemer",
  "y-combinator",
  "greylock-partners",
  "accel",
];

export function InvestorNetworkSection() {
  return (
    <section
      id="investor-network"
      className="mx-auto flex max-w-screen-xl flex-col gap-8 px-4 md:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-5xl font-bold tracking-tight text-black dark:text-white sm:text-6xl">
          Access the largest investor network in the world
        </h2>
      </div>
      <div className="py-14">
        <div className="container mx-auto px-4 md:px-8">
          <h3 className="text-center text-sm font-semibold text-gray-500">
            TOP INVESTORS
          </h3>
          <div className="relative mt-6">
            <div className="grid grid-cols-2 place-items-center gap-2 md:gap-4 lg:grid-cols-4 xl:gap-x-6 2xl:grid-cols-8">
              {investors.map((investor, index) => (
                <Image
                  key={index}
                  src={`/investor-logos/${investor}.svg`}
                  alt={investor}
                  width={160}
                  height={40}
                  className="h-16 w-40 px-2 brightness-0 dark:invert"
                />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 h-full w-1/3 bg-gradient-to-r from-white dark:from-black"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 h-full w-1/3 bg-gradient-to-l from-white dark:from-black"></div>
          </div>
        </div>
      </div>
      <Globe />
    </section>
  );
}
